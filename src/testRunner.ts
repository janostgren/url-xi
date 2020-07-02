import { TestConfig, ITestConfigData, ITestStep, IHttpRequest, IExtractor } from './testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import jsonPath from 'jsonpath';


import { Api } from './api';
import { TestResultProcessor } from './testResultProcessor';
class TestRunner {
    private _debug: boolean = false;
    private _testConfig: TestConfig
    constructor(config: TestConfig,debug: boolean = false) {
        this._testConfig = config
        this._debug = debug
    }
    public async run(resultProcessor:TestResultProcessor) {
        if (this._debug)
            console.debug("TestRunner %s started...", this._testConfig.configData.testName);
        try {
            for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++) {
                let testStep: ITestStep = this._testConfig.configData.steps[idx];
                if (this._debug)
                    console.debug("Running step %s ", testStep.stepName)

                let request: IHttpRequest = testStep.request

                let config: AxiosRequestConfig = {
                    baseURL: this._testConfig.configData.baseUrl,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
                let api: Api = new Api(config);
                let response: AxiosResponse;
                let method: string = request.method
                switch (method.toLowerCase) {
                    default:
                        response = await api.get(request.path)

                }
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
                            if (this._debug )
                                console.debug("extractor value=%s",value)
                            if(value) {
                                this._testConfig.setVariableValue(extractor.variable,value)
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