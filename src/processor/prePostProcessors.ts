
import { IExtractor, IAssertion, ITransformer, IRequest, ITestStep, IScript } from '../model/ITestConfig'
import { IAssertionResult } from '../model/ITestResult'
import { IScriptingAPI } from '../model/IScriptingAPI'
import { TestConfig } from '../config/testConfig'
import { AxiosResponse } from 'axios'
import { TestBase } from '../lib/testbase'
import * as helpers from '../lib/helpers'

import { JSONPath } from 'jsonpath-plus';
import xpath from 'xpath';
import xmldom from 'xmldom'

export class PrePostProcessors extends TestBase implements IScriptingAPI {
    private _testConfig: TestConfig
    constructor(config: TestConfig, debug: boolean = false) {
        super(debug, "PrePostProcessors")
        this._testConfig = config
    }

    public transform(transformers: ITransformer[]) {
        transformers.forEach(transformer => {
            let vars = transformer.target.split(",")
            let value: string = this._testConfig.replaceWithVarValue(transformer.source)
            switch (transformer.type) {
                case 'extract':
                    let regExp: RegExp = new RegExp(transformer.from)
                    let results = regExp.exec(value)
                    if (results) {
                        if (results.length === 1) {
                            if (vars.length > 0)
                                this._testConfig.setVariableValue(vars[0], results[0])
                        }
                        else {
                            for (let idx: number = 1; idx < results.length; idx++) {
                                if (vars.length >= idx) {
                                    this._testConfig.setVariableValue(vars[idx - 1], results[idx])
                                }
                            }
                        }
                    }
                    break;
                case 'replace':
                    if (transformer.to) {
                        let newValue: string = value.replace(transformer.from, transformer.to)
                        for (let idx: number = 0; idx < vars.length; idx++) {
                            this._testConfig.setVariableValue(vars[idx], newValue)
                        }
                    }
            }

        });
    }

    public validate(assertions: IAssertion[]) {
        let results: IAssertionResult[] = []
        assertions.forEach(assertion => {
            let ok: boolean = false
            let description = this._testConfig.replaceWithVarValue(assertion.description)
            let value: any = ""
            if (assertion.value)
                value = this._testConfig.replaceWithVarValue(assertion.value)
            let result: IAssertionResult = { "description": description, "success": false, "value": value, "expression": "", "failStep": assertion?.failStep || false }
            switch (assertion.type) {
                case 'javaScript':
                    try {
                        let s: string = this._testConfig.replaceWithVarValue(assertion.expression)
                        result.expression = s
                        ok = eval(s) ? true : false
                    }
                    catch (error) {

                    }
                    break;
                case 'regexp':
                    try {
                        let regexp = new RegExp(assertion.expression)
                        result.expression = assertion.expression
                        ok = regexp.test(value)
                    }
                    catch (error) {

                    }
                    break;
                case 'value':
                    result.expression = assertion.expression
                    ok = (value == result.expression)
                    break;
            }
            this._logger.debug("assertion success=%s fail step= %s, value= [%s] expression= [%s], desc= %s", result.success, result.failStep, result.value, result.expression, result.description)
            result.success = ok

            result.failStep = (assertion?.failStep || false) && !ok
            if (!assertion?.reportFailOnly || !ok)
                results.push(result)
        })
        return results
    }

