import { ResultConfig, ITestStep, IRequest, IRequestConfig, IStepIterator } from '../model/ITestConfig'
import { IRequestResult, IStepResult, ITestResults, IAssertionResult } from '../model/ITestResult'
import { TestConfig } from '../config/testConfig'
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { PrePostProcessors } from './prePostProcessors'

import { TestBase } from '../lib/testbase'

import * as helper from '../lib/helpers'

import { Api } from '../lib/api';

import qs from 'qs'


export class TestRunner extends TestBase {

    private _testConfig: TestConfig
    private _prePostProcessors: PrePostProcessors
    constructor(config: TestConfig, debug: boolean = false) {
        super(debug, "TestRunner")
        this._testConfig = config
        this._prePostProcessors = new PrePostProcessors(config, debug)
    }

    public setConfigValues(config: IRequestConfig) {
        let regex = /{{.*}}/
        let jsonStr: string = JSON.stringify(config)
        while (regex.test(jsonStr)) {
            jsonStr = this._testConfig.replaceWithVarValue(jsonStr)
        }
        let ret: AxiosRequestConfig = JSON.parse(jsonStr)

        return ret
    }

    public replaceFromJSON(json: any) {
        let jsonStr: string = JSON.stringify(json)
        let s: string = this._testConfig.replaceWithVarValue(jsonStr)
        let ret: any = JSON.parse(s)
        return ret
    }


    private async runTestStep(step: ITestStep, api: Api, nodata: boolean, idleBetweenRequest: number) {
        let stepResult: IStepResult = JSON.parse("{}")
        this._prePostProcessors.runBeforeScripts(step)
        stepResult.stepName = step.stepName
        stepResult.success = false
        stepResult.duration = 0
        stepResult.contentLength = 0
        stepResult.startTime = Date.now()
        stepResult.ignoreDuration = step?.ignoreDuration || false
        stepResult.requestResults = []
        if (step.idleBetweenRequests) {
            let idleTime = step.idleBetweenRequests
            if (isNaN(idleTime))
                idleTime = this._testConfig.replaceWithVarValue(step.idleBetweenRequests)

            if (!isNaN(idleTime)) {
                idleBetweenRequest = idleTime
                this._logger.debug("Idle between request in step =%d", idleBetweenRequest)
            }
        }
        this._testConfig.setVariableValue("$stepName", step.stepName)
        try {
            let foundError: boolean = false
            let iterator: IStepIterator = { "varName": "", "value": 1, "waitForValidResponse": false }
            let laps: number = 1
            if (step.iterator) {
                iterator = step.iterator
                if (!Array.isArray(iterator.value))
                    iterator.value = this._testConfig.replaceWithVarValue(iterator.value)
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
                let poll: boolean = (iterator.waitForValidResponse && lap < laps - 1) ? true : false


                for (let idx: number = 0; !foundError && idx < step?.requests.length || 0; idx++) {

                    let requestIdleBetweenRequests = idleBetweenRequest
                    let request: IRequest = step.requests[idx]
                    if (request.disabled)
                        continue

                    let config: IRequestConfig = request.config
                    let requestResult: IRequestResult = JSON.parse("{}")
                    requestResult.duration = 0
                    requestResult.success = true
                    let requestContentType: string = ""
                    if (request?.config?.headers)
                        requestContentType = request?.config?.headers['Content-type'] || request?.config?.headers['Content-Type'] || ""
                    if (request.assertions && !stepResult.assertions)
                        stepResult.assertions = []
                    if (config.data) {
                        if (Array.isArray(config.data) && typeof config?.data[0] === 'string')
                            config.data = config.data.join("")
                        if (typeof config.data === 'string') {
                            let strdata = this._testConfig.replaceWithVarValue(config.data)
                            let json = helper.toJson(strdata)
                            config.data = json || strdata
                        } else if (requestContentType === 'application/x-www-form-urlencoded') {
                            let formData: any = this.replaceFromJSON(config.data)
                            config.data = qs.stringify(formData)
                        }
                    }
                    this._prePostProcessors.runBeforeScripts(step, request)

                    let response: AxiosResponse = JSON.parse("{}");
                    let stepConfig: AxiosRequestConfig = this.setConfigValues(config)

                    requestResult.config = stepConfig
                    let start: number = Date.now()
                    requestResult.startTime = start
                    requestResult.contentLength = 0
                    this._logger.info("Step [%s]. Executing request: %s:%s polling=%s", step.stepName, stepConfig?.method || 'get', stepConfig?.url, poll)
                    let axError: AxiosError = JSON.parse("{}")
                    try {
                        response = await api.request(stepConfig)
                    }
                    catch (error) {
                        if (!error.response) {
                            let status: number = error.errno || -1
                            let statusText = error.message
                            this._logger.fatal("%s %s", error.message, error.isAxiosError)
                            if (error.isAxiosError)
                                axError = error
                            response = JSON.parse("{}")
                            response.status = status
                            response.statusText = statusText
                        }
                        else {
                            response = error.response
                        }

                    };
                    if (request.expectedStatus) {
                        let statusOK: boolean = true
                        if (Array.isArray(request.expectedStatus)) {
                            statusOK = request.expectedStatus.find(status => {
                                return status === response.status
                            }
                            ) != undefined
                        } else if (!isNaN(request.expectedStatus)) {
                            statusOK = (response.status === request.expectedStatus)
                        }
                        foundError = (!statusOK)
                    } else {
                        foundError = (response.status < 200 || response.status > 299)
                    }
                    if (response.status) {
                        if (request.extractors) {
                            this._prePostProcessors.extractValues(request.extractors, response)
                        }
                        if (request.transformers) {
                            this._prePostProcessors.transform(request.transformers)
                        }
                        if (!foundError && request.assertions) {
                            let assres: IAssertionResult[] = this._prePostProcessors.validate(request.assertions)
                            if (assres.length) {
                                if (!stepResult.assertions)
                                    stepResult.assertions = []
                                let failStep = assres.find(res => {
                                    return (res.failStep && !res.success)
                                })
                                /** Stop polling when result found */
                                if (poll && !failStep) {
                                    poll = false;
                                    lap = laps

                                }
                                assres.forEach(assertion => {
                                    if (!poll)
                                        stepResult.assertions?.push(assertion)
                                })

                                foundError = !poll && (failStep !== undefined)
                            }
                        }
                        this._prePostProcessors.runAfterScripts(step, request, response)
                    }
                    if (response?.config?.headers)
                        requestResult.config.headers = response?.config?.headers
                    requestResult.status = response.status
                    requestResult.statusText = response?.statusText
                    requestResult.headers = response.headers
                    requestResult.success = !foundError
                    stepResult.success = !foundError
                    if (!foundError) {
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
                    }
                    this._testConfig.setVariableValue("$contentLength", requestResult.contentLength)
                    let bigContent: boolean = requestResult.contentLength > ResultConfig.contentLength.maxRequestLength
                    if (bigContent)
                        this._logger.debug("Content length [%d] is greater than max length to save [%d]. Result not saved ",
                            requestResult.contentLength, ResultConfig.contentLength.maxRequestLength)
                    if (!bigContent && !nodata && !request.notSaveData)
                        requestResult.data = response?.data
                    requestResult.duration = Date.now() - start
                    requestResult.error = axError
                    if (!poll)
                        stepResult.requestResults.push(requestResult)
                    stepResult.duration += requestResult.duration
                    stepResult.contentLength += requestResult.contentLength
                    this._logger.debug("Request success=%s, status=%d statusText=%s", !foundError, requestResult.status, requestResult.statusText)
                    if (foundError)
                        stepResult.success = false
                    else if (requestIdleBetweenRequests) {
                        this._logger.debug("Start idle %d ms between requests", requestIdleBetweenRequests)
                        await helper.sleep(requestIdleBetweenRequests)
                    }
                    requestResult.endTime = Date.now()
                }
            }
        }
        catch (error) {
            this._logger.error(error)
        }
        stepResult.endTime = Date.now()
        this._prePostProcessors.runAfterScripts(step)
        return stepResult
    }

