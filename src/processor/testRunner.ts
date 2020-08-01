import { ITestConfigData, ITestStep, IExtractor, IRequest, IRequestConfig } from '../model/ITestConfig'
import { IRequestResult, IStepResult, ITestResults } from '../model/ITestResult'
import { TestConfig } from '../config/testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'
import jsonPath from 'jsonpath';
import xpath from 'xpath';
import xmldom from 'xmldom'

import { Api } from '../lib/api';
import { TestResultProcessor } from './testResultProcessor';
import { Logger } from 'log4js'
import { apiConfig } from '../lib/api.config'
class TestRunner extends TestBase {

    private _testConfig: TestConfig
    constructor(config: TestConfig, debug: boolean = false) {
        super(debug,"TestRunner")
        this._testConfig = config
    }

    public setConfigValues(config: IRequestConfig) {
        let jsonStr: string = JSON.stringify(config)
        let s: string = this._testConfig.replaceWithVarVaule(jsonStr)
        let ret: AxiosRequestConfig = JSON.parse(s)
        return ret
    }
    private extractValues(extractors: IExtractor[], response: AxiosResponse) {

        let value
        extractors.forEach(elem => {
            value = undefined
            try {
                let extractor: IExtractor = elem

                switch (extractor.type) {
                    case "jsonpath":
                        if (response.data) {
                            let jp = jsonPath.query(response.data, extractor.expression)
                            if (jp) {
                                if (extractor.counter)
                                    value = jp.length
                                else
                                    value = jp[Math.floor(Math.random() * jp.length)];
                            }
                        }
                        break
                    case "xpath":
                        if (response.data) {
                            let p = new xmldom.DOMParser()
                            let xml = p.parseFromString(response.data)
                            let nodes = xpath.select(extractor.expression, xml)
                            if (extractor.counter)
                                value = nodes.length
                            else if (nodes.length) {
                                let elem = nodes[Math.floor(Math.random() * nodes.length)];
                                value = elem.valueOf().toString()
                            }
                        }
                        break
                    case "regexp":
                        if (response.data) {
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
                        }
                        break
                    case "header":
                        let headers = response?.headers
                        if (headers)
                            value = headers[extractor.expression]
                        break
                    case "cookie":
                        break

                }
                this._logger.debug("extractor type=%s expression=%s value=%s", extractor.type, extractor.expression, value)
                if (value) {
                    this._testConfig.setVariableValue(extractor.variable, value)
                }
            } catch (error) {
                this._logger.error(error)
            }
        })
    }

    private async runTestStep(step: ITestStep, api: Api) {
        let stepResult:IStepResult= JSON.parse("{}")
        stepResult.success=true
        stepResult.duration =0
        stepResult.requestResults=[]
        try {
            let foundError: boolean = false
            
            for (let idx: number = 0; !foundError && idx < step?.requests.length || 0; idx++) {
                
                let request: IRequest = step.requests[idx]
                let config: IRequestConfig = request.config
                let requestResult:IRequestResult = JSON.parse("{}")
                requestResult.duration =0
                requestResult.success=true
                if (config.data && Array.isArray(config.data)) {
                    config.data = config.data.join("")
                }
                let response: AxiosResponse = JSON.parse("{}");
                let stepConfig: AxiosRequestConfig = this.setConfigValues(config)
                let start: number = Date.now()
                this._logger.debug("executing request: %s:%s",stepConfig?.method,stepConfig?.url)
                let status: number = 0
                let axError: AxiosError = JSON.parse("{}")
                try {
                    response = await api.request(stepConfig)
                }
                catch (error) {
                   
                    if (!error.response) {
                        status = -1
                        this._logger.fatal(error)
                        if (error.isAxiosError)
                            axError = error
                        
                    }
                    response= error?.response
                  
                    foundError = (!request.expectedStatus && request.expectedStatus != status)
                    
                };
                if (response.status) {
                   
                    if (request.extractors) {
                        this.extractValues(request.extractors, response)

                    }
                }
                requestResult.data = response?.data
                requestResult.status = status || response.status
                requestResult.statusText =response?.statusText
                requestResult.duration = start - Date.now()
                requestResult.error=axError
                requestResult.success = !foundError
                stepResult.requestResults.push(requestResult)
                stepResult.duration += requestResult.duration  
                this._logger.debug("Request success=%s",!foundError)
                if(foundError)
                    stepResult.success=false
            }
           
        }
        catch (error) {
            this._logger.error(error)
        }
      
        return stepResult
    }

    public async run() {
        let results:ITestResults= JSON.parse("{}")
       
        results.testName = this._testConfig.configData.testName
        results.baseURL = this._testConfig.configData.baseURL
        results.success = true
        results.variables = this._testConfig.configData?.variables
        results.stepResults=[]

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
            let foundError: boolean = false
            for (let idx: number = 0; !foundError && idx < this._testConfig.configData.steps.length; idx++) {
                let testStep: ITestStep = this._testConfig.configData.steps[idx];
                this._logger.debug("Running step %s ", testStep.stepName)
                let stepResult= await this.runTestStep(testStep,api)
                foundError = !stepResult.success
                this._logger.debug("Step success=%s",stepResult.success)
                results.stepResults.push (stepResult)

            }
            results.success = !foundError
        } catch (error) {
            this._logger.error(error)
        }
        return results
    }
}

export =TestRunner;