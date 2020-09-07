import { TestBase } from '../lib/testbase'
import { ITestConfigData, IVariable, IRequestConfig,ITestStep } from '../model/ITestConfig'
import fs from 'fs';

import util from 'util';
import { IPMCollection, Variable, Auth, AuthType, ApikeyElement,Items } from './IPMCollection'

export class PMConverter extends TestBase {

    private pmCollection: IPMCollection = {} as any;
    private envVariables: Variable[] = []

    constructor(debug?: boolean) {
        super(debug, "PMConverter")
    }

    public async initFromFile(pathName: string, envPath?: string) {

        try {
            let envContent: string = ""
            let readFile = util.promisify(fs.readFile);
            let content = (await readFile(pathName)).toString();
            if (envPath) {
                envContent = (await readFile(envPath)).toString();
            }
            return this.setup(content, envContent)
        }
        catch (error) {
            this._logger.error(error)
            return false
        }
    }

    public setup(content: string, envContent?: string) {
        this.pmCollection = JSON.parse(content)
        this.envVariables = []
        if (envContent) {
            let envVars = JSON.parse(envContent)
            this.envVariables = envVars.values
        }
        this._logger.info("PM collection [%s] initialized. Env variables=%d", this.pmCollection.info.name, this.envVariables.length)
        return true
    }

    private toIVariable(variable: Variable) {
        let toVariable: IVariable = {} as any;
        toVariable.usage = ""
        toVariable.key = variable.key ? variable.key : variable.name ? variable.name : ""
        toVariable.value = variable.value || undefined
        switch (variable.type) {
            case 'number':
                toVariable.type = 'number'
                break
            default:
                toVariable.type = 'string'
        }
        return toVariable
    }

    private convertAuth(auth: Auth) {
        let config: IRequestConfig = {} as any
        let authType = auth.type.toString()
        switch (authType) {
            case "apikey":
                let keys = auth.apikey || []
                let key: ApikeyElement = {} as any
                let value: ApikeyElement = {} as any;
                let _in: ApikeyElement = {} as any;


                keys.forEach(apiKey => {
                    switch (apiKey.key) {
                        case 'key':
                            key = apiKey
                            break;
                        case 'value':
                            value = apiKey
                            break;
                        case 'in':
                            _in = apiKey
                            break;

                    }

                }
                )
                if (_in.value === 'query') {
                    config.params = {}
                    config.params[key.value] = value.value
                }
                else if (_in.value === 'header') {
                    config.headers = {}
                    config.headers[key.value] = value.value
                }
                break

        }
        return config
    }
    private convertStep (item:Items) {
        let step:ITestStep = {} as any;
        step.stepName= (item.name != undefined) ? item.name:"";
        return step;
    }

    public convert() {
        let varMap: Map<string, IVariable> = new Map<string, IVariable>();
        let testConfig: ITestConfigData = {} as any
        testConfig.testName = this.pmCollection.info.name
        testConfig.baseURL = ""
        if (this.pmCollection.info.description) {
            let description: any = this.pmCollection.info?.description || ""
            testConfig.description = description
        }


        this.pmCollection.variable?.forEach(v => {
            this._logger.debug("Reading variable [%s] value=%s from collection", v.key || v.name, v.value || "")
            let variable: IVariable = this.toIVariable(v)
            varMap.set(variable.key, variable)

        }
        )
        this.envVariables.forEach(v => {
            this._logger.debug("Reading variable [%s] value=%s from environment", v.key || v.name, v.value || "")
            let variable: IVariable = this.toIVariable(v)
            varMap.set(variable.key, variable)

        }
        )

        testConfig.variables = []
        for (const variable of varMap.values()) {
            testConfig.variables.push(variable)

        }
        if (this.pmCollection.auth) {
            let config = this.convertAuth(this.pmCollection.auth)
            testConfig.config = config

        }

        testConfig.steps=[]
        this.pmCollection.item?.forEach(item => {
            
            this._logger.debug("Reading Item [%s]", item.name, item.description)

            let step:ITestStep = this.convertStep(item)
            testConfig.steps.push(step)

        }
        )
        return testConfig
    }

}