    public async run(nodata?: boolean, inputs?: string) {
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
        let idleBetweenRequest: number = 0
        let inpMap = new Map()
        if (inputs) {
            let arr = inputs.split(',').map(item => item.trim());
            arr.forEach(item => {
                let arr2 = item.split('=').map(item => item.trim());
                for (let idx = 0; idx < arr2.length - 1; idx += 2) {
                    inpMap.set(arr2[idx], helper.unDotify(arr2[idx + 1]))
                }
            }
            )
        }

        if (this._testConfig.configData?.variables) {
            let errors: any = []
            this._testConfig.configData.variables.forEach(variable => {
                switch (variable.usage) {

                    case 'input':
                        let value = inpMap.get(variable.key) || process.env["url_xi_" + variable.key] || variable.value
                        if (variable.type === 'number' && value !== undefined && !isNaN(value))
                            value = Number(value)
                        variable.value = value
                        
                        if (variable.validation !== undefined) {
                            try {
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
                    case 'inResponse':
                    case 'returnValue':
                    case 'urlLink' :   
                        results.variables?.push(variable)
                }

            })
            if (errors.length)
                results.errors = errors
        }

        results.stepResults = []
        if (!results.errors) {
            if (this._testConfig.configData.idleBetweenRequests) {
                let idleTime = this._testConfig.configData.idleBetweenRequests
                if (isNaN(idleTime))
                    idleTime = this._testConfig.replaceWithVarValue(this._testConfig.configData.idleBetweenRequests)

                if (!isNaN(idleTime)) {
                    idleBetweenRequest = idleTime
                    this._logger.debug("Idle between request=%d", idleBetweenRequest)
                }
            }
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
                config.baseURL = this._testConfig.replaceWithVarValue(this._testConfig.configData.baseURL)
                let api: Api = new Api(config);
                let foundError: boolean = false
                for (let idx: number = 0; !foundError && idx < this._testConfig.configData.steps.length; idx++) {

                    let testStep: ITestStep = this._testConfig.configData.steps[idx];
                    if (!testStep.disabled) {
                        this._logger.debug("Running step %s ", testStep.stepName)
                        let stepResult = await this.runTestStep(testStep, api, nodata || false, idleBetweenRequest)
                        foundError = !stepResult.success
                        this._logger.debug("Step success=%s, duration=%d", stepResult.success, stepResult.duration)
                        results.stepResults.push(stepResult)
                        if (!stepResult.ignoreDuration)
                            results.returnValue += stepResult.duration
                        results.duration += stepResult.duration
                        results.contentLength += stepResult.contentLength
                    } else {
                        this._logger.debug("Test step %s is disabled %s", testStep.stepName)
                    }
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
                            !isNaN(variable.value)
                    }
                )
                if (retval !== undefined) {
                    this._logger.debug("Return value %s", retval.value)
                    results.returnValue = !isNaN(retval.value) ? Number(retval.value) : 0
                }
            }
        }
        results.endTime = Date.now()
        this._logger.debug("Test success=%s, duration=%d real time=%d ", results.success, results.duration, results.endTime - results.startTime)
        return results
    }
}
