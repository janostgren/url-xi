# URL-XI - Extended URL Rest Tester
Can be used to test/monitor REST based API-s and ordinary HTML based request.
Supports all http requests GET,PUT,DELETE,POST, HEAD and OPTIONS.

Url-xi is a simplified version POSTMAN and using the same concept, but has better support for a flow of request and correlation of request. It can also return other metrics than response times of the http requests. 
## System requirements
- Node js : Must be installed
## Installation
Clone from Github or install from npm with 'npm install url-xi -g'  

## Concept
A test case configuration is defined in a JSON file. The configuration can contain several http requests and you can chain them to flow of request with correlation between the requests. Status and response time is reported for each request. Samples are found in the installation directory.

### Correlation/Validation of responses
Extractors are used for correlation of request and for validation of response. 
The following type of extractors are supported:
- JSONPath
- XPath
- Regexp
- JavaScript (not implemented yet)

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
## Assertions 
Are used validation of response of requests. Assertion works togethers with extractors and variables. Result of assertions are stored in the test result.

``` json
 "assertions": [
                        {
                            "type": "javaScript",
                            "value": "{{origin}}",
                            "description": "Returned origin should contain an IP address. Method={{method}}",
                            "expression": "/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\\.(?!$)|$)){4}$/.test(value)",
                            "failStep": true,
                            "reportFailOnly":true
                        }
                    ]
```

## Variables
Variables are used for storing values of extractors or as input parameters.
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
## Iterator
You can use an iterator to iterate a step in several laps. An iterator can be based on a number or an array. Variable substitution is supported for the value of the iterator. The variable must be of type array and extraction must have the array flag.

### Extractor for iterator 
``` json 
{
    "type": "regexp",
    "expression": "<script\\s+src=\"(.+)\">\\s+<\/script>",
   "variable": "javaScripts",
   "array": true
}
``` 
### Step Example 1 - Get extracted Java Scripts 
``` json 
{
            "stepName": "Get JavaScripts",
            "iterator": {
                "varName": "javaScript",
                "value": "{{javaScripts}}"
            },
            "requests": [
                {
                    "config": {
                        "method": "get",
                        "url": "{{javaScript}}"
                    },
                    "extractors": [],
                    "notSaveData": true
                }
            ]
        },
```
### Step example 2 - Run all http methods
``` json 
{
            "stepName": "HTTP Methods",
            "iterator": {
                "varName": "method",
                "value": [
                    "get",
                    "post",
                    "patch",
                    "put",
                    "delete"
                ]
            },
            "requests": [
                {
                    "config": {
                        "method": "{{method}}",
                        "url": "/{{method}}",
                        "data": "{\"testdata\":true,\"timestamp\":{{$timestamp}}}"
                       
                    },
                    "extractors": [
                        {
                            "type": "header",
                            "expression": "server",
                            "variable": "server"
                        },
                        {
                            "type": "jsonpath",
                            "expression": "$.origin",
                            "variable": "origin"
                        }
                    ],
                    "assertions": [
                        {
                            "type": "javaScript",
                            "value": "{{origin}}",
                            "description": "Returned origin should contain an IP address. Method={{method}}",
                            "expression": "/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\\.(?!$)|$)){4}$/.test(value)",
                            "failStep": true,
                            "reportFailOnly":true
                        }
                    ]
                }
            ]
        }
```
## Request data as a string 
Data in request as JSON is supported by default. If data is string format you must use an array for complex requests. Here comes a SOAP example with xml data.
``` json
{
            "stepName": "Get Remaing Tickets for Game",
            "requests": [
                {
                    "config": {
                        "method": "post",
                        "url": "/CheckGamesService.svc",
                        "data": [
                            "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\" xmlns:tem=\"http://tempuri.org/\">",
                            "<soap:Header xmlns:wsa=\"http://www.w3.org/2005/08/addressing\">",
                            "<wsa:To>http://sesthbwb09p.apica.local:8001/CheckGamesService.svc</wsa:To>",
                            "<wsa:Action>http://tempuri.org/ICheckGamesService/RemainingTicketsPerGameId</wsa:Action></soap:Header>",
                            "<soap:Body>",
                            "<tem:RemainingTicketsPerGameId>",
                            "<tem:gameID>{{gameId}}</tem:gameID>",
                            "<tem:isCachingOff>true</tem:isCachingOff>",
                            "</tem:RemainingTicketsPerGameId>",
                            "</soap:Body>",
                            "</soap:Envelope>"
                        ],
                        "headers": {
                            "SOAPAction": "http://tempuri.org/ICheckGamesService/RemainingTicketsPerGameId"
                        }
                    },
                    "extractors": [
                        {
                            "type": "xpath",
                            "expression": "//*[local-name() = 'RemainingTicketsPerGameIdResult']/text()",
                            "variable": "remainingTickets"
                        }
                    ]
                }
            ]
        }
```
## Supported syntax for requests
Url-xi is based on the Axios framework. It means that the axios syntax for request configuration can be used.
See: https://www.npmjs.com/package/axios

