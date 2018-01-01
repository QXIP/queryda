(function() {
  var RangeValidator, Validator, log;
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  var hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  Validator = require("../validator");

  /**
   * The RangeValidator takes an elasticsearch query result and compares it to a
   * defined expectation (default is "value is within range of min/max for n
   * times").
   *
   * @class   RangeValidator
   * @extends  Validator
   */

  module.exports = RangeValidator = (function(superClass) {
    extend(RangeValidator, superClass);

    /**
     * Create a new RangeValidator with the given options.
     * @constructor
     * @param  fieldName {String}  name of the result field (key) to use as comaprison value
     * @param  min       {int}     minimum allowed value (= lower bound)
     * @param  max       {int}     maximum allowed value (= upper bound)
     * @param  tolerance {int}     maximum allowed number of consecutive values that do not match the expectation
     */
    // function RangeValidator(fieldName, min, max, tolerance) {
    function RangeValidator(config) {
      this.config = config != null ? config : {};
      this.fieldName = this.config.fieldName;
      this.min = this.config.min;
      this.max = this.config.max;
      this.tolerance = this.config.tolerance;
      this.validate = bind(this.validate, this);
      this.fails = [];
      if (!this.fieldName || this.min === null || this.max === null || this.tolerance === null) {
        throw new Error("invalid number of options");
      }
    }


    /*
     * Validate the given elasticsearch query result against the expectation.
     *
     * @method validate
     * @param  data  {Object}  elasticsearch query result
     */

    RangeValidator.prototype.validate = function(data) {
      var hit, i, len, ref, val;
      if (!data) {
        return false;
      } else {
        this.fails = [];
	if (data.hits && data.hits.hits.length == 0||data.rowsLength == 0) {
            log.debug("RangeValidator.validate: no hits for query! ");
            return false;
        }
	if (data.hits && data.hits.hits) {
		data = data.hits.hits;
	}
        ref = data;
        for (i = 0, len = ref.length; i < len; i++) {
          hit = ref[i];
          val = hit[this.fieldName] || hit._source[this.fieldName];
          log.debug("RangeValidator.validate: val " + val);
          if ((this.max && val > this.max) || (this.min && val < this.min)) {
            log.debug("RangeValidator.validate: "+val+" exceeds range");
            this.fails.push(val);
	  }
          if (this.fails.length > this.tolerance) {
            log.debug("RangeValidator.validate: more than " + this.tolerance + " consecutive fails occured");
            return false;
          }
        }
	return;
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

    RangeValidator.prototype.getMessage = function() {
      return "'" + this.fieldName + "' outside range '" + this.min + "-" + this.max + "' for '" + (this.fails.length) + "' consecutive times: '" + (this.fails.join(',')) + "'";
    };

    return RangeValidator;

  })(Validator);

}).call(this);
