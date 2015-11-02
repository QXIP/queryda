/**
 * The Reporter is an abstract base class that takes information from a
 * Worker and can do anything with that data. Actual implementations might
 * do things as e.g. send an email or create a ticket.
 *
 * @class  Reporter
 */

(function() {
  var Reporter;

  module.exports = Reporter = (function() {

    /**
     * Create new Reporter with the given configuration object
     *
     * @constructor
     */
    function Reporter(config) {
      this.config = config;
    }


    /**
     * Notify the reporter about available information
     *
     * @method notify
     * @param  type      {String}  type of this notification
     * @param  message   {String}  human-readable message that describes the incident
     * @param  data      {Object}  any kind of data to pass along with the ntofication (might depend on type)
     */

    Reporter.prototype.notify = function(message, data) {};

    return Reporter;

  })();

}).call(this);
