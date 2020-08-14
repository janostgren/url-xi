

import { IVariable } from '../model/ITestConfig'
import { ITestResults, IStepResult } from '../model/ITestResult'

import { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios'
import { TestBase } from '../lib/testbase'
import uuid from "uuid"
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path'
import util from 'util';
import * as helper from '../lib/helpers'


export class TestResultProcessor extends TestBase {
   
    constructor(debug:boolean = false) {
        super(debug, "TestResultProcessor")
    }

    private _createResultName (resultName?:string) {
            return resultName || "res_" + uuidv4()
    }

    public async saveResults(results:ITestResults,result_dir: string, resultName?: string) {
        
        resultName=this._createResultName(resultName)
        let resultFile = path.resolve(result_dir, resultName + ".json")
        let writeFile = util.promisify(fs.writeFile);
        let res:string= JSON.stringify(results,null,2)
        await writeFile(resultFile, res)
        return res
    }
    public async saveErrors(content:string,errors:object[],result_dir: string, resultName?: string) {
        
        resultName=this._createResultName(resultName)
       
        let resultFile = path.resolve(result_dir, resultName + ".json")
        let json:any={}
        if(content) {
            json = helper.toJson(content) || {}  
        }
        let results:ITestResults={
            "testName":json.testName || resultName,
            "baseURL":json.baseURL || "",
            "success":false,
            "duration":0,
            "contentLength":0,
            "startTime":Date.now(),
            "returnValue":-1,
            "stepResults": []
        } 
        results.errors=errors
        let writeFile = util.promisify(fs.writeFile);
        let res:string= JSON.stringify(results)
        await writeFile(resultFile, res)
        return res
    }

    public viewResults(results:ITestResults) {
        console.log("\n----- Process results [%s] -----\n",results.testName)
        if (results.variables) {
            console.log("----- Variables values -----")
            for (let idx: number = 0; idx <results.variables.length; idx++) {
                let variable: IVariable =results.variables[idx]
                console.log("\tname=%s , value=%s , usage=%s", variable.key, variable.value, variable.usage || "internal")
            }
            console.log("")
        }
        console.log("----- Steps result -----")
        for (let idx: number = 0; idx <results.stepResults.length; idx++) {
            let stepResult: IStepResult =results.stepResults[idx]
            console.log("\tStep Name [%s] : success=%s, duration=%d, content-length=%d, start time=%s, ignore duration=%s", stepResult.stepName, stepResult.success, stepResult.duration,stepResult.contentLength,new Date(stepResult.startTime).toISOString(), stepResult.ignoreDuration)
            stepResult.requestResults.forEach(requestResult => {
                console.log("\t\t %s [%s] : success=%s, duration=%d, content-length=%d,start time=%s, status=(%d : %s)",
                    requestResult.config?.url, requestResult.config?.method?.toLocaleUpperCase()|| "GET", requestResult.success, requestResult.duration,requestResult.contentLength,
                    new Date(requestResult.startTime).toISOString(),
                    requestResult.status, requestResult.statusText)
            }
            )
        }
        console.log("-----[Test Summary] -----")
        console.log("Total Response Time: %d",results.duration)
        console.log("Start Time: %s",new Date(results.startTime).toISOString())
        console.log("Number of steps: %d",results?.stepResults?.length || 0)
        console.log("Total Content length: %d",results.contentLength)
        console.log("Return value: %d",results.returnValue)
        console.log("Result success: %s",results.success)
    }
}