## The test case schema 
A test case is validated with by follow JSON schema
``` json
{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "testName": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "variables": {
        "type": "array",
        "items": [
          {
            "type": "object",
            "properties": {
              "key": {
                "type": "string"
              },
              "type": {
                "type": "string",
                "enum": ["number", "string", "array"]
              },
              "usage": {
                "type": "string",
                "enum": ["returnValue", "info", "inResponse",""]
              },
              "value": {
                
              }
            },
            "required": [
              "key",
              "type",
              "usage"
              
            ]
          }
        ]
      },
      "baseURL": {
        "type": "string"
      },
      "config": {
        "type": "object"
      },
      "steps": {
        "type": "array",
        "minItems": 1,
        "items": [
          {
            "type": "object",
            "properties": {
              "stepName": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "requests": {
                "type": "array",
                "minItems": 1,
                "items": [
                  {
                    "type": "object",
                    "properties": {
                      "config": {
                        "type": "object",
                        "properties": {
                          "method": {
                            "type": "string"
                          },
                          "url": {
                            "type": "string"
                          }
                        },
                        "required": [
                          
                          "url"
                        ]
                      },
                      "extractors": {
                        "type": "array",
                        "items": [
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": ["jsonpath", "regexp", "xpath","header","cookie"]
                              },
                              "expression": {
                                "type": "string"
                              },
                              "variable": {
                                "type": "string"
                              },
                              "index": {
                                "type": "boolean"
                              },
                              "counter": {
                                "type": "boolean"
                              },
                              "array": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "type",
                              "expression",
                              "variable"
                            ]
                          }
                        ]
                      },
                      "assertions": {
                        "type": "array",
                        "items": [
                          {
                            "type": "object",
                            "properties": {
                              "type": {
                                "type": "string",
                                "enum": ["javaScript", "regexp", "value"]
                              },
                              "value": {
                                "type": "string"
                              },
                              "description": {
                                "type": "string"
                              },
                              "expression": {
                                "type": "string"
                              },
                              "failStep": {
                                "type": "boolean"
                              },
                              "reportFailOnly": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "type",
                              "description",
                              "expression"
                             
                            ]
                          }
                        ]
                      }
                    },
                    "required": [
                      "config"
                    
                    ]
                  }
                ]
              }
            },
            "required": [
              "stepName",
              
              "requests"
            ]
          }
        ]
      }
    },
    "required": [
      "testName",
      "baseURL",
      "steps"
    ]
  }


```
## Running an URL-XI test CLI
url-xi   -f samples/tm_order_tickets.json 

``` 
url-xi -h
Usage: index [options]

Options:
  -V, --version                     output the version number
  -f, --file <file>                 test config file
  -r, --results <dir>               results dir
  -xh, --xheaders <headers>         extra headers (default: "{}")
  -u, --url <url>                   base url
  -d, --debug                       output extra debugging
  -nd, --nodata                     No response data in in report
  -po, --parse_only                 parse json only. No not run
  -rn, --result_name <result_name>  name of the result
  -s, --server                      start as server
  -p, --port <port>                 server port (default: "8066")
  -h, --help                        display help for command

```
## Running url-xi as a http server 

