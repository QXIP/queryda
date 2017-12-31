#!/bin/bash

cqlsh -e "CREATE KEYSPACE test WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor': 1};" --cqlversion="3.4.4"
cqlsh -e "CREATE TABLE test.TEST (ID TEXT, NAME TEXT, value TEXT, LAST_MODIFIED_DATE TIMESTAMP, PRIMARY KEY (ID));" --cqlversion="3.4.4"
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('2', 'elephant',  '568', toTimestamp(now()));" --cqlversion="3.4.4"
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('3', 'elephant',  '598', toTimestamp(now()));" --cqlversion="3.4.4"
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('4', 'elephant',  '999', toTimestamp(now()));" --cqlversion="3.4.4"
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('5', 'elephant',  '566', toTimestamp(now()));" --cqlversion="3.4.4"

bin/elasticwatch \
--cassandra='127.0.0.1' \
--cqlquery='SELECT\value\FROM\test.TEST' \
--params='elephant' \
--validators='{"range":{"fieldName":"renderTime","min":0,"max":500,"tolerance":4}}' \
--reporters='{"console":{}}' --debug --name test_cql

