import fs from 'fs';
import util from 'util';


export interface IHttpRequest {
    method: string,
    path: string
}
export type ExtractorType = 'jsonpath' | 'xpath' | 'regexp'

export interface IExtractor {
    type: ExtractorType,
    expression: string,
    variable: string,
    counter?: boolean
}
export interface ITestStep {
    stepName: string,
    request: IHttpRequest,
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
    variables?: IVariable[]
    baseUrl: string
    steps: ITestStep[]

}


export class TestConfig {
    private _debug: boolean = false;
    configData: ITestConfigData = {} as any;
    constructor(debug: boolean = false) {
        this._debug = debug

    }
    public async create(dir: string, config: String) {
        let pathName: string = `${dir}/${config}`;
        let readFile = util.promisify(fs.readFile);
        let content = await (await readFile(pathName)).toString();

        this.configData = JSON.parse(content)
        if (this._debug)
            console.debug("TestConfig: content=%s", this.configData)
    }
    public setVariableValue(key: string, value: any) {
        if (this.configData.variables) {
            for (let idx: number = 0; idx < this.configData.variables.length; idx++) {
                let v:IVariable=this.configData.variables[idx]
                if(v.key=== key) {
                    v.value=value
                    break;
                } 
            }
        }
    }

}

//export=TestConfig

