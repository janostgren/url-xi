import {AxiosError,AxiosRequestConfig,AxiosResponse} from 'axios'
import {IAssertionResult,ITestStep,IVariable} from './ITestConfig'

export interface IRequestResult {
    config?: AxiosRequestConfig
    error?:AxiosError
    data?: any
    headers?: any
    status?: number
    statusText?: string
    duration: number
    success:boolean
}

export interface IStepResult {
    success:boolean
    duration: number
    requestResults:IRequestResult[]
    assertions?:IAssertionResult[]
}


export interface ITestResults {
    testName: string,
    baseURL: string,
    totalDuration: number
    returnValue: number
    success:boolean
    variables?: IVariable[],
    stepResults: IStepResult[]
}
