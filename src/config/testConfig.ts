import fs from 'fs';
import path from 'path'
import util from 'util';
import { AxiosResponse, Method } from 'axios'
import { TestBase } from '../lib/testbase'
import { IExtractor, IRequestConfig, ITestStep, ITestConfigData, IVariable } from '../model/ITestConfig'


export class TestConfig extends TestBase {
    private _varMap: Map<string, IVariable> = new Map<string, IVariable>();
    private _headers: any
    private _base_url: string
    configData: ITestConfigData = {} as any;

    constructor(headers: any, base_url: string = '', debug: boolean = false) {
        super(debug, "TestConfig")
        this._headers = headers
        this._base_url = base_url
    }

    public async readFile(pathName: string) {
        try {
            let readFile = util.promisify(fs.readFile);
            let content = await (await readFile(pathName)).toString();
            return content
        }
        catch(error) {
            this._logger.error(error)
            return undefined

        }
    }

    public create(content: string) {
        try {
            this.configData = JSON.parse(content)
            if (!this.configData?.config)
                this.configData.config = JSON.parse("{}")
            if (this._base_url)
                this.configData.baseURL = this._base_url
            if (this.configData.config?.headers)
                this.configData.config.headers = Object.assign(this.configData.config.headers, this._headers)
            else if (this.configData.config)
                this.configData.config.headers = this._headers

            this._logger.trace("config:", this.configData.config)

            if (this.configData.variables) {
                for (let idx: number = 0; idx < this.configData.variables.length; idx++) {
                    let v: IVariable = this.configData.variables[idx]
                    if (v.value)
                        v.value = eval(v.value)
                    this._varMap.set(v.key, v)
                }
            }
        }
        catch (error) {
            this._logger.error(error)
            return false

        }
        return true
    }

    public setVariableValue(key: string, value: any) {
        let v = this._varMap.get(key)
        if (v) {
            v.value = value
        } else {
            let variable: IVariable = { "key": key, "usage": "", "type": Number(value) !== NaN ? "number" : "string", "value": value }
            this._varMap.set(key, variable)
        }
    }


    public replaceWithVarVaule(str: string) {
        let vars: Map<string, IVariable> = this._varMap
        let ret: any = ""
        let val: any = str.replace(/{{(\$?[A-Za-z_]\w+)}}/gm, function (x: string, y: string) {
            switch (y) {
                case "$timestamp":
                    ret = Date.now()
                    break
                default:
                    let v = vars.get(y)
                    if (v) {
                        ret = v.value
                    }
            }
            return ret
        })
        if (ret && Array.isArray(ret))
            return ret;
        return val ? val : str
    }
}
