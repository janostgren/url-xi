import { Method} from 'axios'

export type AssertionType = 'regexp' | 'javaScript' | 'value'
export interface IAssertion {
    description:string
    type:AssertionType
    expression:string
    failStep?:boolean
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
    expectedStatus?:number
    assertions?:IAssertion[]
}

export type ExtractorType = 'jsonpath' | 'xpath' | 'regexp'| 'header' | 'cookie'|'javaScript'

export interface IExtractor {
    type: ExtractorType
    expression: string
    variable: string
    counter?: boolean
    array?:boolean
   
}
export interface ITestStep {
    stepName: string
    ignoreDuration?:boolean
    requests: IRequest[]
}

export type VariableType = 'string' | 'number' | 'array'
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


export interface IAssertionResult {
    description:string
    succcess: boolean
    failStep:boolean
    actualResult:string
}