import { Method} from 'axios'

export type AssertionType = 'regexp' | 'javaScript' | 'value'

export interface IAssertion {
    description:string
    type:AssertionType
    expression:string
    value?:any
    failStep?:boolean
    reportFailOnly?:boolean
}

export type TransformerType = 'extract' | 'replace' 

export interface ITransformer {
    type:TransformerType
    source:string
    target:string
    from:string
    to:string 
} 

export interface IRequestConfig {
    
    method?: Method,
    url?: string,
    headers?: any
    data?: any,
    params?: any
    auth?: any
}
export interface IRequest {
    config:IRequestConfig
    extractors?: IExtractor[]
    expectedStatus?:number[]
    assertions?:IAssertion[]
    transformers?:ITransformer[]
    notSaveData?:boolean
}

export type ExtractorType = 'jsonpath' | 'xpath' | 'regexp'| 'header' | 'cookie'|'javaScript'

export interface IExtractor {
    type: ExtractorType
    expression: string
    variable: string
    counter?: boolean
    array?:boolean
    index?:boolean
   
}
export interface IStepIterator {
    varName:string
    value:any 
    waitForValidResponse?:boolean
}

interface IBaseConfigItem {
    idleBetweenRequests?:any
    description?:string
}

export interface ITestStep extends IBaseConfigItem{
    stepName: string
    ignoreDuration?:boolean
    requests: IRequest[]
    iterator?:IStepIterator
}

export type VariableType = 'string' | 'number' | 'array'
export type VariableUsage = 'returnValue' | 'inResponse' | 'info' | 'input'| ''

export interface IVariable {
    key: string,
    type: VariableType,
    usage: VariableUsage,
    value: any,
    validation?:string
    unit?: string
}

export interface ITestConfigData extends IBaseConfigItem{
    testName: string
    variables?: IVariable[]
    baseURL: string
    config?: IRequestConfig
    steps: ITestStep[]
}

export const ResultConfig = {
    contentLength: {
        maxRequestLength: 64 * 1024,
        maxTotalLength: 256 * 1024
    },
    timeout:15*1000

}


