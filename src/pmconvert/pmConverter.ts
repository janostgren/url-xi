import { TestBase } from '../lib/testbase'
import { ITestConfigData, IVariable, IRequestConfig, ITestStep, IRequest, IScript } from '../model/ITestConfig'
import fs from 'fs';
import util from 'util';
import path from 'path'

import { IPMCollection, Variable, Auth, URLObject, Items, RequestObject, Header, Body, URLEncodedParameter, Event, Script } from './IPMCollection'
import { helpers } from 'faker';

export class PMConverter extends TestBase {

    private pmCollection: IPMCollection = {} as any;
    private envVariables: Variable[] = []

    constructor(debug?: boolean) {
        super(debug, "PMConverter")
    }

    public async save(testConfig: ITestConfigData, outDir: string) {
        let fileName: string = testConfig.testName.replace(/\s/g, '_')
        let testFile = path.resolve(outDir, fileName + ".json")
        this._logger.info("Saving converted script in file=%s", testFile)
        let writeFile = util.promisify(fs.writeFile);
        let test: string = JSON.stringify(testConfig, null, 2)
        await writeFile(testFile, test)
        return test
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

    private convertScriptLine(line: string) {
        line = line.replace(/pm.collectionVariables.set/gm, "uxs.setVar")
        line = line.replace(/pm.collectionVariables.get/gm, "uxs.getVar")
        line = line.replace(/postman.setEnvironmentVariable/gm, "uxs.setVar")
        line = line.replace(/postman.getEnvironmentVariable/gm, "uxs.getVar")
        return line

    }

    private convertScripts(events: Event[], step: ITestStep, request?: IRequest) {
        if (request) {
            if (!request.scripts)
                request.scripts = []
        }
        if (step) {
            if (!step.scripts)
                step.scripts = []
        }

        events.forEach(event => {
            if (!event.disabled) {
                let convertedScript: IScript = {} as any
                let script: Script = event.script as any;
                let convertedCode
                if (Array.isArray(script.exec)) {
                    let t=this.convertScriptLine(script.exec.join('\n'))
                    convertedCode=t.split('\n')
                    /*
                    convertedCode = []
                    script.exec.forEach(line => {
                        convertedCode.push(this.convertScriptLine(line))
                    })
                    */


                } else {
                    convertedCode = this.convertScriptLine(script?.exec as any)
                }
                convertedScript.script = convertedCode
                switch (event.listen) {
                    case 'prerequest':
                        convertedScript.scope = (request) ? "before" : "beforeEach"

                        break;
                    case 'test':
                        convertedScript.scope = (request) ? "after" : "afterEach"
                        break
                }
                if (request) {
                    request.scripts?.push(convertedScript)
                }
                else {
                    step.scripts?.push(convertedScript)
                }
            }
        }
        )
    }

    private convertAuth(auth: Auth, config: IRequestConfig) {

        let authType = auth.type.toString()

        switch (authType) {
            case "apikey":
                let keys = auth.apikey || []
                let key: string = ""
                let value: string = ""
                let _in: string = "";
                keys.forEach(apiKey => {
                    switch (apiKey.key) {
                        case 'key':
                            key = apiKey.value
                            break;
                        case 'value':
                            value = apiKey.value
                            break;
                        case 'in':
                            _in = apiKey.value
                            break;

                    }

                }
                )
                if (_in === 'query') {
                    if (!config.params)
                        config.params = {}
                    config.params[key] = value
                }
                else {
                    if (!config.headers)
                        config.headers = {}
                    config.headers[key] = value
                }
                break
            case "basic":
                let basic_keys = auth.basic || []
                let username: string = ""
                let password: string = ""
                basic_keys.forEach(key => {
                    switch (key.key) {
                        case 'username':
                            username = key.value
                            break;
                        case 'password':
                            password = key.value
                            break;
                    }
                }
                )
                config.auth = { "username": username, "password": password }
                break;

        }
        return config
    }

    private convertRequest(step: ITestStep, item: Items, config: IRequestConfig) {
        let req: any = item.request
        let request: IRequest = {} as any;
        request.config = config

        if (typeof req !== 'string') {
            let ro: RequestObject = req
            if (ro.auth)
                request.config = this.convertAuth(ro.auth, request.config)
            switch (ro.method) {
                case 'POST':
                    request.config.method = 'post'
                    break;
                case 'POST':
                    request.config.method = 'post'
                    break;
                case 'DELETE':
                    request.config.method = 'delete'
                    break;
                case 'PATCH':
                    request.config.method = 'patch'
                    break;
                case 'PUT':
                    request.config.method = 'put'
                    break;
                case 'OPTIONS':
                    request.config.method = 'options'
                    break;
                case 'LINK':
                    request.config.method = 'link'
                    break;
                case 'UNLINK':
                    request.config.method = 'unlink'
                    break;
                case 'HEAD':
                    request.config.method = 'head'
                    break;
                default:
                    request.config.method = 'get'
            }
            if (typeof ro?.url === 'string') {
                request.config.url = ro.url
            }
            else {
                let url: URLObject = ro.url as any
                request.config.url = url.raw
                let pos = url.raw?.indexOf('?') || 0
                if (pos > 0)
                    request.config.url = url?.raw?.substr(0, pos)

                if (url.query) {
                    url.query.forEach(param => {
                        if (!param.disabled) {
                            if (!request.config.params)
                                request.config.params = {} as any
                            let key: any = param.key
                            request.config.params[key] = param.value
                        }

                    })
                }
            }
            if (ro.header) {
                if (typeof ro?.header === 'string') {
                    ;
                }
                else {
                    let headers: Header[] = ro.header as any
                    headers.forEach(header => {
                        if (!header.disabled) {
                            if (!request.config.headers)
                                request.config.headers = {} as any
                            let key: any = header.key
                            request.config.headers[key] = header.value
                        }
                    }
                    )
                }
                if (ro.body) {
                    let body: Body = ro.body as any;
                    let bodyAny: any = ro.body
                    let lang = bodyAny?.options?.raw?.language || ""
                    switch (body.mode) {
                        case 'raw':
                            if (lang === 'json') {
                                let data = JSON.parse(body.raw as any)
                                request.config.data = data
                            } else {
                                request.config.data = body.raw
                            }
                            break
                        case 'urlencoded':
                            let urlencoded: URLEncodedParameter[] = body.urlencoded as any;

                            urlencoded.forEach(element => {
                                if (!element.disabled) {
                                    if (!request.config.data)
                                        request.config.data = {} as any;
                                    let key: any = element.key
                                    request.config.data[key] = element.value

                                }

                            });
                            break
                    }
                }


            }
        }
        if (item.event) {
            this.convertScripts(item.event, step, request)
        }
        return request;
    }

    private convertStep(item: Items, params: any) {
        let config: IRequestConfig = {} as any;
        if (params)
            config.params = params
        let step: ITestStep = {} as any;

        if (item.auth)
            config = this.convertAuth(item.auth, config)
        step.stepName = (item.name != undefined) ? item.name : "";
        step.requests = []
        if (item.request) {
            step.requests.push(this.convertRequest(step, item, config))
        } else if (item.item) {
            item.item.forEach(item => {
                if (item.request) {
                    step.requests.push(this.convertRequest(step, item, config))
                }
            }
            )
        }
        if (item.event) {
            this.convertScripts(item.event, step)
        }
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
            if (!v.disabled) {
                let variable: IVariable = this.toIVariable(v)
                varMap.set(variable.key, variable)
            }

        }
        )
        this.envVariables.forEach(v => {
            this._logger.debug("Reading variable [%s] value=%s from environment", v.key || v.name, v.value || "")
            if (!v.disabled) {
                let variable: IVariable = this.toIVariable(v)
                varMap.set(variable.key, variable)
            }

        }
        )

        testConfig.variables = []
        for (const variable of varMap.values()) {
            testConfig.variables.push(variable)

        }
        let config: IRequestConfig = {} as any;
        if (this.pmCollection.auth) {

            config = this.convertAuth(this.pmCollection.auth, config)
            if (!config.params)
                testConfig.config = config
        }

        testConfig.steps = []
        this.pmCollection.item?.forEach(item => {

            this._logger.debug("Reading Item [%s]", item.name, item.description)


            let step: ITestStep = this.convertStep(item, config.params)
            testConfig.steps.push(step)
        }
        )
        return testConfig
    }

}