    public extractValues(extractors: IExtractor[], response: AxiosResponse) {
        let value
        extractors.forEach(elem => {
            value = undefined
            try {
                let extractor: IExtractor = elem

                let expression: string = this._testConfig.replaceWithVarValue(extractor.expression)


                switch (extractor.type) {
                    case "jsonpath":
                        if (response.data) {
                            //let jp = jsonPath.query(response.data, extractor.expression)
                            let jp = JSONPath({ path: expression, json: response.data })
                            if (jp) {
                                if (extractor.counter)
                                    value = jp.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * jp.length)
                                else if (extractor.array)
                                    value = jp
                                else
                                    value = jp[Math.floor(Math.random() * jp.length)];
                            }
                        }
                        break
                    case "xpath":
                        if (response.data) {
                            let p = new xmldom.DOMParser()
                            let xml = p.parseFromString(response.data)
                            let nodes = xpath.select(expression, xml)
                            if (nodes) {
                                if (extractor.counter)
                                    value = nodes.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * nodes.length)
                                else if (nodes.length) {
                                    if (Array.isArray(nodes)) {
                                        if (extractor.array) {
                                            let a: string[] = [];
                                            nodes.forEach(node => {
                                                let x: any = node
                                                a.push(x.nodeValue || x.data)

                                            }
                                            )
                                            value = a
                                        }
                                        else {
                                            let ne: any = nodes[Math.floor(Math.random() * nodes.length)];
                                            value = ne.nodeValue || ne.data
                                        }
                                    }
                                    else {
                                        value = nodes
                                    }
                                }
                            }
                        }
                        break
                    case "regexp":
                        if (response.data) {
                            let regexp: RegExp = new RegExp(expression, "gm");
                            let arr = [...response.data.matchAll(regexp)];
                            if (arr) {
                                if (extractor.counter)
                                    value = arr.length
                                else if (extractor.index)
                                    value = Math.floor(Math.random() * arr.length)
                                else if (arr.length > 0) {
                                    if (extractor.array) {
                                        let a: string[] = []
                                        arr.forEach(elem => {
                                            a.push(elem.length > 1 ? elem.slice(1).join("") : elem[0])
                                        }
                                        )
                                        value = a
                                    }
                                    else {
                                        let elem = arr[Math.floor(Math.random() * arr.length)];
                                        if (elem.length > 1)
                                            value = elem.slice(1).join("")
                                        else
                                            value = elem[0]
                                    }
                                }
                            }
                        }
                        break
                    case "header":
                        let headers = response?.headers
                        if (headers)
                            value = headers[
                                expression]
                        break
                    case "cookie":
                        break

                }
                this._logger.debug("extractor type=%s expression=%s value=%s", extractor.type, extractor.expression, value)
                if (value !== undefined) {
                    this._testConfig.setVariableValue(extractor.variable, value)
                }
            } catch (error) {
                this._logger.error(error)
            }
        })
    }

    public runBeforeScripts(step: ITestStep, request?: IRequest) {
        if (step.scripts) {
            step.scripts.forEach(script => {
                if (script.script) {
                    if (request && script.scope === "beforeEach")
                        this.runBeforeScript(script)
                    else if (!request && script.scope === "before")
                        this.runBeforeScript(script)
                }

            }
            )
        }
        if (request && request.scripts) {
            request.scripts.forEach(script => {
                if (script.scope === "before" && script.script)
                    this.runBeforeScript(script)

            }
            )
        }
    }

    public runAfterScripts(step: ITestStep, request?: IRequest,response?:AxiosResponse) {
        if (step.scripts) {
            step.scripts.forEach(script => {
                if (script.script) {
                    if (request && script.scope === "afterEach")
                        this.runAfterScript(script,response)
                    else if (!request && script.scope === "after")
                        this.runAfterScript(script)
                }

            }
            )
        }
        if (request && request.scripts) {
            request.scripts.forEach(script => {
                if (script.scope === "after" && script.script)
                    this.runAfterScript(script,response)
            }
            )
        }
    }

    private runBeforeScript(script: IScript) {
        let jsEval: string = Array.isArray(script.script) ? script.script.join("\n"):script.script
        let uxs: IScriptingAPI = this
        try {
            this._logger.debug("Before script: scope=%s , eval=%s", script.scope, jsEval)
            eval(jsEval)


        }
        catch (error) {
            this._logger.error("Before script: error=%s", error.message)

        }
    }
    private runAfterScript(script: IScript,response?:AxiosResponse) {
        let jsEval: string = Array.isArray(script.script) ? script.script.join("\n"):script.script
        let uxs: IScriptingAPI = this
        let responseBody= response && response.data ? response.data: null
        let responseData= response && response.data ? response.data: null
        let responseType= helpers.whatIsIt(responseBody)
        if(responseType === 'Object' || responseType==='Array')
            responseBody= JSON.stringify(responseBody)
        
        try {
            this._logger.debug("After script: scope=%s , eval=%s", script.scope, jsEval)
            eval(jsEval)

        }
        catch (error) {
            this._logger.error("After script: error=%s", error.message)

        }
    }

    public getVar(key: string) {
        return this._testConfig.getVariableValue(key)

    }

    public setVar(key: string, value: any) {
        this._testConfig.setVariableValue(key, value)

    }
}