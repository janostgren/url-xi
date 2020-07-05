import { TestConfig, ITestConfigData, ITestStep, IExtractor, IRequestConfig, IStepResult } from './testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method, AxiosError } from 'axios'
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

    public setConfigValues(config: IRequestConfig) {
        let jsonStr: string = JSON.stringify(config)
        let s: string = this._testConfig.replaceWithVarVaule(jsonStr)
        let ret: AxiosRequestConfig = JSON.parse(s)
        return ret
    }

    public async run(resultProcessor: TestResultProcessor) {
        if (this._debug)
            console.debug("TestRunner %s started...", this._testConfig.configData.testName);
        try {
            let config: AxiosRequestConfig = {
            }
            if (this._testConfig.configData.config) {
                config = this.setConfigValues(this._testConfig.configData.config)
            }
            if (!config.headers)
                config.headers = {
                    "Content-Type": "application/json"
                }
            config.baseURL = this._testConfig.replaceWithVarVaule(this._testConfig.configData.baseURL)

            let api: Api = new Api(config);
            for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++) {
                let testStep: ITestStep = this._testConfig.configData.steps[idx];
                if (this._debug)
                    console.debug("Running step %s ", testStep.stepName)

                let request: IRequestConfig = testStep.request
                let response: AxiosResponse = JSON.parse("{}");


                let stepConfig: AxiosRequestConfig = this.setConfigValues(request)
                let start:number=Date.now()
                try {
                    response = await api.request(stepConfig)
                }
                catch (error) {
                    let stepResult:IStepResult ={response:error.response,duration:Date.now() - start}
                    
                    resultProcessor.addApiResponse(idx, stepResult);
                    return;
                };

                if (response) {

                    let stepResult:IStepResult ={response:response,duration:Date.now() - start}
                    resultProcessor.addApiResponse(idx, stepResult)
                    if (testStep.extractors) {
                        let value
                        testStep.extractors.forEach(elem => {
                            value = undefined
                            let extractor: IExtractor = elem
                            if (extractor.type.toLowerCase() == "jsonpath") {
                                if (this._debug)
                                    console.debug(extractor)
                                let jp = jsonPath.query(response.data, extractor.expression)
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
            if (error instanceof Error) {
                ;
            }

            console.error(error)

        }
    }

}

export =TestRunner;