import { TestConfig, ITestConfigData, ITestStep, IExtractor,IVariable,IStepResult } from './testConfig'
import {AxiosResponse} from 'axios'
export class TestResultProcessor {
    private _debug: boolean = false;
    private _testConfig: TestConfig;
    private _apiResults:IStepResult[] = []
    constructor(config: TestConfig,debug: boolean = false) {
        this._testConfig = config
        this._debug = debug
        let result:IStepResult=JSON.parse("{}");
        for(let idx:number=0; idx < this._testConfig.configData.steps.length;idx++) 
           this._apiResults.push(result);
           
    }

    public async createResults() {
        console.log("----- Process results [%s] ----\n",this._testConfig.configData.testName)
        if (this._testConfig.configData.variables) {
            for (let idx: number = 0; idx < this._testConfig.configData.variables.length; idx++) {
                let variable:IVariable=this._testConfig.configData.variables[idx]
                 console.log("variable: %s",variable) 
            }
        }
        let totalDuration:number=0
        for(let idx:number=0; idx < this._testConfig.configData.steps.length;idx++) {
            let step:ITestStep = this._testConfig.configData.steps[idx]
            console.log("Step Name [%s]",step.stepName) 
            let stepResult:IStepResult = this._apiResults[idx]
            if(stepResult) {
                console.log(stepResult.response.config)
                console.log("status=%d %s",stepResult.response.status,stepResult.response.statusText)
                console.log(stepResult.response.data)
                //console.log(response.headers)
                console.log("response time=%d",stepResult.duration)
                totalDuration += stepResult.duration
            }

        }
        console.log("---------------------- [Summary] ---------------------------------")
        console.log("Total Response Time: %d",totalDuration)
        console.log("Number of steps: %d",this._testConfig.configData.steps.length)
    }

    public addApiResponse (idx:number,response:IStepResult) {
        this._apiResults[idx] =response
    }
}