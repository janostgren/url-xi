
import { TestConfig } from '../config/testConfig'
import { ITestConfigData, ITestStep, IExtractor, IVariable, IStepResult } from '../model/ITestConfig'

import { AxiosResponse, AxiosRequestConfig } from 'axios'
import { TestBase } from '../lib/testbase'
import uuid from "uuid"
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path'
import util from 'util';

interface IXStepResult {
    step: ITestStep
    config?: AxiosRequestConfig
    data?: any
    headers?: any
    status?: number
    statusText?: string
    duration: number
}

interface ITestResults {
    testName: string,
    variables?: IVariable[],
    baseURL: string,
    stepResults: IXStepResult[]
    totalDuration: number
    returnValue: number
}

export class TestResultProcessor extends TestBase {

    private _testConfig: TestConfig;
    private _result_dir: string
    private _apiResults: IStepResult[] = []
    constructor(config: TestConfig, result_dir: string, debug: boolean = false) {
        super(debug)
        this._testConfig = config
        this._result_dir = result_dir

        let result: IStepResult = JSON.parse("{}");
        for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++)
            this._apiResults.push(result);
    }

    public async createResults() {
        let results: ITestResults = JSON.parse("{}")
        results.testName = this._testConfig.configData.testName
        results.baseURL = this._testConfig.configData.baseURL
        results.variables = this._testConfig.configData.variables

        let resultName = "res_" + uuidv4() + ".json"
        let resultFile = path.resolve(this._result_dir, resultName)

        console.log("----- Process results [%s] ----\n", this._testConfig.configData.testName)

        let returnValue: any = undefined
        if (this._testConfig.configData.variables) {
            for (let idx: number = 0; idx < this._testConfig.configData.variables.length; idx++) {
                let variable: IVariable = this._testConfig.configData.variables[idx]
                console.log("variable: %s", variable)
                if (variable.type === 'number' && variable.usage === 'returnValue')
                    returnValue = Number(variable.value)
            }
        }
        let totalDuration: number = 0
        results.stepResults = []
        for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++) {
            let step: ITestStep = this._testConfig.configData.steps[idx]
            console.log("Step Name [%s]", step.stepName)
            let stepResult: IStepResult = this._apiResults[idx]
            if (stepResult) {
                console.log(stepResult.response.config)
                console.log("status=%d %s", stepResult.response.status, stepResult.response.statusText)
                console.log(stepResult.response.data)
                totalDuration += stepResult.duration
                let xstepResult: IXStepResult = { "step": step, "duration": stepResult.duration }
                xstepResult.config = stepResult.response.config
                xstepResult.status = stepResult.response.status
                xstepResult.statusText = stepResult.response.statusText
                xstepResult.headers = stepResult.response.headers
                xstepResult.data = stepResult.response.data
                xstepResult.config = stepResult.response.config
                results.stepResults.push(xstepResult);
            }
        }
        console.log("---------------------- [Summary] ---------------------------------")
        console.log("Total Response Time: %d", totalDuration)
        console.log("Number of steps: %d", this._testConfig.configData.steps.length)
       
        if (typeof returnValue !== 'number')
            returnValue = totalDuration
        console.log("Return value: %d", returnValue)
        results.totalDuration = totalDuration
        results.returnValue = returnValue
        let writeFile = util.promisify(fs.writeFile);
        await writeFile(resultFile, JSON.stringify(results))
    }

    public addApiResponse(idx: number, response: IStepResult) {
        this._apiResults[idx] = response
    }
}