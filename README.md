<img src="http://i.imgur.com/Od8dRGq.gif" width=260>

# elasticwatch-js <img src="http://imgur.com/eLDoOKY.png"/> 

Elasticwatch-js is a nifty node tool or "watcher" that queries an elasticsearch database and compares the results to one or more given expectations via a pipe of validators. If the results don't match the expectations a reporter is notified and can perform any kind of action (e.g. heat up the coffeemaker via IFTTT before sending an email to your dev team).

This allows to create intelligent alarming setups based on your Elasticsearch data and series, no matter if it's gathered from infrastructure monitoring, RUM data, ecommerce KPIs or anything else. No other tools needed, if set up as a cronjob.

For a natively ELK integrated and advanced alerting plarform, check out our Kibana App [SENTINL](https://github.com/sirensolutions/sentinl)

## Getting started

First clone the git repository and install the dependencies.
```
git clone https://github.com/lmangani/elasticwatch-js.git
cd elasticwatch-js
npm install
```

Then create some data in your elasticsearch ...
```bash
curl -s -XPUT 'http://localhost:9200/monitoring/rum/1' -d '{"requestTime":43,"responseTime":224,"renderTime":568,"timestamp":"2015-03-06T11:47:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/2' -d '{"requestTime":49,"responseTime":312,"renderTime":619,"timestamp":"2015-03-06T12:02:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/3' -d '{"requestTime":41,"responseTime":275,"renderTime":597,"timestamp":"2015-03-06T12:17:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/4' -d '{"requestTime":42,"responseTime":301,"renderTime":542,"timestamp":"2015-03-06T12:32:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/5' -d '{"requestTime":48,"responseTime":308,"renderTime":604,"timestamp":"2015-03-06T12:47:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/6' -d '{"requestTime":43,"responseTime":256,"renderTime":531,"timestamp":"2015-03-06T13:02:34"}'
```

... and run elasticwatch with the following commandline (or using the *example.json* from the `jobs` dir). *NOTE: make sure you have an elasticsearch instance up and running at the given URL*
```
bin/elasticwatch \
--elasticsearch='{"host":"144.76.26.215","port":29200,"index":"monitoring","type":"rum"}' \
--query='{"range":{"timestamp":{"gt":"2015-03-06T12:00:00","lt":"2015-03-07T00:00:00"}}}' \
--aggs='{}' \
--validators='{"range":{"fieldName":"renderTime","min":0,"max":500,"tolerance":4}}' \
--reporters='{"console":{}}' --debug --name test
```

elasticwatch-js can also be executed using a self-contained configuration file (see [example.json](jobs/example.json))
```
bin/elasticwatch --configfile /path/to/watcherjob.json
```

## Configuration
Elasticwatch can be configured either via commandline or using a JSON file (supplied via `--configfile` parameter). Both ways require to specify option groups with individual settings (e.g. for elasticsearch, for the reporters, for the validator, ..). An example JSON file can be found in the `jobs`dir.

The following options are currently available:

### *name (required)*
A name of your choice to identify this job. This will be used by the reporters to identitfy this individual call.

### *elasticsearch (required)*
Settings for elasticsearch, expects the following madatory fields:
- *host*: where to find the elasticsearch host
- *port*: which port elasticsearch is running on
- *index*: the index name to send youe query to
- *type*: the document type to query

### *query* (required)
An elasticsearch query statement. Refer to the [elasticsearch documentation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current) for details about syntax and features. Should return a result set that contains the supplied *fieldName* to match against.

### *aggs* (required)
An elasticsearch aggregation statement. Refer to the [elasticsearch documentation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current) for details about syntax and features. Should return a result set that contains the supplied *aggName* to match against.

### *validators (required)*
Validator(s) to compare the query results against. Expects an object with key/value pairs where *key* ist the name of the validator and *value* is the validator-specific configuration. See [Validators](#validators) for more details.

### *reporters (required)*
Reporter(s) to notify about alarms. Expects an object with key/value pairs where *key* ist the name of the reporter and *value* is the reporter-specific configuration. See [Reporters](#reporters) for more details.

### *configfile*
Name of JSON file to read config from. Expects main options as top-level properties (see [example.json](jobs/example.json) for a live example).

## Validators
A Validator takes a query result received from elasticsearch and compares it against a given expectation. This can be as easy as checking if a value equals a given constant or as complex as checking the average of a series of values against an allowed range with an explicit threshold.

### Available Validators
#### Range
The Range Validator checks a given Field for mix/max boundaries with tolerance factor. 

Expects the following mandatory fields:
- *fieldName*: The name of the field in the result set, that is compared against the defined expectation.
- *min*: The minimum allowed value for all values within the query. If a series of values (as defined through the *tolerance* property) in the result is lower than this minimum an alarm is raised and reported.
- *max*: The maxmimum allowed value for all values within the query. If a series of values (as defined through the *tolerance* property) in the result exceed this maximum an alarm is raised and reported.
- *tolerance*: If a queried series of values exceeds either *min* or *max* for *tolerance*+1 times an alarm is raised.

##### Range Example
```javascript
 "validators": {
    "range": {
	    "fieldName": "value",
	    "min": 0,
	    "max": 500,
	    "tolerance": 4
    }
  },

```
#### Anomalies
The Anomalies Validator can determine clusters of data and then also identify values which
do not identify with any derived cluster and delcare them outliers.

Expects the following mandatory field:
- *fieldName*: The name of the field in the result set, that is tested for series anomalies.

##### Anomalies Example
```javascript
 "validators": {
    "anomalies": {
	    "fieldName": "value",
	    "tolerance": 0

    }
  },

```
### Custom validators
You can create custom validators by creating a new class that extends the `Validator` class (see [RangeValidator](src/validators/range.js) for an example).

## Reporters
By default elasticwatch does nothing more than executing its configured jobs, raising alarms if expectations aren't met. If you want to perform any action in such an alarm case, you have to define a reporter.

To put it simple - reporters are notified about alarms, which means a configured expectation isn't met for a given number of times. They can then do helpful things depending on their type like sending an email, creating a ticket in your ticket system, etc.

Reporters are defined inside a job's config, you can set either one or multiple of them. Most reporters need a specific configuration that is based on the reporter type.

### Available reporters

#### ConsoleReporter
The ConsoleReporter is just meant for demonstration purpose and simply logs a message to the console and has no configuration options.

#### MailReporter
The MailReporter sends an email to one (or multiple) given e-mail address(es). It offers the following configuration:
```javascript
"reporters": {
  "mail": {
    // comma-separated list of target addresses for notification
    "targetAddress": "me@example.com,peng@example.com"
    // number of retry attempts if sending mail fails (defaults to 3)
    "maxRetries": 3
  }
}
```

### Custom reporters
You can create custom reporters by creating a new class that extends the `Reporter` class (see [ConsoleReporter](src/reporters/console.js) for an example).

## Credits
Based on [Coffeescript](https://github.com/ryx/elasticwatch) version by Rico Pfaus. All rights reserved by the respective owners.

