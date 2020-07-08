import { TestConfig, ITestConfigData, ITestStep, IExtractor, IRequestConfig, IStepResult } from './testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method, AxiosError } from 'axios'
import {TestBase} from './testbase'
import jsonPath from 'jsonpath';
import xpath from 'xpath';
import xmldom from 'xmldom'

import { Api } from './api';
import { TestResultProcessor } from './testResultProcessor';
class TestRunner extends TestBase{
    
    private _testConfig: TestConfig
    constructor(config: TestConfig, debug: boolean = false) {
        super(debug)
        this._testConfig = config
    }

    public setConfigValues(config: IRequestConfig) {
        let jsonStr: string = JSON.stringify(config)
        let s: string = this._testConfig.replaceWithVarVaule(jsonStr)
        let ret: AxiosRequestConfig = JSON.parse(s)
        return ret
    }

    public async run(resultProcessor: TestResultProcessor) {
        this._logger.debug("TestRunner %s started...", this._testConfig.configData.testName);
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
                
                this._logger.debug("Running step %s ", testStep.stepName)
                let request: IRequestConfig = testStep.request
                if (request.data && Array.isArray(request.data)) {
                    request.data = request.data.join("")
                }
                let response: AxiosResponse = JSON.parse("{}");
                let stepConfig: AxiosRequestConfig = this.setConfigValues(request)
                let start: number = Date.now()
                try {
                    response = await api.request(stepConfig)
                }
                catch (error) {
                    let stepResult: IStepResult = { response: error.response, duration: Date.now() - start }

                    resultProcessor.addApiResponse(idx, stepResult);
                    return;
                };

                if (response) {
                    let stepResult: IStepResult = { response: response, duration: Date.now() - start }
                    resultProcessor.addApiResponse(idx, stepResult)

                    if (response.data && testStep.extractors) {
                        let value
                        testStep.extractors.forEach(elem => {
                            value = undefined
                            try {
                                let extractor: IExtractor = elem
                                if (this._debug)
                                    console.debug(extractor)
                                switch (extractor.type) {
                                    case "jsonpath":

                                        let jp = jsonPath.query(response.data, extractor.expression)
                                        if (jp) {
                                            if (extractor.counter)
                                                value = jp.length
                                            else
                                                value = jp[Math.floor(Math.random() * jp.length)];
                                        }
                                        break
                                    case "xpath":
                                        let p = new xmldom.DOMParser()
                                        let xml = p.parseFromString(response.data)
                                        let nodes = xpath.select(extractor.expression, xml)                         
                                        if(extractor.counter)
                                            value=nodes.length
                                        else if (nodes.length){
                                            let elem = nodes[Math.floor(Math.random() * nodes.length)];
                                            value=elem.valueOf().toString()
                                        }
                                        break
                                    case "regexp":
                                        let regexp: RegExp = new RegExp(extractor.expression, "gm");
                                        let arr = [...response.data.matchAll(regexp)];
                                        if (arr) {
                                            if (extractor.counter)
                                                value = arr.length
                                            else if (arr.length > 0) {
                                                let elem = arr[Math.floor(Math.random() * arr.length)];
                                                if (elem.length > 1)
                                                    value = elem.slice(1).join("")
                                                else
                                                    value = elem[0]
                                            }
                                        }
                                        break
                                }
                                this._logger.debug("extractor value=%s", value)
                                if (value) {
                                    this._testConfig.setVariableValue(extractor.variable, value)
                                }
                            } catch (error) {
                                this._logger.error(error)
                            }
                        })
                    }
                }
            }
        } catch (error) {
            this._logger.error(error)
        }
    }
}

export =TestRunner;