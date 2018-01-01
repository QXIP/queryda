#!/bin/bash

ES="127.0.0.1"
PORT="9200"
AUTH="admin:elasticFence"

curl -XPUT "http://$ES:$PORT/monitoring/rum/1" -d '{"requestTime":43,"responseTime":224,"renderTime":568,"timestamp":"2017-09-01T11:47:34"}' -u "$AUTH"
curl -XPUT "http://$ES:$PORT/monitoring/rum/2" -d '{"requestTime":49,"responseTime":312,"renderTime":619,"timestamp":"2017-09-01T12:02:34"}' -u "$AUTH"
curl -XPUT "http://$ES:$PORT/monitoring/rum/3" -d '{"requestTime":41,"responseTime":275,"renderTime":597,"timestamp":"2017-09-01T12:17:34"}' -u "$AUTH"
curl -XPUT "http://$ES:$PORT/monitoring/rum/4" -d '{"requestTime":42,"responseTime":301,"renderTime":542,"timestamp":"2017-09-01T12:32:34"}' -u "$AUTH"
curl -XPUT "http://$ES:$PORT/monitoring/rum/5" -d '{"requestTime":48,"responseTime":308,"renderTime":604,"timestamp":"2017-09-01T12:47:34"}' -u "$AUTH"
curl -XPUT "http://$ES:$PORT/monitoring/rum/6" -d '{"requestTime":43,"responseTime":256,"renderTime":531,"timestamp":"2017-09-01T13:02:34"}' -u "$AUTH"

bin/elasticwatch --debug --configfile="../jobs/example.json"

