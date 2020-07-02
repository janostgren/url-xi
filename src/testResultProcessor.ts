import { TestConfig, ITestConfigData, ITestStep, IHttpRequest, IExtractor,IVariable } from './testConfig'
export class TestResultProcessor {
    private _debug: boolean = false;
    private _testConfig: TestConfig;
    constructor(config: TestConfig,debug: boolean = false) {
        this._testConfig = config
        this._debug = debug
    }
    public async createResults() {
        console.log("----- Process results ----\n")
        if (this._testConfig.configData.variables) {
            for (let idx: number = 0; idx < this._testConfig.configData.variables.length; idx++) {
                let variable:IVariable=this._testConfig.configData.variables[idx]
                 console.log("variable: %s",variable) 
            }
        }

    }
}