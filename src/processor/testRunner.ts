import { ITestStep, IExtractor, IRequest, IRequestConfig, IStepIterator, IAssertion, ITransformer } from '../model/ITestConfig'
import { IRequestResult, IStepResult, ITestResults, IAssertionResult } from '../model/ITestResult'
import { TestConfig } from '../config/testConfig'
import Axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'

import * as helper from '../lib/helpers'

import { JSONPath } from 'jsonpath-plus';
import xpath from 'xpath';
import xmldom from 'xmldom'

import { Api } from '../lib/api';
import { TestResultProcessor } from './testResultProcessor';
import { Logger } from 'log4js'
import { apiConfig } from '../lib/api.config'

const resultConfig = {
    contentLength: {
        maxRequestLength: 64 * 1024,
        maxTotalLength: 256 * 1024
    }
}
export class TestRunner extends TestBase {

    private _testConfig: TestConfig
    constructor(config: TestConfig, debug: boolean = false) {
        super(debug, "TestRunner")
        this._testConfig = config
    }

    public setConfigValues(config: IRequestConfig) {
        let regex = /{{.*}}/
        let jsonStr: string = JSON.stringify(config)
        while (regex.test(jsonStr)) {
            jsonStr = this._testConfig.replaceWithVarVaule(jsonStr)
        }
        let ret: AxiosRequestConfig = JSON.parse(jsonStr)

        return ret
    }

    public replaceFromJSON(json: any) {
        let jsonStr: string = JSON.stringify(json)
        let s: string = this._testConfig.replaceWithVarVaule(jsonStr)
        let ret: any = JSON.parse(s)
        return ret
    }

    private transform(transformers: ITransformer[]) {
        transformers.forEach(transformer => {
            let vars = transformer.target.split(",")
            let value: string = this._testConfig.replaceWithVarVaule(transformer.source)
            switch (transformer.type) {
                case 'extract':
                    let regExp: RegExp = new RegExp(transformer.from)
                    let results = regExp.exec(value)
                    if (results) {
                        if (results.length === 1) {
                            if (vars.length > 0)
                                this._testConfig.setVariableValue(vars[0], results[0])
                        }
                        else {
                            for (let idx: number = 1; idx < results.length; idx++) {
                                if (vars.length >= idx) {
                                    this._testConfig.setVariableValue(vars[idx - 1], results[idx])
                                }
                            }
                        }
                    }
                    break;
                case 'replace':
                    if (transformer.to) {
                        let newValue: string = value.replace(transformer.from, transformer.to)
                        for (let idx: number = 0; idx < vars.length; idx++) {
                            this._testConfig.setVariableValue(vars[idx], newValue)
                        }
                    }
            }

        });
    }

