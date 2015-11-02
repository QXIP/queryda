/**
 * The Validator is an abstract base class that takes information from a
 * Worker and can do anything with that data. Actual implementations might
 * do things as e.g. compare series to thresholds and tolerance factors.
 *
 * @class  Validator
 */

(function() {
  var Validator;

  module.exports = Validator = (function() {

    /**
     * Create new Validator with the given configuration object
     *
     * @constructor
     */
    function Validator(config) {
      this.config = config;
    }


    /**
     * Notify the validator about available information
     *
     * @method notify
     * @param  type      {String}  type of this notification
     * @param  message   {String}  human-readable message that describes the incident
     * @param  data      {Object}  any kind of data to pass along with the ntofication (might depend on type)
     */

    Validator.prototype.notify = function(message, data) {};

    return Validator;

  })();

}).call(this);
