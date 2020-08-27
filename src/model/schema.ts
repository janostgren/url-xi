export const testCaseSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
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
              "enum": ["returnValue", "info", "inResponse", "input", ""]
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
                    "expectedStatus": {
                      "minItems": 1,
                      "type": "array",
                      "items": {
                        "type": "number"
                      }
                    },
                    "extractors": {
                      "type": "array",
                      "items": [
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": ["jsonpath", "regexp", "xpath", "header", "cookie"]
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
                    },
                    "transformers": {
                      "type": "array",
                      "items": [
                        {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": ["extract", "replace"]
                            },

                            "source": {
                              "type": "string"
                            },
                            "target": {
                              "type": "string"
                            },
                            "from": {
                              "type": "string"
                            },
                            "to": {
                              "type": "string"
                            }

                          },
                          "required": [
                            "source",
                            "target",
                            "from"

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


