import colors from 'colors'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { v4 as uuidv4 } from 'uuid'
import * as helper from '../lib/helpers'
import { TestBase } from '../lib/testbase'
import { IVariable } from '../model/ITestConfig'
import { IStepResult, ITestResults } from '../model/ITestResult'

export class TestResultProcessor extends TestBase {

    constructor(debug: boolean = false) {
        super(debug, "TestResultProcessor")
    }

    private _createResultName(resultName?: string) {
        return resultName || "res_" + uuidv4()
    }

    public async saveResults(results: ITestResults, result_dir: string, resultName?: string) {

        resultName = this._createResultName(resultName)
        let resultFile = path.resolve(result_dir, resultName + ".json")
        let writeFile = util.promisify(fs.writeFile);
        let res: string = JSON.stringify(results, null, 2)
        await writeFile(resultFile, res)
        return res
    }
    public async saveErrors(content: string, errors: object[], result_dir: string, resultName?: string) {

        resultName = this._createResultName(resultName)
        let resultFile = path.resolve(result_dir, resultName + ".json")
        let json: any = {}
        if (content) {
            json = helper.toJson(content) || {}
        }
        let results: ITestResults = {
            "testName": json.testName || resultName,
            "baseURL": json.baseURL || "",
            "success": false,
            "duration": 0,
            "contentLength": 0,
            "startTime": Date.now(),
            "endTime": Date.now(),
            "returnValue": -1,
            "stepResults": []
        }
        results.errors = errors
        let writeFile = util.promisify(fs.writeFile);
        let res: string = JSON.stringify(results)
        await writeFile(resultFile, res)
        return res
    }

    public viewResults(results: ITestResults) {

        console.info(colors.blue.bold(`\n----- Process results [${results.testName}] -----\n`));
        console.info(colors.magenta.bold("----- [Test Summary] -----"))
        console.info("\tTotal Response Time: %d", results.duration)
        console.info("\tStart Time: %s", new Date(results.startTime).toISOString())
        console.info("\tEnd Time: %s", new Date(results.endTime).toISOString())
        console.info("\tNumber of steps: %d", results?.stepResults?.length || 0)
        console.info("\tTotal Content length: %d", results.contentLength)
        console.info("\tReturn value: %d", results.returnValue)

        let success = `\tResult success: ${results.success}`
        if (results.success)
            console.info(success.green.bold)
        else
            console.info(success.red.bold)
        console.info("")
        if (results?.variables?.length) {
            console.info(colors.cyan.bold("----- [Variables values] -----"))
            for (let idx: number = 0; idx < results.variables.length; idx++) {
                let variable: IVariable = results.variables[idx]
                console.info("\tname=%s , value=%s %s, usage=%s", variable.key, variable.value, variable.unit || '', variable.usage || "internal")
            }
            console.info("")
        }
        console.info(colors.yellow.bold("----- [Steps result] -----"))
        for (let idx: number = 0; idx < results.stepResults.length; idx++) {
            let stepResult: IStepResult = results.stepResults[idx]
            let stepName = `\t${stepResult.stepName}`
            console.info("")
            if (stepResult.success === true)
                console.info(`${stepName}`.green.bold)
            else
                console.info(`${stepName}`.red.bold)
            console.info("\t  [success=%s, duration=%d, content-length=%d, start time=%s, ignore duration=%s]", stepResult.success, stepResult.duration, stepResult.contentLength, new Date(stepResult.startTime).toISOString(), stepResult.ignoreDuration)
            stepResult.assertions?.forEach(assertion => {
                let message = `\t    ${assertion.description} [value=${assertion.value} : ${assertion.expression}]`
                if (!assertion.success)
                    console.info(message.red)
                else if (this._debug)
                    console.info(message.green)
            })

            stepResult.requestResults.forEach(requestResult => {
                console.info("\t\t[%s] %s ".white.bold, requestResult.config?.method?.toLocaleUpperCase() || "GET", requestResult.config?.url)

                console.info("\t\t  [success=%s, duration=%d, content-length=%d,start time=%s, status=(%d : %s)]".white,
                    requestResult.success, requestResult.duration, requestResult.contentLength,
                    new Date(requestResult.startTime).toISOString(),
                    requestResult.status, requestResult.statusText)
            }
            )
        }
        console.info("")

    }
}