import fs from 'fs';

import util from 'util';
import { AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { TestBase } from '../lib/testbase'
import { ResultConfig, IExtractor, IRequestConfig, ITestStep, ITestConfigData, IVariable } from '../model/ITestConfig'
import * as schemaValidator from '../processor/schemaValidator'
import * as helpers from '../lib/helpers'
import * as faker from 'faker'

const FAKER_PREFIX = "$faker."

export class TestConfig extends TestBase {
    private _varMap: Map<string, IVariable> = new Map<string, IVariable>();
    private _headers: any
    private _base_url: string
    private _errors: Array<object>
    configData: ITestConfigData = {} as any;

    constructor(headers?: any, base_url?: string, debug?: boolean) {
        super(debug, "TestConfig")
        this._headers = headers
        this._base_url = base_url || ''
        this._errors = []
    }

    private _saveError(error: any) {
        let s: string = JSON.stringify(error)
        if (s === "{}") {
            this._errors.push({ "name": error.name || "", "message": error.message || error })
        }
        else {
            this._errors.push(error)
        }
    }

    public async readFile(pathName: string) {
        this._errors = []
        try {
            let readFile = util.promisify(fs.readFile);
            let content = await (await readFile(pathName)).toString();
            return content
        }
        catch (error) {
            this._logger.error(error)
            this._saveError(error)
            return undefined
        }
    }

    public create(content: string, base_url?: string) {
        this._errors = []
        try {
            this.configData = JSON.parse(content)
            this._logger.debug("Parsing of %s OK", this?.configData?.testName || "Unknown ")
            let schemaOK: boolean = schemaValidator.validate(this.configData)
            if (!schemaOK) {
                this._errors = schemaValidator.getErrors()
                return schemaOK
            }
            let packInfo = helpers.getPackageInfo();
            let defaultUserAgent: string = `url-xi-${packInfo.version}`
            let defConfig: AxiosRequestConfig = { "timeout": ResultConfig.timeout, headers: { "User-Agent": defaultUserAgent } }
            if (!base_url)
                base_url = this._base_url

            if (!this.configData?.config)
                this.configData.config = JSON.parse("{}")
            if (this.configData.config?.headers)
                this.configData.config.headers = Object.assign(this.configData.config.headers, defConfig.headers)
            else if (this.configData.config)
                this.configData.config.headers = defConfig.headers
            this.configData.config = Object.assign(defConfig, this.configData.config)
           

            if (base_url)
                this.configData.baseURL = base_url
            if (this.configData.config?.headers)
                this.configData.config.headers = Object.assign(this.configData.config.headers, this._headers)
            else if (this.configData.config)
                this.configData.config.headers = this._headers

            this._logger.debug("config:", this.configData.config)

            if (this.configData.variables) {
                for (let idx: number = 0; idx < this.configData.variables.length; idx++) {
                    let v: IVariable = this.configData.variables[idx]
                    //let isNumber: boolean = (v.value !== undefined && (typeof v.value !== 'string') && Number(v.value) != NaN) ? true : false
                    let isNumber: boolean = (v.value !== undefined) && !isNaN(v.value)
                    if (!isNumber) {
                        if (helpers.isDotedString(v.value))
                            v.value = eval(helpers.unDotify(v.value))
                        else if (typeof v.value === 'string')
                            v.value = this.replaceWithVarValue(v.value)
                    }
                    this._varMap.set(v.key, v)
                }
            }
        }
        catch (error) {
            this._logger.error(error)
            this._saveError(error)
            return false
        }
        return true
    }
    public errors() {
        return this._errors || []
    }

    public setVariableValue(key: string, value: any) {
        let v = this._varMap.get(key)
        if (v) {
            v.value = value
        } else {
            let variable: IVariable = { "key": key, "usage": "", "type": !isNaN(value)  ? "number" : "string", "value": value }
            this._varMap.set(key, variable)
        }
    }

    public getVariableValue(key: string) {
        let v = this._varMap.get(key)
        return v ? v.value:null
    }


    public replaceWithVarValue(str: string) {
        let vars: Map<string, IVariable> = this._varMap
        let ret: any = ""
        let val: any = str.replace(/{{(\$?[A-Za-z_][\w\.]*\w)}}/gm, function (x: string, y: string) {
            switch (y) {
                case "$timestamp":
                    ret = Date.now()
                    break
                default:
                    if (y.startsWith(FAKER_PREFIX)) {
                        try {
                            let fakeAsset = y.substr(FAKER_PREFIX.length)
                            ret = faker.fake(`{{${fakeAsset}}}`)
                        }
                        catch (e) {
                            ret = ""
                        }
                    } else {
                        let v = vars.get(y)
                        if (v) {
                            ret = v.value
                        }
                    }
            }
            return ret
        })
        if (ret && Array.isArray(ret))
            return ret;
        return val ? val : str
    }
}
