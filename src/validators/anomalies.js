(function() {
  var AnomaliesValidator, Validator, log;
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  var hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  Validator = require("../validator");

  /**
   * The AnomaliesValidator takes an elasticsearch query result and identify 
   * values which do not identify with any derived cluster and delcare them 
   * outliers.
   *
   * @class   AnomaliesValidator
   * @extends  Validator
   */

  module.exports = AnomaliesValidator = (function(superClass) {
    extend(AnomaliesValidator, superClass);

    /**
     * Create a new AnomaliesValidator with the given options.
     * @constructor
     * @param  fieldName {String}  name of the result field (key) to use as comaprison value
     * @param  tolerance {int}     maximum allowed number of consecutive values that do not match the expectation
     */

    function AnomaliesValidator(config) {
      this.config = config != null ? config : {};
      this.fieldName = this.config.fieldName;
      if (!this.config.tolerance) {
		this.tolerance = 0; 
      } else { 
	     	this.tolerance = this.config.tolerance;
      }
      this.validate = bind(this.validate, this);
      this.fails = [];
      if (!this.fieldName || this.min === null || this.max === null || this.tolerance === null) {
        throw new Error("invalid number of options");
      }
    }


    /*
     * Validate the given series for anomalies and return outliers
     *
     * @method clustering.nearness
     * @param  obj  {Object}  series object
     */

     //Detect Cluster Types
     clustering = {};
     clustering.differentiateGroups = function (obj){
	var sortList = [];
	var diffs = {};
	for(var i in obj){
		sortList.push(obj[i]);
	}
	sortList.sort(function(a,b){
   		return a - b;
	});
	for(var i=0; i<sortList.length-1;i++){
		var value1 = sortList[i];
		var value2 = sortList[i+1];
		var diff = Math.abs(Math.abs(value1) - Math.abs(value2));
		if(diffs[diff.toString()] == undefined){
			diffs[diff.toString()] = 1;
		}else{
			diffs[diff.toString()] = diffs[diff.toString()] + 1;
		}
	}
	return diffs;
     }

     //Form clusters as identifiable groups and outliers
     clustering.nearness = function (obj){
	var clusterBounds = clustering.differentiateGroups(obj);
	var bound = 0; 
	var weight = 0;
	for(var i in clusterBounds){
		if(clusterBounds[i] >= weight && Number(i) > bound){
			bound = Number(i);
			weight = clusterBounds[i];
		}
	}
	
	var sortList = [];
	var hashList = {};
	var nameList = {};
	var out = [];
	for(var i in obj){
		nameList[i] = "outlier_"+obj[i];
		sortList.push(obj[i]);
		if(hashList[obj[i]] == undefined){
			hashList[obj[i]] = [i];
		}else{
			hashList[obj[i]].push(i);
		}
	}
	sortList.sort(function(a,b){
   		return a - b;
	});
	var activeCluster = false;
	var currentCluster;
	for(var i=0; i<sortList.length-1;i++){
		var value1 = sortList[i];
		var value2 = sortList[i+1];
		var diff = Math.abs(Math.abs(value1) - Math.abs(value2));
		if(diff <= bound){
			if(activeCluster == false){
				currentCluster = {};
				out.push(currentCluster);
				activeCluster = true;
			}
			
			var vals = hashList[value1].concat(hashList[value2]);
			for(var n in vals){
				var value = vals[n];
				delete nameList[value];
				currentCluster[value] = diff;
			}
		}else{
			
			activeCluster = false;
		}
	}
	return {"clusters":out, "outliers": nameList};
     }


    /*
     * Validate the given elasticsearch query result for series anomalies.
     *
     * @method validate
     * @param  data  {Object}  elasticsearch query result
     */

    AnomaliesValidator.prototype.validate = function(data) {
      var hit, i, len, ref, val;
      if (!data) {
        return false;
      } else {
        this.fails = [];
	if (data.hits.hits.length == 0) {
            log.debug("AnomaliesValidator.validate: no hits for query! ");
            return false;
        }
        ref = data.hits.hits;
	var series = {};
        for (i = 0, len = ref.length; i < len; i++) {
          hit = ref[i];
          val = hit._source[this.fieldName];
	  series[i] = val;
        }
	var res = clustering.nearness(series);
	log.debug('Analyzing series', series, res.outliers);

          if ( Object.getOwnPropertyNames(res.outliers).length === 0 ) {
            this.fails.length = 0;
          } else {
		// Iterate Outliers
		for ( var p in res.outliers ) { this.fails.push(series[p]); }
          }
          if (this.fails.length > this.tolerance) {
            log.debug("AnomaliesValidator.validate: anomalies found in series!");
            return false;
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

    AnomaliesValidator.prototype.getMessage = function() {
      return "'" + this.fieldName + "' series contains '" + this.fails.length + "' anomalies! [" + this.fails + "]";
    };

    return AnomaliesValidator;

  })(Validator);

}).call(this);
