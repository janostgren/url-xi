import { AxiosResponse, Method,AxiosError } from 'axios'

export interface IRequestConfig {
    method?: Method,
    url?: string,
    headers?: any
    data?: any,
    params?: any
    auth?: any
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
    response: AxiosResponse
    error?:AxiosError
    duration: number
}