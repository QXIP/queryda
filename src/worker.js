(function() {
  var Worker, events, http, log,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  http = require("http");
  url = require("url");
  events = require("events");


  /**
   * The Worker does most of the magic. It connects to elasticsearch, queries
   * data, analyzes the result, compares it to the expectation and raises an alarm
   * when appropriate.
   *
   * @class    Worker
   * @extends  events.EventEmitter
   */

  module.exports = Worker = (function(superClass) {
    extend(Worker, superClass);

    Worker.ResultCodes = {
      Success: {
        code: 0,
        label: "SUCCESS"
      },
      ValidationFailed: {
        code: 1,
        label: "ALARM_VALIDATION_FAILED"
      },
      NoResults: {
        code: 2,
        label: "ALARM_NO_RESULTS_RECEIVED"
      },
      NotFound: {
        code: 4,
        label: "ALARM_NOT_FOUND_404"
      },
      InvalidResponse: {
        code: 5,
        label: "ALARM_INVALID_RESPONSE"
      },
      ConnectionRefused: {
        code: 6,
        label: "ALARM_CONNECTION_REFUSED"
      },
      UnhandledError: {
        code: 99,
        label: "ALARM_UNHANDLED_ERROR"
      }
    };


    /**
     * Create a new Worker, prepare data, setup request options.
     *
     * @constructor
     * @param  id        {String}  identifies this individual Worker instance
     * @param  host      {String}  elasticsearch hostname to connect to
     * @param  port      {String}  elasticsearch port to connect to
     * @param  path      {String}  elasticsearch path (in form /{index}/{type})
     * @param  query     {Object}  valid elasticsearch query
     * @param  validator {ResultValidator} a validator object that takes the response and compares it against a given expectation
     */

    function Worker(id, host, port, path, query, validator) {

      if( url.parse(host).auth  ) {
		this.auth = url.parse(host).auth;
		this.host = url.parse(host).host;
		console.log( this.host,this.auth);
      } else {
	        this.host = host;
      }

      this.id = id;
      this.port = port;
      this.path = path;
      this.query = query;
      this.validator = validator;
      this.onError = bind(this.onError, this);
      this.onResponse = bind(this.onResponse, this);
      this.raiseAlarm = bind(this.raiseAlarm, this);
      this.start = bind(this.start, this);
      if (!this.id || !this.host || !this.port || !this.path || !this.query || !this.validator) {
        throw new Error("Worker.constructor: invalid number of options received: " + (JSON.stringify(arguments)));
      }
    }


    /**
     * Execute request and hand over control to onResponse callback.
     *
     * @method start
     */

    Worker.prototype.start = function() {
      var data, e, error1;
      data = JSON.stringify({
        query: this.query
      });
      this.options = {
        host: this.host,
        port: this.port,
        path: this.path + "/_search",
        method: "POST",
	auth: this.auth,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      };
      log.debug("Worker(" + this.id + ").sendESRequest: connecting to elasticsearch at: " + this.host + ":" + this.port + this.path);
      try {
        this.request = http.request(this.options, this.onResponse);
        this.request.on("error", this.onError);
        log.debug("Worker(" + this.id + ").sendESRequest: query data is: ", data);
        this.request.write(data);
        this.request.end();
        return true;
      } catch (error1) {
        e = error1;
        return log.error("Worker(" + this.id + ").start: unhandled error: " + e.message);
      }
    };


    /**
     * Gets passed ES response data (as object) and pre-validates the contents.
     * If data is invalid or result is empty an error is raised. Valid results
     * are handed over to the ResultValidator for further analysis. If any alarm
     * condition is met, raiseAlarm is called with the appropriate alarm.
     *
     * @method handleResponseData
     * @param  data  {Object}  result set as returned by ES
     */

    Worker.prototype.handleResponseData = function(data) {
      var numHits, rc, result;
      result = null;
      rc = Worker.ResultCodes;
      if (!data || typeof data.hits === "undefined") {
        result = rc.InvalidResponse;
      } else {
        numHits = data.hits.total;
        log.debug("Worker(" + this.id + ").onResponse: query returned " + numHits + " hits");

        if (numHits === 0) {
          result = rc.NoResults;
        } else if (!this.validator[0].validate(data)) {
          result = rc.ValidationFailed;
        } else {
          result = rc.Success;
        }
      }
      if (result === rc.Success) {
        return true;
      } else {
        this.raiseAlarm(result.label + ": " + (this.validator.getMessage()));
        process.exitCode = result.code;
        return false;
      }
    };


    /**
     * Raise alarm - emits "alarm" event that can be handled by interested
     * listeners.
     *
     * @method raiseAlarm
     * @emits  alarm
     * @param  message {String}  error message
     * @param  data    {object}  any additional data
     */

    Worker.prototype.raiseAlarm = function(message) {
      log.debug("Worker(" + this.id + ").raiseAlarm: raising alarm: " + message);
      return this.emit("alarm", message, {
        name: this.id
      });
    };


    /**
     * http.request: success callback
     *
     * @method onResponse
     */

    Worker.prototype.onResponse = function(response) {
      var body;
      log.debug("Worker(" + this.id + ").onResponse: status is " + response.statusCode);
      if (response.statusCode === 200) {
        body = "";
        response.setEncoding("utf8");
        response.on("data", (function(_this) {
          return function(chunk) {
            return body += chunk;
          };
        })(this));
        return response.on("end", (function(_this) {
          return function(error) {
            var data, e, error1;
            log.debug("Worker(" + _this.id + ").onResponse: response was: ", body);
            try {
              data = JSON.parse(body);
            } catch (error1) {
              e = error1;
              log.error("Worker(" + _this.id + ").onResponse: failed to parse response data");
            }
            if (data) {
              return _this.handleResponseData(data);
            }
          };
        })(this));
      } else {
        this.raiseAlarm("" + Worker.ResultCodes.NotFound.label);
        process.exitCode = Worker.ResultCodes.NotFound.code;
        this.request.end();
        return process.exit();
      }
    };


    /**
     * http.request: error callback
     *
     * @method onError
     */

    Worker.prototype.onError = function(error) {
      if (error.code === "ECONNREFUSED") {
        log.error("ERROR: connection refused, please make sure elasticsearch is running and accessible under " + this.options.host + ":" + this.options.port);
        this.raiseAlarm("" + Worker.ResultCodes.ConnectionRefused.label);
        process.exitCode = Worker.ResultCodes.ConnectionRefused.code;
      } else {
        log.debug("Worker(" + this.id + ").onError: unhandled error: ", error);
        this.raiseAlarm(Worker.ResultCodes.UnhandledError.label + ": " + error);
        process.exitCode = Worker.ResultCodes.UnhandledError.code;
      }
      return this.request.end();
    };

    return Worker;

  })(events.EventEmitter);

}).call(this);
