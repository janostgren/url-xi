import { TestConfig, ITestConfigData, ITestStep, IHttpRequest, IExtractor } from './testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import jsonPath from 'jsonpath';


import { Api } from './api';
import { TestResultProcessor } from './testResultProcessor';
class TestRunner {
    private _debug: boolean = false;
    private _testConfig: TestConfig
    constructor(config: TestConfig, debug: boolean = false) {
        this._testConfig = config
        this._debug = debug
    }
    public async run(resultProcessor: TestResultProcessor) {
        if (this._debug)
            console.debug("TestRunner %s started...", this._testConfig.configData.testName);
        try {
            for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++) {
                let testStep: ITestStep = this._testConfig.configData.steps[idx];
                if (this._debug)
                    console.debug("Running step %s ", testStep.stepName)

                let request: IHttpRequest = testStep.request
                let response: AxiosResponse;
                let method: Method = "GET"
                switch (request.method.toLowerCase()) {
                    case 'get':
                        method = "GET"
                        break
                    case 'post':
                        method = "POST"
                        break
                    case 'put':
                        method = "PUT"
                        break
                    case 'patch':
                        method = "PATCH"
                        break
                    case 'delete':
                        method = "DELETE"
                        break
                    case 'head':
                        method = "HEAD"
                        break
                    case 'options':
                        method = "OPTIONS"
                        break
                    case 'link':
                        method = "link"
                        break
                }
               
                let config: AxiosRequestConfig = {
                    baseURL: this._testConfig.configData.baseUrl,
                    method:method,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
                let api: Api = new Api(config);
                let path:string = this._testConfig.replaceWithVarVaule(request.path)
                console.log("path=%s",path)
                /*
                if(request.path)
                    config.url=request.path
                response = await api.request(config)
                */
               response = await api.get(request.path)
                if (response) {
                    //console.debug(response.data)
                    if (testStep.extractors) {
                        let value
                        testStep.extractors.forEach(elem => {
                            value = undefined
                            let extractor: IExtractor = elem
                            if (extractor.type.toLowerCase() == "jsonpath") {
                                if (this._debug)
                                    console.debug(extractor)
                                let jp = jsonPath.query(response.data, extractor.expression)
                                if (this._debug)
                                    console.debug(jp, jp.length)
                                if (jp) {
                                    if (extractor.counter)
                                        value = jp.length
                                    else
                                        value = jp[Math.floor(Math.random() * jp.length)];
                                }
                            }
                            if (this._debug)
                                console.debug("extractor value=%s", value)
                            if (value) {
                                this._testConfig.setVariableValue(extractor.variable, value)
                            }

                        })
                    }
                }
            }
        } catch (error) {
            console.error(error)

        }
    }

}

export =TestRunner;