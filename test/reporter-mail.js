// Generated by CoffeeScript 1.10.0
(function() {
  var MailReporter, assert, childProcessMock, loglevelMock, mockery, reporter;

  mockery = require("mockery");

  assert = require("chai").assert;

  reporter = [][0];

  loglevelMock = {
    debug: function(str) {
      return this.strDebug = str;
    },
    error: function(str) {
      return this.strError = str;
    }
  };

  childProcessMock = {
    mailCommand: "",
    exec: (function(_this) {
      return function(command, callback) {
        childProcessMock.mailCommand = command;
        return callback(null);
      };
    })(this)
  };

  mockery.enable({
    useCleanCache: true
  });

  mockery.registerMock("loglevel", loglevelMock);

  mockery.registerMock("child_process", childProcessMock);

  mockery.registerAllowables(["../src/reporters/console", "../reporter"]);

  MailReporter = require("../src/reporters/mail");

  describe("MailReporter", function() {
    describe("init", function() {
      it("should output a log message during construction", function() {
        new MailReporter();
        return assert.include(loglevelMock.strDebug, "creating new instance");
      });
      it("should throw an error if no target address is supplied", function() {
        new MailReporter();
        return assert.include(loglevelMock.strError, "requires 'targetAddress'");
      });
      it("should set maxRetries to the supplied value [10]", function() {
        reporter = new MailReporter({
          maxRetries: 10
        });
        return assert.equal(reporter.maxRetries, 10);
      });
      return it("should set maxRetries to 3 if only an e-mail address is defined", function() {
        reporter = new MailReporter({
          targetAddress: "test@example.com"
        });
        return assert.equal(reporter.maxRetries, 3);
      });
    });
    return describe("notify", function() {
      it("should call sendMail with the appropriate message", function() {
        reporter = new MailReporter({
          targetAddress: "test@example.com"
        });
        reporter.notify("myMessage", {
          name: "myname"
        });
        return assert.include(childProcessMock.mailCommand, "myMessage");
      });
      it("should log error if sending mail fails", function() {
        childProcessMock.exec = (function(_this) {
          return function(command, callback) {
            return callback("someError");
          };
        })(this);
        reporter = new MailReporter({
          targetAddress: "test@example.com"
        });
        reporter.notify("myMessage", {
          name: "myname"
        });
        return assert.include(loglevelMock.strError, "mail delivery failed");
      });
      return it("should retry sending the mail on error", function() {});
    });
  });

}).call(this);
