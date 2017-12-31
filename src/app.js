(function() {
  var App, Worker, cqlWorker, log,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require("loglevel");

  Worker = require("./workers/elastic.js");
  cqlWorker = require("./workers/cassandra.js");

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
      var cfg, j, len, ref, ref1, reporter, reporterName, s, ValidatorName, validator;
      this.config = config1;
      this.handleAlarm = bind(this.handleAlarm, this);
      log.debug("App.constructor: creating app", this.config);

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
      for (var validatorName in ref1) {
        cfg = ref1[validatorName];
        log.debug("App.constructor: creating validator '" + validatorName + "'");
        validator = App.createValidator(validatorName, cfg);
        if (validator) {
          this.validators.push(validator);
        }
      }


      if(config.type === "cql") {
	      ref = ["name", "cassandra", "query", "params", "reporters", "validators"];
	      for (j = 0, len = ref.length; j < len; j++) {
	        s = ref[j];
	        if (!this.config[s]) {
	          throw new Error("App.constructor: CQL config." + s + " missing");
	        }
	      }
	      this.worker = App.createCqlWorker(this.config.name, this.config.cassandra, this.config.query, this.config.params, this.validators);
	      if (this.worker) {
	        this.worker.on("alarm", this.handleAlarm);
	        this.worker.start();
	      } else {
	        throw new Error("App.constructor: CQL worker creation failed");
	      }


      } else {
	      ref = ["name", "elasticsearch", "query", "aggs", "reporters", "validators"];
	      for (j = 0, len = ref.length; j < len; j++) {
	        s = ref[j];
	        if (!this.config[s]) {
	          throw new Error("App.constructor: ES config." + s + " missing");
	        }
	      }
	      this.worker = App.createElasticWorker(this.config.name, this.config.elasticsearch, this.config.query, this.config.aggs, this.validators);
	      if (this.worker) {
	        this.worker.on("alarm", this.handleAlarm);
	        this.worker.start();
	      } else {
	        throw new Error("App.constructor: Elastic worker creation failed");
	      }

      }

    }


    /**
     * Instantiate Elastic Worker according to a given configuration.
     *
     * @method createElasticWorker
     * @static
     * @param  name                  {String}    worker name/id
     * @param  elasticsearchConfig   {Object}    elasticsearch config (host/port/index/type)
     * @param  query                 {Object}    elasticsearch query object
     * @param  aggs                  {Object}    elasticsearch aggs object
     * @param  validator             {Validator} validator object to be passed to Worker
     */

    App.createElasticWorker = function(name, elasticsearchConfig, query, aggs, validator) {
      var e, error;
      if (!name || !elasticsearchConfig || !query || !aggs || !validator) {
        log.error("App.createElasticWorker: invalid number of options");
        return null;
      }
      try {
        return new Worker(name, elasticsearchConfig.host, elasticsearchConfig.port, "/" + elasticsearchConfig.index + "/" + elasticsearchConfig.type, query, aggs, validator);
      } catch (error) {
        e = error;
        log.error("ERROR: worker creation failed: " + e.message);
        return null;
      }
    };


    /**
     * Instantiate CQL Worker according to a given configuration.
     *
     * @method createCqlWorker
     * @static
     * @param  name                  {String}    worker name/id
     * @param  cassandraConfig       {Object}    elasticsearch config (host/keyspace)
     * @param  query                 {Object}    elasticsearch query object
     * @param  params                {Object}    elasticsearch params object
     * @param  validator             {Validator} validator object to be passed to Worker
     */

    App.createCqlWorker = function(name, cassandraConfig, query, params, validator) {
      var e, error;
      if (!name || !cassandraConfig || !query || !validator) {
        log.error("App.createCqlWorker: invalid number of options");
        return null;
      }
      try {
        return new cqlWorker(name, cassandraConfig.host, cassandraConfig.keyspace, query, params, validator);
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
