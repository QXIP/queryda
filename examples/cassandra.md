# Cassandra Watcher

## Example

### Dataset
```
t.b.d.
```

### Alert from Command-Line
Once created, execute elasticwatch with the following commandline (or using the *example.json* from the `jobs` dir). 
```
bin/elasticwatch \
--cassadra='{"host":"127.0.0.1"}' \
--query='SELECT val FROM examples.series WHERE id = ?' \
--params='test' \
--validators='{"range":{"fieldName":"renderTime","min":0,"max":500,"tolerance":4}}' \
--reporters='{"console":{}}' --debug --name test
```

### Alert from Config
elasticwatch-js can also be executed using a self-contained configuration file (see [example.json](jobs/example.json))
```
bin/elasticwatch --configfile /path/to/watcherjob.json
```
