(function() {
  var DropeakValidator, Validator, log;
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  var hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  Validator = require("../validator");

  /**
   * The DropeakValidator takes an elasticsearch query result and compares it to a
   * defined expectation (default is "value is within range of min/max for n
   * times").
   *
   * @class   DropeakValidator
   * @extends  Validator
   */

  module.exports = DropeakValidator = (function(superClass) {
    extend(DropeakValidator, superClass);

    /**
     * Create a new DropeakValidator with the given options.
     * @constructor
     * @param  fieldName {String}  name of the result field (key) to use as comaprison value
     * @param  drop      {int}     minimum allowed value (= lower bound)
     * @param  peak      {int}     maximum allowed value (= upper bound)
     * @param  tolerance {int}     maximum allowed number of consecutive values that do not match the expectation
     */

    function DropeakValidator(config) {
      this.config = config != null ? config : {};
      this.fieldName = this.config.fieldName;
      this.drop = this.config.drop;
      this.peak = this.config.peak;
      this.tolerance = this.config.tolerance;
      this.validate = bind(this.validate, this);
      this.fails = [];
      if (!this.fieldName || this.drop === null || this.peak === null || this.tolerance === null) {
        throw new Error("invalid number of options");
      }
    }

    /*
     * Validate the given elasticsearch query result against the expectation.
     *
     * @method validate
     * @param  data  {Object}  elasticsearch query result
     */

    DropeakValidator.prototype.validate = function(data) {
      var hit, i, len, ref, val;
      if (!data) {
        return false;
      } else {
        this.fails = [];
	if (data.hits.hits.length == 0) {
            log.debug("DropeakValidator.validate: no hits for query! ");
            return false;
        }
        ref = data.hits.hits;
        for (i = 1, len = ref.length-1; i < len; i++) {
          val = ref[i]._source[this.fieldName];
          pre = ref[i-1]._source[this.fieldName];
          pos = ref[i+1]._source[this.fieldName];
	  log.debug("DropeakValidator.validate: checking: " + val );

	    if ((val * this.drop) < pre && (val * this.drop) > pos ) {
	            log.debug("DropeakValidator.validate: peak detected! "+val);
	            this.fails.push(val);
	    } else if ((val / this.peak) > pre && (val / this.peak) > pos ) {
                    log.debug("DropeakValidator.validate: drop detected! "+val);
                    this.fails.push(val);
            } 

          if (this.fails.length > this.tolerance) {
            log.debug("DropeakValidator.validate: more than " + this.tolerance + " consecutive peaks/drops detected!");
            return false;
          }
        }
      }
      return true;
    };


    /**
     * Return human readable error message describing alarm reason. Empty if no
     * validation failed yet.
     *
     * @method getMessage
     * @return {String}
     */

    DropeakValidator.prototype.getMessage = function() {
      return "'" + this.fieldName + "' peaks/drops detected '" + (this.tolerance + 1) + "' consecutive times: '" + (this.fails.join(',')) + "'";
    };

    return DropeakValidator;

  })(Validator);

}).call(this);
