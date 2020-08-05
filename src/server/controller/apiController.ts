import {TestConfig} from '../../config/testConfig'
import {TestRunner} from '../../processor/testRunner'
import { Logger,getLogger } from 'log4js';
import { ITestResults } from '../../model/ITestResult'

export class ApiController {
    private _testRunner:TestRunner
    private _testConfig:TestConfig
    private _logger:Logger
    constructor ( ){
        this._testConfig=new TestConfig()
        this._testRunner=new TestRunner(this._testConfig)
        this._logger = getLogger('ApiController')    
        

    }
    public parse(request:any,result:any) {     
        let ok:boolean=this._testConfig.create(JSON.stringify(request.body))
        if(!ok) {
            let errors=this._testConfig.errors()
            result.status(400).send({ error: errors });
            return false
        }

        result.status(200).send({ message:"Parsing ok" });
        return true

    }
    public async run(request:any,result:any) {
        let ok:boolean=this._testConfig.create(JSON.stringify(request.body))
        if(!ok) {
            let errors=this._testConfig.errors()
            result.status(400).send({ error: errors });
            return false
        }
        let test_results:ITestResults = await this._testRunner.run();
        result.status(200).send(test_results);
        return true

    }

}