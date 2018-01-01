(function() {
  var App, argv, e, error, error1, log, opts, yargs;

  App = require("./app");

  log = require("loglevel");

  yargs = require("yargs");

  argv = yargs.usage("Usage: $0 --name=[name] --[elasticsearch,query,aggs,cassandra,cqlquery,params,reporters,validators]={...} or --config=[config]").epilog("elasticwatch by Rico Pfaus | (c) 2015 | <ricopfaus@gmail.com>\nelasticwatch-js by Lorenzo Mangani | (c) 2015 QXIP BV | <info@qxip.net>").version(function() {
    return require("../package.json").version;
  }).option("name", {
    describe: "identifier for this Job (will be included in reports)",
    type: "string"
  }).option("elasticsearch", {
    describe: "object with elasticsearch settings [host|port|index|type]",
    type: "string"
  }).option("query", {
    describe: "elasticsearch query (e.g. {\"match\":\"*\"})",
    type: "string"
  }).option("aggs", {
    describe: "elasticsearch aggs query (e.g. {\"aggs\":\"*\"})",
    type: "string"

  }).option("cassandra", {
    describe: "object with cassandra settings [host]",
    type: "string"
  }).option("cqlquery", {
    describe: "cql query",
    type: "string"
  }).option("params", {
    describe: "cql params",
    type: "string"

  }).option("reporters", {
    describe: "reporters to notify about alarms (as hash with name:config)",
    type: "string"
  }).option("validators", {
    describe: "validators for checking expectation (as hash with name:config)",
    type: "string"
  }).option("configfile", {
    describe: "optional file with JSON data that supplies all options [elasticsearch|query|aggs|validators|reporters]",
    type: "string"
  }).option("debug", {
    describe: "show additional output (for debugging only)",
    type: "boolean"
  }).argv;

  if (argv.configfile) {
    try {
      opts = require(argv.configfile);
    } catch (error) {
      e = error;
      log.error("ERROR: failed loading configfile: " + e.message);
      process.exitCode = 10;
    }
  } else {
    if (!(argv.name || (argv.elasticsearch || argv.query || argv.aggs) || (argv.cassandra || argv.cqlquery) || argv.reporters || argv.validators)) {
      log.error(yargs.help());
      process.exitCode = 11;
    } else {

      if (argv.elasticsearch){
	      try {
	        opts = {
	          name: argv.name,
	          elasticsearch: JSON.parse(argv.elasticsearch),
	          query: JSON.parse(argv.query),
	          aggs: JSON.parse(argv.aggs),
	          validators: JSON.parse(argv.validators),
	          reporters: JSON.parse(argv.reporters)
	        };
	      } catch (error1) {
	        e = error1;
	        log.error("ERROR: failed parsing elastic commandline options: " + e.message);
	        process.exitCode = 12;
	      }
      } else if (argv.cassandra){
	      try {
	        opts = {
	          name: argv.name,
	          cassandra: argv.cassandra || "127.0.0.1",
	          cqlquery: argv.cqlquery,
	          params: argv.params || "",
	          validators: JSON.parse(argv.validators),
	          reporters: JSON.parse(argv.reporters)
	        };
	      } catch (error1) {
	        e = error1;
	        log.error("ERROR: failed parsing cql commandline options: " + e.message);
	        process.exitCode = 12;
	      }
      }
    }
  }

  if (process.exitCode > 9) {
    process.exit();
  }

  log.setLevel(argv.debug ? 1 : 4);

  new App(opts);

}).call(this);
