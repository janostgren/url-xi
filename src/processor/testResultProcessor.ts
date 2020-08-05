

import { IVariable } from '../model/ITestConfig'
import { ITestResults, IStepResult } from '../model/ITestResult'

import { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'
import uuid from "uuid"
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path'
import util from 'util';

export class TestResultProcessor extends TestBase {
    private _results: ITestResults
    constructor(results: ITestResults, debug: boolean = false) {
        super(debug, "TestResultProcessor")
        this._results = results
    }

    public async saveResults(result_dir: string, resultName?: string) {
        if (!resultName)
            resultName = "res_" + uuidv4()
        let resultFile = path.resolve(result_dir, resultName + ".json")
        let writeFile = util.promisify(fs.writeFile);
        let res:string= JSON.stringify(this._results)
        await writeFile(resultFile, res)
        return res
    }

    public viewResults() {
        console.log("\n----- Process results [%s] -----\n", this._results.testName)
        if (this._results.variables) {
            console.log("----- Variables values -----")
            for (let idx: number = 0; idx < this._results.variables.length; idx++) {
                let variable: IVariable = this._results.variables[idx]
                console.log("\tname=%s , value=%s , usage=%s", variable.key, variable.value, variable.usage || "internal")
            }
            console.log("")
        }
        console.log("----- Steps result -----")
        for (let idx: number = 0; idx < this._results.stepResults.length; idx++) {
            let stepResult: IStepResult = this._results.stepResults[idx]
            console.log("\tStep Name [%s] : success=%s, duration=%d, ignore duration=%s", stepResult.stepName, stepResult.success, stepResult.duration, stepResult.ignoreDuration)
            stepResult.requestResults.forEach(requestResult => {
                console.log("\t\t %s [%s] : success=%s, duration=%d, status=(%d : %s)",
                    requestResult.config?.url, requestResult.config?.method?.toLocaleUpperCase(), requestResult.success, requestResult.duration,
                    requestResult.status, requestResult.statusText)
            }
            )
        }
        console.log("-----[Test Summary] -----")
        console.log("Total Response Time: %d", this._results.duration)
        console.log("Number of steps: %d", this._results?.stepResults?.length || 0)
        console.log("Return value: %d", this._results.returnValue)
        console.log("Result success: %s", this._results.success)
    }
}