(function() {
  var Worker, events, http, log,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  http = require("http");
  url = require("url");
  events = require("events");

  var Clickhouse = require('node-clickhouse');

  /**
   * The Worker does most of the magic. It connects to clickhouse, queries
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
     * @param  host      {String}  clickhouse hostname to connect to
     * @param  query     {Object}  valid clickhouse query
     * @param  params    {Object}  valid variables for query
     * @param  validator {ResultValidator} a validator object that takes the response and compares it against a given expectation
     */

    function Worker(id, host, query, params, validator) {

      this.id = id;
      this.host = host;
      this.query = query;
      this.params = params;
      this.validator = validator;
      this.onError = bind(this.onError, this);
      this.onResponse = bind(this.onResponse, this);
      this.raiseAlarm = bind(this.raiseAlarm, this);
      this.start = bind(this.start, this);
      if (!this.id || !this.host || !this.query || !this.validator) {
	console.log(id,host,query,params );
        throw new Error("Worker.constructor: invalid number of required options received: " + (JSON.stringify(arguments)));
      }
    }


    /**
     * Execute request and hand over control to onResponse callback.
     *
     * @method start
     */

    Worker.prototype.start = function() {
      var data, e, error1;
      log.debug("Worker(" + this.id + ").sendRequest: connecting to clickhouse at: " + this.host);
      try {
	var client = new Clickhouse(this.host);
	client.querying(this.query, {syncParser: true})
	.then(function(data){
		this.onResponse(data);
		return Promise.resolve();
	}.bind(this))
	.catch(function(err){
	        log.error("Worker(" + this.id + ").start: query error: " + err);
		return Promise.resolve();
	}.bind(this));
	return true;

      } catch(err){
	return log.error("Worker(" + this.id + ").start: unhandled error: " + err);
      }

    };


    /**
     * Gets passed response data (as object) and pre-validates the contents.
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
      var alarms = [];
      rc = Worker.ResultCodes;
      if (!data || typeof data === "undefined") {
        result = rc.InvalidResponse;
      } else {
        log.debug("Worker(" + this.id + ").onResponse: query returned " + JSON.stringify(data) );
	data = JSON.parse(JSON.stringify(data));
        if (data === '') {
          result = rc.NoResults;
	  return false;
        } else {
		// Iterate Validators
		this.validator.forEach(function(validator, i){
			if (!validator.validate(data)) {
		          	result = rc.ValidationFailed;
				alarms.push(i);
			        // return false;
		        } else {
		          result = rc.Success;
		        }
		});

	      // if (result === rc.Success) {
	      if (alarms.length === 0) {
	        return true;
	      } else {

		// Iterate Alarms
		for (idx = 0; idx < alarms.length; ++idx) {
		        this.raiseAlarm(result.label + ": " + (this.validator[idx].getMessage()));
		}
	        process.exitCode = result.code;
	           return false;
	      }
	}
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

    Worker.prototype.onResponse = function(body) {
       // log.debug("Worker(" + this.id + ").onResponse: response was: ", body);
         try {
              return this.handleResponseData(body.rows);
	      return;
         } catch (error1) {
              e = error1;
              log.error("Worker(" + this.id + ").onResponse: failed to parse response data",e);
	      this.raiseAlarm("" + Worker.ResultCodes.NotFound.label);
	      process.exitCode = Worker.ResultCodes.NotFound.code;
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
        log.error("ERROR: connection refused, please make sure Clickhouse is running and accessible at " + this.options.host);
        this.raiseAlarm("" + Worker.ResultCodes.ConnectionRefused.label);
        process.exitCode = Worker.ResultCodes.ConnectionRefused.code;
      } else {
        log.debug("Worker(" + this.id + ").onError: unhandled error: ", error);
        this.raiseAlarm(Worker.ResultCodes.UnhandledError.label + ": " + error);
        process.exitCode = Worker.ResultCodes.UnhandledError.code;
      }
      return;
    };

    return Worker;

  })(events.EventEmitter);

}).call(this);
