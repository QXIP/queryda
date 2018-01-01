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

### Alert from Command-Line
Once created, execute queryda with the following commandline (or using the *example.json* from the `jobs` dir). 
```
bin/queryda \
--cassadra='{"host":"127.0.0.1"}' \
--query='SELECT val FROM examples.series WHERE id = ?' \
--params='test' \
--validators='{"range":{"fieldName":"renderTime","min":0,"max":500,"tolerance":4}}' \
--reporters='{"console":{}}' --debug --name test
```

### Alert from Config
queryda can also be executed using a self-contained configuration file (see [example.json](jobs/example.json))
```
bin/queryda --configfile /path/to/watcherjob.json
```