    private validate(assertions: IAssertion[]) {
        let results: IAssertionResult[] = []
        assertions.forEach(assertion => {
            let ok: boolean = false
            let description = this._testConfig.replaceWithVarVaule(assertion.description)
            let value: any = ""
            if (assertion.value)
                value = this._testConfig.replaceWithVarVaule(assertion.value)
            let result: IAssertionResult = { "description": description, "success": false, "value": value, "expression": "", "failStep": assertion?.failStep || false }
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
            if (!assertion?.reportFailOnly || !ok)
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

                let expression: string = this._testConfig.replaceWithVarVaule(extractor.expression)


                switch (extractor.type) {
                    case "jsonpath":
                        if (response.data) {
                            //let jp = jsonPath.query(response.data, extractor.expression)
                            let jp = JSONPath({ path: expression, json: response.data })
                            if (jp) {
                                if (extractor.counter)
                                    value = jp.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * jp.length)
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
                            let nodes = xpath.select(expression, xml)
                            if (nodes) {
                                if (extractor.counter)
                                    value = nodes.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * nodes.length)
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
                            let regexp: RegExp = new RegExp(expression, "gm");
                            let arr = [...response.data.matchAll(regexp)];
                            if (arr) {
                                if (extractor.counter)
                                    value = arr.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * arr.length)
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
                            value = headers[
                                expression]
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

    private async runTestStep(step: ITestStep, api: Api, nodata: boolean) {
        let stepResult: IStepResult = JSON.parse("{}")
        stepResult.stepName = step.stepName
        stepResult.success = true
        stepResult.duration = 0
        stepResult.contentLength = 0
        stepResult.startTime = Date.now()
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
                this._testConfig.setVariableValue("$lap", lap)
                this._testConfig.setVariableValue("$lapIdx1", lap + 1)
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
                    if (config.data) {
                        if (Array.isArray(config.data) && typeof config?.data[0] === 'string')
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
                    requestResult.startTime = start
                    requestResult.contentLength = 0
                    this._logger.debug("executing request: %s:%s", stepConfig?.method || 'get', stepConfig?.url)
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
                        if (request.transformers) {
                            this.transform(request.transformers)
                        }
                        if (!foundError && request.assertions) {
                            let assres: IAssertionResult[] = this.validate(request.assertions)
                            if (assres.length) {
                                if (!stepResult.assertions)
                                    stepResult.assertions = []
                                //stepResult.assertions = stepResult.assertions?.concat(stepResult.assertions, assres)
                                assres.forEach(assertion => {
                                    stepResult.assertions?.push(assertion)
                                })
                                let failStep = assres.find(res => {
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
                    let cl = response.headers["content-length"]
                    if (cl !== undefined)
                        requestResult.contentLength = Number(cl)
                    else if (response.data) {
                        if (typeof response.data === 'string')
                            requestResult.contentLength = response.data.length
                        else {
                            requestResult.contentLength = JSON.stringify(response.data)?.length || 0
                        }
                    }


                    this._testConfig.setVariableValue("$contentLength", requestResult.contentLength)
                    let bigContent: boolean = requestResult.contentLength > resultConfig.contentLength.maxRequestLength
                    if (bigContent)
                        this._logger.debug("Content length [%d] is greater than max length to save [%d]. Result not saved ",
                            requestResult.contentLength, resultConfig.contentLength.maxRequestLength)
                    if (!bigContent && !nodata && !request.notSaveData)
                        requestResult.data = response?.data
                    requestResult.duration = Date.now() - start
                    requestResult.error = axError
                    requestResult.success = !foundError
                    stepResult.requestResults.push(requestResult)
                    stepResult.duration += requestResult.duration
                    stepResult.contentLength += requestResult.contentLength
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

    public async run(nodata?: boolean) {
        let results: ITestResults = JSON.parse("{}")
        results.testName = this._testConfig.configData.testName
        this._testConfig.setVariableValue("$testName", results.testName)
        results.baseURL = this._testConfig.configData.baseURL
        results.success = false
        results.returnValue = 0
        results.duration = 0
        results.contentLength = 0
        results.startTime = Date.now()
        results.variables = []
        if (this._testConfig.configData?.variables) {
            let errors: any = []
            this._testConfig.configData.variables.forEach(variable => {
                switch (variable.usage) {
                    case 'inResponse':
                    case 'returnValue':
                    case 'input':
                        results.variables?.push(variable)
                        if (variable.validation !== undefined) {
                            try {
                                let value = variable.value
                                let ok: boolean = eval(variable.validation) ? true : false
                                if (!ok) {
                                    let message: string = `Validation of input parameter ${variable.key} failed. Value=${value}`
                                    this._logger.error(message)
                                    errors.push(message)
                                }

                            }
                            catch (error) {
                                errors.push(error.message)

                            }
                        }
                }

            })
            if (errors.length)
                results.errors = errors
        }
        results.stepResults = []
        if (!results.errors) {
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
                    let stepResult = await this.runTestStep(testStep, api, nodata || false)
                    foundError = !stepResult.success
                    this._logger.debug("Step success=%s, duration=%d", stepResult.success, stepResult.duration)
                    results.stepResults.push(stepResult)
                    if (!stepResult.ignoreDuration)
                        results.returnValue += stepResult.duration
                    results.duration += stepResult.duration
                    results.contentLength += stepResult.contentLength
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
        }
        this._logger.debug("Test success=%s, duration=%d", results.success, results.duration)
        return results
    }
}
