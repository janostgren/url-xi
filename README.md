# URL-XI - Extended URL Rest Tester
Can be used to test/monitor REST based API-s and ordinary HTML based request.
Supports all http requests GET,PUT,DELETE,POST, HEAD and OPTIONS.

Url-xi is a simplided version POSTMAN and using the same concept, but has better support for a flow of request and correlation of request. It can also return other metrics than response times of the http requests. 
## System requirements
- Node js : Must be installed
## Installation
Clone from Github or install from npm with 'npm install url-xi -g'  

## Concept
A test case configuration is defined in a JSON file. The configuration can contain several http requests and you can chain them to flow of request with correlation between the requests. Status and response time is reported for each request. Samples are found in the installation directory.
## Correlation/Validation of responses
Extractors are used for correlation of request and for validation of response. 
The following type of extractors are supported:
- JSONPath
- XPath
- Regexp
- JavaScript (not implemted yet)

``` json
"extractors": [
                {
                    "type": "xpath",
                    "expression": "//*[local-name() = 'GameId']/text()",
                    "variable": "gameId"
                },
                {
                    "type": "regexp",
                    "expression": "b:GameId>(\\d+)<",
                    "variable": "gameId2"
                }
            ]

```


## Variables
Variables are used for storing values of exctractors or as input parameters.
``` json
 "variables": [
        {
            "key": "eventId","type":"number","usage":"","value":"let arr=[1,2];arr[Math.floor(Math.random() * arr.length)]"
        },
        {
            "key": "sections","type":"number","usage":"inResponse","value":0
        },
        {
            "key": "capacity","type":"number","usage":"returnValue","value":0,"unit":"seats"
        },
        {
            "key": "venueName","type":"string","usage":"info","value":""
        }
    ]
```
## Running an URL-XI test
url-xi   -f samples/tm_order_tickets.json 

```
url-xi janostgren$ -h
Usage: index [options]

Options:
  -V, --version              output the version number
  -f, --file <config>      test configuration file
  -r, --results <dir>        results dir (default: "./results")
  -xh, --xheaders <headers>  extra headers (default: "{}")
  -d, --debug                output extra debugging
  -h, --help                 display help for command

```




