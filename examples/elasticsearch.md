# Elastic Watcher

## Example

### Dataset
Once installed, create some fictional data in our elasticsearch
```bash
curl -s -XPUT 'http://localhost:9200/monitoring/rum/1' -d '{"requestTime":43,"responseTime":224,"renderTime":568,"timestamp":"2015-03-06T11:47:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/2' -d '{"requestTime":49,"responseTime":312,"renderTime":619,"timestamp":"2015-03-06T12:02:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/3' -d '{"requestTime":41,"responseTime":275,"renderTime":597,"timestamp":"2015-03-06T12:17:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/4' -d '{"requestTime":42,"responseTime":301,"renderTime":542,"timestamp":"2015-03-06T12:32:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/5' -d '{"requestTime":48,"responseTime":308,"renderTime":604,"timestamp":"2015-03-06T12:47:34"}'
curl -s -XPUT 'http://localhost:9200/monitoring/rum/6' -d '{"requestTime":43,"responseTime":256,"renderTime":531,"timestamp":"2015-03-06T13:02:34"}'
```
### Alert from Command-Line
Once created, execute elasticwatch with the following commandline (or using the *example.json* from the `jobs` dir). 
```
bin/elasticwatch \
--elasticsearch='{"host":"localhost","port":9200,"index":"monitoring","type":"rum"}' \
--query='{"range":{"timestamp":{"gt":"2015-03-06T12:00:00","lt":"2015-03-07T00:00:00"}}}' \
--aggs='{}' \
--validators='{"range":{"fieldName":"renderTime","min":0,"max":500,"tolerance":4}}' \
--reporters='{"console":{}}' --debug --name test
```

### Alert from Config
elasticwatch-js can also be executed using a self-contained configuration file (see [example.json](jobs/example.json))
```
bin/elasticwatch --configfile /path/to/watcherjob.json
```
