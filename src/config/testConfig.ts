import fs from 'fs';
import path from 'path'
import util from 'util';
import { AxiosResponse, Method } from 'axios'
import { TestBase } from '../lib/testbase'
import {IExtractor,IRequestConfig,ITestStep,ITestConfigData,IVariable} from '../model/ITestConfig'


export class TestConfig extends TestBase {
    private _varMap: Map<string, IVariable> = new Map<string, IVariable>();
    private _headers: any
    private _base_url:string
    configData: ITestConfigData = {} as any;
    
    constructor(headers: any, base_url:string='',debug: boolean = false) {
        super(debug,"TestConfig")
        this._headers = headers
        this._base_url=base_url
    }

    public async createFromFile(pathName: string) {
        
        let readFile = util.promisify(fs.readFile);
        let content = await (await readFile(pathName)).toString();
        this.create(content)
    }

    public async create(content:string) {
        
        this.configData = JSON.parse(content)
        if(!this.configData?.config)
            this.configData.config=JSON.parse("{}")
        if(this._base_url)    
            this.configData.baseURL = this._base_url 
        if (this.configData.config?.headers)
            this.configData.config.headers = Object.assign(this.configData.config.headers, this._headers)
        else if(this.configData.config)
            this.configData.config.headers =this._headers
            
        this._logger.trace("config:",this.configData.config)

        if (this.configData.variables) {
            for (let idx: number = 0; idx < this.configData.variables.length; idx++) {
                let v: IVariable = this.configData.variables[idx]
                if (v.value)
                    v.value = eval(v.value)
                this._varMap.set(v.key, v)
            }
        }
    }


    public setVariableValue(key: string, value: any) {
        if (this.configData.variables) {
            let v = this._varMap.get(key)
            if (v) {
                v.value = value
            }
        }
    }

    
    public replaceWithVarVaule(str: string) {
        let vars: Map<string, IVariable> = this._varMap
        let val = str.replace(/{{(\$?[A-Za-z_]\w+)}}/gm, function (x: string, y: string) {
            let ret: string = ""
            switch (y) {
                case "$timestamp":
                    ret = Date.now().toString()
                    break
                default:
                    let v = vars.get(y)
                    if (v) {
                        ret = v.value.toString()
                    }
            }
            return ret
        })
        return val ? val : str
    }
}