```
url-xi -s
[2020-08-05T22:30:41.244] [INFO] url-xi - url-xi(1.8.1) started with [
  '/usr/local/bin/node',
  '/Users/janostgren/work/node/url-xi/dist/cli/index.js',
  '-s'
]
[2020-08-05T22:30:41.252] [INFO] url-xi - URL XI server (version 1.1.5) started on http port 8066
```
### API
 POST http://localhost:8066/api/url-xi/run - Run a test case
 POST http://localhost:8066/api/url-xi/parse - Parse a test case
 ### Supported query parameter
 - nodata = Produce result without data
 - baseUrl = change the base URL. Qual as -u parameter in cli interface


 ```
 curl  -i -X POST -d @./samples/default_test.json http:/localhost:8066/api/url-xi/parse -H "Content-Type: application/json; charset=UTF-8"
HTTP/1.1 100 Continue

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 24
ETag: W/"18-Uv4N+TqqnzgG/uMPTz4ruEfRYrY"
Date: Wed, 05 Aug 2020 20:40:24 GMT
Connection: keep-alive

{"message":"Parsing ok"}
 ```

# Samples
Samples are found in the installation directory of url-xi.
It is the global node directory followed by *url-xi/samples* 
- Linux/Unix : */usr/local/lib/node_modules/url-xi/samples*
- Windows : Dynamic. PC global installs happen under %APPDATA%:

``` bash
$ ls -l /usr/local/lib/node_modules/url-xi/samples
total 80
-rw-r--r--  1 janostgren  admin   4051 26 Okt  1985 app-insight-demo.json
-rw-r--r--  1 janostgren  admin   4579 26 Okt  1985 cldemo_soap_game_service.json
-rw-r--r--  1 janostgren  admin   3015 26 Okt  1985 default_test.json
-rw-r--r--  1 janostgren  admin  10588 26 Okt  1985 http-bin-test.json
-rw-r--r--  1 janostgren  admin    417 26 Okt  1985 tm_home.json
-rw-r--r--  1 janostgren  admin   5944 26 Okt  1985 tm_order_tickets.json
```

## Simple Example
``` json
{
    "testName": "Ticketmonster Home Page",
    "description": "Simple Scenario for the TM home page",
    "baseURL": "http://ticketmonster.apicasystem.com",
    "steps": [
        {
            "stepName": "Home page",
            "requests": [
                {
                    "config": {
                        "url": "/ticket-monster"
                    }
                }
            ]
        }
    ]
}
```
## Advanced Sample - Application Insight
Extract metrics from Microsoft Application Insight with the REST API.
Return value of extracted metrics as the result of the test.
Look at the variable named pageViewDuration. 
The example also have advanced json path correlation. You get the index to the variable **pageViewIndex** and
use it the next extractions. 

``` json
{
    "testName": "Application Insight Demo",
    "description": "Get metrics from Microsoft Application insight",
    "variables": [
        {
            "key": "api_key",
            "type": "string",
            "usage": "",
            "value": "'DEMO_KEY'"
        },
        {
            "key": "application",
            "type": "string",
            "usage": "",
            "value": "'DEMO_APP'"
        },
        {
            "key": "aggregation",
            "type": "string",
            "usage": "",
            "value": "let arr=['max','min','avg'];arr[Math.floor(Math.random() * arr.length)]"
        },
        {
            "key": "pageViewName",
            "type": "string",
            "usage": "inResponse"
        },
        {
            "key": "pageViewIndex",
            "type": "number",
            "usage": "",
            "value":0
        },
        {
            "key": "pageViewDuration",
            "type": "number",
            "usage": "returnValue",
            "value":0
        }
    ],
    "baseURL": "https://api.applicationinsights.io",
    "config": {
        "headers": {
            "x-api-key": "{{api_key}}"
        }
    },
    "steps": [
        {
            "stepName": "Get Page views",
            
            "requests": [
                {
                    "config": {
                        "method": "post",
                        "url": "/v1/apps/{{application}}/metrics",
                        "data": [
                            {
                                "id": "Page Views duration per path for Edge",
                                "parameters": {
                                    "metricId": "pageViews/duration",
                                    "aggregation": "{{aggregation}}",
                                    "timespan": "PT240H",
                                    "segment": "pageView/name,pageView/urlPath",
                                    "filter": "startswith(client/browser,'Edg')"
                                }
                            }
                        ]
                    },
                    "extractors": [
                        {
                            "type": "jsonpath",
                            "expression": "$[0].body.value.segments[*].pageView/name",
                            "variable": "pageViewIndex",
                            "index":true
                        },
                        {
                            "type": "jsonpath",
                            "expression": "$[0].body.value.segments[{{pageViewIndex}}].pageView/name",
                            "variable": "pageViewName"
                        },
                        {
                            "type": "jsonpath",
                            "expression": "$[0].body.value.segments[{{pageViewIndex}}].segments[0].pageViews/duration.{{aggregation}}",
                            "variable": "pageViewDuration"
                        },
                        {
                            "type": "jsonpath",
                            "expression": "$[0].id",
                            "variable": "id"
                        }
                       
                    ],
                    "assertions": [
                        {
                            "type": "javaScript",
                            "value": "{{pageViewDuration}}",
                            "description": "Duration should be greather than 1 ms",
                            "expression": "value > 1",
                            "failStep": true
                        },
                        {
                            "type": "regexp",
                            "value": "{{aggregation}}",
                            "description": "Aggregation must be max,min or avg",
                            "expression": "(max|min|avg)",
                            "failStep": true
                        }
                       
                    ]
                }     
            ]
        }
    ]
}
```
## Result report example 
This example is without result data. The nodata switch is used.

