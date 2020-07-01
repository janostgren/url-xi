import fs  from 'fs';
import util  from 'util';


export interface IHttpRequest {
    method:string
    path:string
}
export interface ITestStep {
    stepName: string,
    request: IHttpRequest

}

export interface ITestConfigData {
    testName:string
    baseUrl: string
    steps:ITestStep[]
}
 

export class TestConfig {
    private _debug:boolean = false;
    configData:ITestConfigData={} as any;
    constructor(debug:boolean=false) {
        this._debug =debug
    
    }
    public async create(dir:string,config:String)  {
        let pathName:string=`${dir}/${config}`;
        let readFile=util.promisify(fs.readFile);
        let content=await (await readFile(pathName)).toString();
       
        this.configData=JSON.parse(content)
        if(this._debug)
        console.debug("TestConfig: content=%s",this.configData)
        
    }
   
}

//export=TestConfig

