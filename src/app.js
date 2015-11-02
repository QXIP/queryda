(function() {
  var App, Worker, log,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require("loglevel");

  Worker = require("./worker");

  /**
   * The main application logic and entry point. Reads args, sets things up,
   * runs workers.
   *
   * @class  App
   */

  module.exports = App = (function() {

    /**
     * Create a new App based on the given configuration.
     *
     * @constructor
     * @param  config  {Object}  object with configuration options (name, elasticsearch, query, reporter(s) and validator(s) )
     */
    function App(config1) {
      var cfg, j, len, ref, ref1, reporter, reporterName, s;
      this.config = config1;
      this.handleAlarm = bind(this.handleAlarm, this);
      log.debug("App.constructor: creating app", this.config);
      ref = ["name", "elasticsearch", "query", "reporters", "validators"];
      for (j = 0, len = ref.length; j < len; j++) {
        s = ref[j];
        if (!this.config[s]) {
          throw new Error("App.constructor: config." + s + " missing");
        }
      }
      this.reporters = [];
      ref1 = this.config.reporters;
      for (reporterName in ref1) {
        cfg = ref1[reporterName];
        log.debug("App.constructor: creating reporter '" + reporterName + "'");
        reporter = App.createReporter(reporterName, cfg);
        if (reporter) {
          this.reporters.push(reporter);
        }
      }

      this.validators = [];
      ref1 = this.config.validators;
      for (validatorName in ref1) {
        cfg = ref1[validatorName];
        log.debug("App.constructor: creating validator '" + validatorName + "'");
        validator = App.createValidator(validatorName, cfg);
        if (validator) {
          this.validators.push(validator);
        }
      }

/*
      this.validator = App.createValidator("validator", this.config.validator);
      log.debug("App.constructor: creating worker");
*/

      this.worker = App.createWorker(this.config.name, this.config.elasticsearch, this.config.query, this.validators);
      if (this.worker) {
        this.worker.on("alarm", this.handleAlarm);
        this.worker.start();
      } else {
        throw new Error("App.constructor: worker creation failed");
      }

    }


    /**
     * Instantiate Worker according to a given configuration.
     *
     * @method createWorker
     * @static
     * @param  name                  {String}    worker name/id
     * @param  elasticsearchConfig   {Object}    elasticsearch config (host/port/index/type)
     * @param  query                 {Object}    elasticsearch query object
     * @param  validator             {Validator} validator object to be passed to Worker
     */

    App.createWorker = function(name, elasticsearchConfig, query, validator) {
      var e, error;
      if (!name || !elasticsearchConfig || !query || !validator) {
        log.error("App.createWorker: invalid number of options");
        return null;
      }
      try {
        return new Worker(name, elasticsearchConfig.host, elasticsearchConfig.port, "/" + elasticsearchConfig.index + "/" + elasticsearchConfig.type, query, validator);
      } catch (error) {
        e = error;
        log.error("ERROR: worker creation failed: " + e.message);
        return null;
      }
    };


    /**
     * Instantiate a Reporter according to a given configuration.
     *
     * @method createReporter
     * @static
     * @param  name    {String} module name of reporter to create
     * @param  config  {Object} hash with reporter configuration object
     */

    App.createReporter = function(name, config) {
      var e, error, o, r;
      log.debug("App.createReporter: creating reporter: " + name + " ", config);
      try {
        r = require("./reporters/" + name);
        o = new r(config);
        return o;
      } catch (error) {
        e = error;
        log.error("ERROR: failed to instantiate reporter '" + name + "': " + e.message, r);
        return null;
      }
    };


    /**
     * Instantiate a Validator according to a given configuration.
     * @FIXME: currently there is only one validator but in the future there will be more different types
     *
     * @method createValidator
     * @static
     * @param  name    {String} module name of validator to create
     * @param  config  {Object} hash with validator configuration object
     */

    App.createValidator = function(name, config) {
      var e, error, o, r;
      log.debug("App.createValidator: creating validator: " + name + " ", config);
      try {
        r = require("./validators/" + name);
        o = new r(config);
        return o;
      } catch (error) {
        e = error;
        log.error("ERROR: failed to instantiate validator '" + name + "': " + e.message, r);
        return null;
      }
    };

/*
    App.createValidator = function(name, config) {
      var e, error, o;
      log.debug("App.createValidator: creating validator: " + name + " ", config);
      try {
        o = new Validator(config.fieldName, config.min, config.max, config.tolerance);
        return o;
      } catch (error) {
        e = error;
        log.error("ERROR: failed to instantiate validator '" + name + "': " + e.message, o);
        return null;
      }
    };
*/


    /**
     * Handle alarm event sent by a worker. Notifies all exitsing reporters about
     * a given event.
     *
     * @method handleAlarm
     * @param  event {Object}  the event object passed to alarm event
     */

    App.prototype.handleAlarm = function(message, data) {
      var i, j, len, ref, reporter, results;
      log.debug("App.handleAlarm: " + message, data);
      ref = this.reporters;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        reporter = ref[i];
        results.push(reporter.notify(message, data));
      }
      return results;
    };

    return App;

  })();

}).call(this);
