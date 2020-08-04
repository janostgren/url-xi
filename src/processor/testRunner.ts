import { ITestStep, IExtractor, IRequest, IRequestConfig, IStepIterator, IAssertion } from '../model/ITestConfig'
import { IRequestResult, IStepResult, ITestResults, IAssertionResult } from '../model/ITestResult'
import { TestConfig } from '../config/testConfig'
import Axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'

import * as helper from '../lib/helpers'
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
        super(debug, "TestRunner")
        this._testConfig = config
    }

    public setConfigValues(config: IRequestConfig) {
        let jsonStr: string = JSON.stringify(config)
        let s: string = this._testConfig.replaceWithVarVaule(jsonStr)
        let ret: AxiosRequestConfig = JSON.parse(s)
        return ret
    }

    private validate(assertions: IAssertion[]) {
        let results: IAssertionResult[] = []
        assertions.forEach(assertion => {
            let ok: boolean = false

            let value: any = ""
            if (assertion.value)
                value = this._testConfig.replaceWithVarVaule(assertion.value)
            let result: IAssertionResult = { "description": assertion.description, "success": false, "value": value, "expression": "", "failStep": assertion?.failStep || false }
            switch (assertion.type) {
                case 'javaScript':
                    try {
                        let s: string = this._testConfig.replaceWithVarVaule(assertion.expression)
                        result.expression = s
                        ok = eval(s) ? true : false
                    }
                    catch (error) {

                    }
                    break;
                case 'regexp':
                    try {
                        let regexp = new RegExp(assertion.expression)
                        result.expression = assertion.expression
                        ok = regexp.test(value)
                    }
                    catch (error) {

                    }
                    break;
                case 'value':
                    result.expression = assertion.expression
                    ok = (value == result.expression)
                    break;
            }
            result.success = ok
            result.failStep = (assertion?.failStep || false) && !ok

            results.push(result)

        })
        return results
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
                                else if (extractor.array)
                                    value = jp
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
                            if (nodes) {
                                if (extractor.counter)
                                    value = nodes.length
                                else if (nodes.length) {
                                    if (Array.isArray(nodes)) {
                                        if (extractor.array) {
                                            let a: string[] = [];
                                            nodes.forEach(node => {
                                                let x: any = node
                                                a.push(x.nodeValue || x.data)

                                            }
                                            )
                                            value = a
                                        }
                                        else {
                                            let ne: any = nodes[Math.floor(Math.random() * nodes.length)];
                                            value = ne.nodeValue || ne.data
                                        }
                                    }
                                    else {
                                        value = nodes
                                    }
                                }
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
                                    if (extractor.array) {
                                        let a: string[] = []
                                        arr.forEach(elem => {
                                            a.push(elem.length > 1 ? elem.slice(1).join("") : elem[0])
                                        }
                                        )
                                        value = a
                                    }
                                    else {
                                        let elem = arr[Math.floor(Math.random() * arr.length)];
                                        if (elem.length > 1)
                                            value = elem.slice(1).join("")
                                        else
                                            value = elem[0]
                                    }
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
        let stepResult: IStepResult = JSON.parse("{}")
        stepResult.stepName = step.stepName
        stepResult.success = true
        stepResult.duration = 0
        stepResult.ignoreDuration = step?.ignoreDuration || false
        stepResult.requestResults = []
        this._testConfig.setVariableValue("$stepName", step.stepName)
        try {
            let foundError: boolean = false
            let iterator: IStepIterator = { "varName": "", "value": 1 }
            let laps: number = 1
            if (step.iterator) {
                iterator = step.iterator
                if (!Array.isArray(iterator.value))
                    iterator.value = this._testConfig.replaceWithVarVaule(iterator.value)
            }
            if (iterator.value && Array.isArray(iterator.value))
                laps = iterator.value.length
            else
                laps = iterator.value || 1
            let varName: string = iterator.varName
            for (let lap: number = 0; !foundError && lap < laps; lap++) {
                if (varName) {
                    let val = iterator.value?.length ? iterator.value[lap] : Number(lap + 1)
                    this._testConfig.setVariableValue(varName, val)
                }
                for (let idx: number = 0; !foundError && idx < step?.requests.length || 0; idx++) {
                    let request: IRequest = step.requests[idx]
                    let config: IRequestConfig = request.config
                    let requestResult: IRequestResult = JSON.parse("{}")
                    requestResult.duration = 0
                    requestResult.success = true
                    if (request.assertions && !stepResult.assertions)
                        stepResult.assertions = []
                    if (config.data ) {
                        if (Array.isArray(config.data) && typeof config?.data[0] === 'string' )
                            config.data = config.data.join("")
                        if (typeof config.data === 'string') {
                            let strdata = this._testConfig.replaceWithVarVaule(config.data)
                            let json = helper.toJson(strdata)
                            config.data = json || strdata
                        }
                    }

                    let response: AxiosResponse = JSON.parse("{}");
                    let stepConfig: AxiosRequestConfig = this.setConfigValues(config)
                    requestResult.config = stepConfig
                    let start: number = Date.now()
                    this._logger.debug("executing request: %s:%s", stepConfig?.method, stepConfig?.url)
                    let axError: AxiosError = JSON.parse("{}")
                    try {
                        response = await api.request(stepConfig)
                    }
                    catch (error) {
                        if (!error.response) {
                            let status: number = error.errno || -1
                            let statusText = error.message
                            this._logger.fatal(error)
                            if (error.isAxiosError)
                                axError = error
                            response = JSON.parse("{}")
                            response.status = status
                            response.statusText = statusText
                        }
                        else {
                            response = error.response
                        }
                        foundError = (!request.expectedStatus && request.expectedStatus != response.status)
                    };
                    if (response.status) {
                        if (request.extractors) {
                            this.extractValues(request.extractors, response)
                        }
                        if (!foundError && request.assertions) {
                            let ar: IAssertionResult[] = this.validate(request.assertions)
                            if (ar.length) {
                                if (!stepResult.assertions)
                                    stepResult.assertions = []
                                stepResult.assertions = stepResult.assertions?.concat(stepResult.assertions, ar)
                                let failStep = ar.find(res => {
                                    return (res.failStep && !res.success)
                                }
                                )
                                foundError = (failStep !== undefined)
                            }
                        }
                    }
                    if (response?.config?.headers)
                        requestResult.config.headers = response?.config?.headers
                    requestResult.status = response.status
                    requestResult.statusText = response?.statusText
                    requestResult.headers = response.headers
                    if (!request.notSaveData)
                        requestResult.data = response?.data
                    requestResult.duration = Date.now() - start
                    requestResult.error = axError
                    requestResult.success = !foundError
                    stepResult.requestResults.push(requestResult)
                    stepResult.duration += requestResult.duration
                    this._logger.debug("Request success=%s, status=%d statusText=%s", !foundError, requestResult.status, requestResult.statusText)
                    if (foundError)
                        stepResult.success = false
                }
            }
        }
        catch (error) {
            this._logger.error(error)
        }
        return stepResult
    }

    public async run() {
        let results: ITestResults = JSON.parse("{}")
        results.testName = this._testConfig.configData.testName
        this._testConfig.setVariableValue("$testName",results.testName)
        results.baseURL = this._testConfig.configData.baseURL
        results.success = true
        results.returnValue = 0
        results.totalDuration = 0
        results.variables = this._testConfig.configData?.variables
        results.stepResults = []
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
                let stepResult = await this.runTestStep(testStep, api)
                foundError = !stepResult.success
                this._logger.debug("Step success=%s, duration=%d", stepResult.success, stepResult.duration)
                results.stepResults.push(stepResult)
                if (!stepResult.ignoreDuration)
                    results.returnValue += stepResult.duration
                results.totalDuration += stepResult.duration
            }
            results.success = !foundError
        } catch (error) {
            this._logger.error(error)
        }
        if (results.variables) {
            let retval = results.variables.find(
                variable => {
                    return variable.usage === 'returnValue' &&
                        variable.type === 'number' &&
                        Number(variable.value) != NaN
                }
            )
            if (retval !== undefined) {
                this._logger.debug("Return value %s", retval.value)
                results.returnValue = Number(retval.value)
            }
        }
        this._logger.debug("Test success=%s, totalDuration=%d", results.success, results.totalDuration)
        return results
    }
}
export =TestRunner;