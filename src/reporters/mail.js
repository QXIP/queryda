(function() {
  var MailReporter, Reporter, exec, log,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  log = require("loglevel");

  exec = require('child_process').exec;

  Reporter = require("../reporter");


  /**
   * A Reporter that sends an e-mail to a given address, using the system's mail
   * commandline client.
   *
   * @class    MailReporter
   * @extends  Reporter
   */

  module.exports = MailReporter = (function(superClass) {
    extend(MailReporter, superClass);

    function MailReporter(config) {
      this.config = config != null ? config : {};
      this.maxRetries = this.config.maxRetries || 3;
      this.retryAttempt = 0;
      log.debug("MailReporter.constructor: creating new instance", this.config);
      if (!this.config.targetAddress) {
        log.error("ERROR: mail reporter requires 'targetAddress' in configuration");
      }
    }


    /**
     * Send a mail (using the system's "mail" commandline tool).
     *
     * @method sendMail
     * @param  target      {String}    e-mail address (or comma-separated list of addresses) to send mail to
     * @param  subject     {String}    mail subject
     * @param  body        {String}    message body
     * @param  onSuccess   {Function}  success callback
     * @param  onError     {Function}  error callback
     */

    MailReporter.prototype.sendMail = function(target, subject, body, onSuccess, onError) {
      var child;
      if (onSuccess == null) {
        onSuccess = (function() {});
      }
      if (onError == null) {
        onError = (function() {});
      }
      return child = exec("echo \"" + body + "\" | mail -s \"" + subject + "\" " + target, function(error, stdout, stderr) {
        if (error !== null) {
          return onError(error);
        } else {
          return onSuccess();
        }
      });
    };


    /**
     * Send notification to this reporter.
     */

    MailReporter.prototype.notify = function(message, data) {
      log.debug("MailReporter.notify: '" + data.name + "' raised alarm: " + message);
      return this.sendMail(this.config.targetAddress, "[elasticwatch] " + data.name + " raised alarm", "Hi buddy, \n\nalarm message was: " + message + "\n\nCheers,\nyour elasticwatch", function() {}, (function(_this) {
        return function(error) {
          log.error("ERROR: mail delivery failed: " + error);
          if (_this.retryAttempt < _this.maxRetries) {
            _this.retryAttempt++;
            return _this.notfiy(message, data);
          } else {
            log.error("ERROR: mail delivery failed " + _this.maxRetries + " times");
            return _this.retryAttempt = 0;
          }
        };
      })(this));
    };

    return MailReporter;

  })(Reporter);

}).call(this);
