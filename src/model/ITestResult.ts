import {AxiosError,AxiosRequestConfig} from 'axios'
import {IVariable} from './ITestConfig'

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

export interface IAssertionResult {
    description:string
    success: boolean
    failStep:boolean
    value:any
    expression:string
}

export interface IStepResult {
    stepName:string
    success:boolean
    duration: number
    ignoreDuration:boolean
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
