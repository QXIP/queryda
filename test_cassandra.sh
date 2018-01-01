#!/bin/bash

cqlsh -e "CREATE KEYSPACE test WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor': 1};" --cqlversion="3.4.4"
cqlsh -e "CREATE TABLE test.TEST (ID TEXT, NAME TEXT, value TEXT, LAST_MODIFIED_DATE TIMESTAMP, PRIMARY KEY (ID));" --cqlversion="3.4.4"
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('2', 'elephant',  '488', toTimestamp(now()));" --cqlversion="3.4.4"
sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('3', 'elephant',  '598', toTimestamp(now()));" --cqlversion="3.4.4"
sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('4', 'elephant',  '999', toTimestamp(now()));" --cqlversion="3.4.4"
sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('5', 'elephant',  '566', toTimestamp(now()));" --cqlversion="3.4.4"
sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('6', 'elephant',  '521', toTimestamp(now()));" --cqlversion="3.4.4"
sleep 1;
cqlsh -e "INSERT INTO test.TEST (ID, NAME, value, LAST_MODIFIED_DATE) VALUES ('7', 'elephant',  '590', toTimestamp(now()));" --cqlversion="3.4.4"

bin/queryda --configfile="../jobs/cqlexample.json"
