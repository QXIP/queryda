# Cassandra Watcher

## Example

### Dataset
Create Keyspace:
```
cqlsh -e "CREATE KEYSPACE test WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor': 1};" --cqlversion="3.4.4"
```
Create Table:
```
cqlsh -e "CREATE TABLE test.TEST (ID TEXT, NAME TEXT, value TEXT, LAST_MODIFIED_DATE TIMESTAMP, PRIMARY KEY (ID));" --cqlversion="3.4.4"
```
Insert Sample Data:
```
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('2', 'elephant',  '488', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('3', 'elephant',  '598', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('4', 'elephant',  '999', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('5', 'elephant',  '566', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('6', 'elephant',  '521', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('7', 'elephant',  '590', toTimestamp(now()));" --cqlversion="3.4.4" && sleep 1;
```

### Alert from Command-Line + Config File
Once created, execute queryda with the following commandline using the *cqlexample.json* from the `jobs` dir. 
```
bin/queryda --configfile="../jobs/cqlexample.json"
```
###### Output
```
ConsoleReporter.notify: 'SimpleJob-5m' raised alarm: ALARM_VALIDATION_FAILED: 'value' outside range '0-600' for '1' consecutive times: '999'
```

#### Example Configuration
The following examples illustrates a time-bound
```
{
  "name": "SimpleJob-5m",
  "info": "This job simply queries some values and compares them to a given min and max range",
  "cassandra": "127.0.0.1",
  "cqlquery": "SELECT value FROM test.TEST WHERE LAST_MODIFIED_DATE >= '2018-01-01 00:01+0000' AND LAST_MODIFIED_DATE <= toTimestamp(now()) LIMIT 100 ALLOW FILTERING;",
  "params": "null",
  "validators": {
    "range" : {
	    "fieldName": "value",
	    "min": 0,
	    "max": 600,
	    "tolerance": 1
    }
  },
  "reporters": {
    "console": {}
  }
}
```

### Custom Time-Range Function
To allow simple time-range queries in Cassandra 3.x, the following custom Function can be used. Note custom functions requires ```enable_user_defined_functions=true``` in cassandra.yaml ahead of usage.
```
CREATE FUNCTION IF NOT EXISTS toTimestampLast(minutes int) 
  CALLED ON NULL INPUT 
  RETURNS timestamp
  LANGUAGE java AS '
    long now = System.currentTimeMillis();
    if (minutes == null)
      return new Date(now);
    return new Date(now - (minutes.intValue() * 60 * 1000));
  ';
```
Usage:
```
SELECT value FROM test.TEST WHERE LAST_MODIFIED_DATE >= toTimestampLast(60) AND LAST_MODIFIED_DATE <= toTimestamp(now()) LIMIT 100 ALLOW FILTERING;
```
