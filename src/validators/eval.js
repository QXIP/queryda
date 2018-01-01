(function() {
  var EvalValidator, Validator, log, jexl;
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  var hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  Jexl = require("jexl");
  var jexl = new Jexl.Jexl();

  Validator = require("../validator");

  /**
   * The EvalValidator takes a query result and compares it to a
   * defined expectation using JEXL expressions.
   *
   * @class   EvalValidator
   * @extends  Validator
   */

  module.exports = EvalValidator = (function(superClass) {
    extend(EvalValidator, superClass);

    /**
     * Create a new EvalValidator with the given options.
     * @constructor
     * @param  fieldName {String}  name of the result field (key) to use as comaprison value
     * @param  exp       {String}  JEXL expression.
     * @param  tolerance {int}     maximum allowed number of consecutive values that do not match the expectation
     */
    // function EvalValidator(fieldName, exp, tolerance) {
    function EvalValidator(config) {
      this.config = config != null ? config : {};
      this.fieldName = this.config.fieldName;
      this.exp = this.config.exp;
      this.tolerance = this.config.tolerance || 0;
      this.validate = bind(this.validate, this);
      this.fails = [];
      if (!this.fieldName || !this.exp || this.tolerance === null) {
        throw new Error("invalid number of options");
      }
    }


    /*
     * Validate the given query result against the expectation.
     *
     * @method validate
     * @param  data  {Object}  query result
     */

    EvalValidator.prototype.validate = function(data) {
      var hit, i, len, ref, val;
      if (!data) {
        return false;
      } else {
	if (data.hits && data.hits.hits.length == 0||!data) {
            log.debug("EvalValidator.validate: no hits for query! ");
            return false;
        }

	if (data.hits && data.hits.hits) {
		this.resp = { data: data.hits.hits };
	} else {
		this.resp = { data: data };
        }

	jexl.eval(this.exp, this.resp).then(function(res) {
		if (!res) { 
		        throw new Error("No Data");
		}
		log.debug("EvalValidator.validate result: "+res);
		if (this.fails) { 
			this.fails.push(res);
			if (this.fails.length > this.tolerance) {
	        	    log.debug("EvalValidator.validate: more than " + this.tolerance + " results occured");
	        	    return false;
	        	}
		}
	}.bind(this));
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

    EvalValidator.prototype.getMessage = function() {
      return "'" + this.fieldName + "' JAXL Expression '" + this.exp + "' for '" + (this.fails.length) + "' consecutive times: '" + (this.fails.join(',')) + "'";
    };

    return EvalValidator;

  })(Validator);

}).call(this);
