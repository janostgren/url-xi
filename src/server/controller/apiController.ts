import {TestConfig} from '../../config/testConfig'
import {TestRunner} from '../../processor/testRunner'
import { Logger,getLogger } from 'log4js';
import { ITestResults } from '../../model/ITestResult'
import * as express from 'express' 

export class ApiController {
    private _testRunner:TestRunner
    private _testConfig:TestConfig
    private _logger:Logger
    constructor ( ){
        this._testConfig=new TestConfig()
        this._testRunner=new TestRunner(this._testConfig)
        this._logger = getLogger('ApiController')   
    }
    public parse(request:express.Request,response:express.Response) {     
        let ok:boolean=this._testConfig.create(JSON.stringify(request.body))
        if(!ok) {
            let errors=this._testConfig.errors()
            response.status(400).send({ error: errors });
            return false
        }
        response.status(200).send({ message:"Parsing ok" });
        return true
    }
    public async run(request:express.Request,response:express.Response) {
        let base_url:string=request?.query?.baseUrl?.toString() || ""
        if(base_url) {
            base_url=base_url.split('"').join('')
        }
        let ok:boolean=this._testConfig.create(JSON.stringify(request.body),base_url)
        if(!ok) {
            let errors=this._testConfig.errors()
            response.status(400).send({ error: errors });
            return false
        } 
        let nodata=request?.query?.nodata == 'true'
      
        let test_results:ITestResults = await this._testRunner.run(nodata);
        response.status(200).send(test_results);
        return true
    }
}