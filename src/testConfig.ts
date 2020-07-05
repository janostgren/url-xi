import fs from 'fs';
import util from 'util';
import {AxiosResponse,Method } from 'axios'

export interface IBasicAuth {
    username: string,
    password: string
}

export interface IRequestConfig {
    method?: Method,
    url?: string,
    headers?: any
    data?: any,
    params?: any
    auth?: any
}

/*
export interface IHttpRequest extends IRequestConfig {
   
}
*/

export type ExtractorType = 'jsonpath' | 'xpath' | 'regexp'

export interface IExtractor {
    type: ExtractorType,
    expression: string,
    variable: string,
    counter?: boolean
}
export interface ITestStep {
    stepName: string,
    request: IRequestConfig,
    extractors?: IExtractor[]
}

export type VariableType = 'string' | 'number'
export type VariableUsage = 'returnValue' | 'inResponse' | 'info' | ''

export interface IVariable {
    key: string,
    type: VariableType,
    usage: VariableUsage,
    value: any,
    unit?: string
}

export interface ITestConfigData {
    testName: string,
    variables?: IVariable[],
    baseURL: string,
    config?: IRequestConfig
    steps: ITestStep[]

}
export interface IStepResult {
    response:AxiosResponse,
    duration:number
}


export class TestConfig {
    private _debug: boolean = false;
    private _varMap: Map<string, IVariable> = new Map<string, IVariable>();
    configData: ITestConfigData = {} as any;
    constructor(debug: boolean = false) {
        this._debug = debug

    }
    public async create(dir: string, config: String) {
        let pathName: string = `${dir}/${config}`;
        let readFile = util.promisify(fs.readFile);
        let content = await (await readFile(pathName)).toString();

        this.configData = JSON.parse(content)
        
        if (this.configData.variables) {
            for (let idx: number = 0; idx < this.configData.variables.length; idx++) {
                let v: IVariable = this.configData.variables[idx]
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