``` json
{
    "testName": "Application Insight Demo",
    "baseURL": "https://api.applicationinsights.io",
    "success": true,
    "returnValue": 6995,
    "duration": 1032,
    "startTime": 1597227839118,
    "variables": [
        {
            "key": "api_key",
            "type": "string",
            "usage": "",
            "value": "DEMO_KEY"
        },
        {
            "key": "application",
            "type": "string",
            "usage": "",
            "value": "DEMO_APP"
        },
        {
            "key": "aggregation",
            "type": "string",
            "usage": "",
            "value": "avg"
        },
        {
            "key": "pageViewName",
            "type": "string",
            "usage": "inResponse",
            "value": "Home Page"
        },
        {
            "key": "pageViewIndex",
            "type": "number",
            "usage": "",
            "value": 0
        },
        {
            "key": "pageViewDuration",
            "type": "number",
            "usage": "returnValue",
            "value": 6995
        }
    ],
    "stepResults": [
        {
            "stepName": "Get Page views",
            "success": true,
            "duration": 1032,
            "startTime": 1597227839119,
            "ignoreDuration": false,
            "requestResults": [
                {
                    "duration": 1032,
                    "success": true,
                    "config": {
                        "method": "post",
                        "url": "/v1/apps/DEMO_APP/metrics",
                        "data": [
                            {
                                "id": "Page Views duration per path for Edge",
                                "parameters": {
                                    "metricId": "pageViews/duration",
                                    "aggregation": "avg",
                                    "timespan": "PT240H",
                                    "segment": "pageView/name,pageView/urlPath",
                                    "filter": "startswith(client/browser,'Edg')"
                                }
                            }
                        ],
                        "headers": {
                            "Accept": "application/json, text/plain, */*",
                            "Content-Type": "application/json;charset=utf-8",
                            "x-api-key": "DEMO_KEY",
                            "User-Agent": "axios/0.19.2",
                            "Content-Length": 222
                        }
                    },
                    "startTime": 1597227839119,
                    "status": 200,
                    "statusText": "OK",
                    "headers": {
                        "date": "Wed, 12 Aug 2020 10:24:00 GMT",
                        "content-type": "application/json; charset=utf-8",
                        "content-length": "263",
                        "connection": "close",
                        "vary": "Accept-Encoding, Accept, Accept-Encoding",
                        "strict-transport-security": "max-age=15724800; includeSubDomains",
                        "via": "1.1 draft-oms-57889876d8-xgjgh",
                        "x-content-type-options": "nosniff",
                        "access-control-allow-origin": "*",
                        "access-control-expose-headers": "Retry-After,Age,WWW-Authenticate,x-resource-identities,x-ms-status-location"
                    },
                    "error": {}
                }
            ],
            "assertions": [
                {
                    "description": "Duration should be greater than 1 ms",
                    "success": true,
                    "value": "6995",
                    "expression": "value > 1",
                    "failStep": false
                },
                {
                    "description": "Aggregation must be max,min or avg",
                    "success": true,
                    "value": "avg",
                    "expression": "(max|min|avg)",
                    "failStep": false
                }
            ]
        }
    ]
}
```





