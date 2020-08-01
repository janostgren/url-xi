

import { ITestConfigData, ITestStep, IExtractor, IVariable, IAssertionResult } from '../model/ITestConfig'
import { ITestResults } from '../model/ITestResult'

import { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'
import uuid from "uuid"
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path'
import util from 'util';

export class TestResultProcessor extends TestBase {

    private _testConfig: ITestConfigData;

   
    private _results: ITestResults = JSON.parse("{}")
    constructor(config: ITestConfigData, debug: boolean = false) {
        super(debug,"TestResultProcessor")
        this._testConfig = config

       
       
    }

    public async saveResults(result_dir: string, resultName?: string) {
        if (!resultName)
            resultName = "res_" + uuidv4() 
        let resultFile = path.resolve(result_dir, resultName+".json")
        let writeFile = util.promisify(fs.writeFile);
        await writeFile(resultFile, JSON.stringify(this._results))
    }

    public createResults() {
        /*
        this._results = JSON.parse("{}")
        this._results.testName = this._testConfig.testName
        this._results.baseURL = this._testConfig.baseURL
        this._results.success = true
        this._results.variables = this._testConfig.variables
        let returnValue: any = undefined
        if (this._testConfig.variables) {
            for (let idx: number = 0; idx < this._testConfig.variables.length; idx++) {
                let variable: IVariable = this._testConfig.variables[idx]
                if (variable.type === 'number' && variable.usage === 'returnValue')
                    returnValue = Number(variable.value)
            }
        }
        let totalDuration: number = 0
        this._results.stepResults = []
        for (let idx: number = 0; idx < this._testConfig.steps.length; idx++) {
            let step: ITestStep = this._testConfig.steps[idx]

            let stepResult: IStepResult = this._apiResults[idx]
            if (stepResult) {
                totalDuration += stepResult.duration
                let xstepResult: IXStepResult = { "step": step, "duration": stepResult.duration, success: false, assertions: [] }
                if (stepResult.response) {
                    xstepResult.config = stepResult.response.config
                    xstepResult.status = stepResult.response.status
                    xstepResult.statusText = stepResult.response.statusText
                    xstepResult.headers = stepResult.response.headers
                    xstepResult.data = stepResult.response.data
                    xstepResult.success = (xstepResult.status >= 200 && xstepResult.status <= 299)
                }
                else {
                    xstepResult.status = stepResult.error ? -1 : 0
                    xstepResult.statusText = stepResult?.error?.message || "No step result created"
                    xstepResult.error = stepResult.error
                }
               
                if(step.expectedStatus)
                this._logger.debug("expected status=%d,status=%s", step.expectedStatus,xstepResult.status )
                if (step.expectedStatus && xstepResult.status === step.expectedStatus)
                    xstepResult.success = true

                if (xstepResult.success === false)
                    this._results.success = false
                this._results.stepResults.push(xstepResult);
            }
        }

        if (typeof returnValue !== 'number')
            returnValue = totalDuration
        this._results.totalDuration = totalDuration
        this._results.returnValue = returnValue
        return this._results
    */
    }

    public viewResults() {
        /*
        console.log("----- Process results [%s] ----\n", this._testConfig.testName)
        if (this._results.variables) {
            console.log("--- Variables values ---")
            for (let idx: number = 0; idx < this._results.variables.length; idx++) {
                let variable: IVariable = this._results.variables[idx]
                console.log("\tname=%s , value=%s , usage=%s", variable.key, variable.value, variable.usage || "internal")
            }
            console.log("")
        }
        console.log("--- Steps result ---")
        for (let idx: number = 0; idx < this._results.stepResults.length; idx++) {
            let stepResult: IXStepResult = this._results.stepResults[idx]
            console.log("\tStep Name [%s] duration=%d", stepResult.step.stepName, stepResult.duration)

            console.log("\t\tstatus=%d %s", stepResult.status, stepResult.statusText)
            console.log("\t\tsuccess=%s", stepResult.success)

        }
        console.log("---------------------- [Test Summary] ---------------------------------")
        console.log("Total Response Time: %d", this._results.totalDuration)
        console.log("Number of steps: %d", this._testConfig.steps.length)
        console.log("Return value: %d", this._results.returnValue)
        console.log("Result success: %s", this._results.success)
        */
    }

    /*
    public addApiResponse(idx: number, response: IStepResult) {
        this._apiResults[idx] = response
    }
    */
}