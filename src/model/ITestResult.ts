import {AxiosError,AxiosRequestConfig} from 'axios'
import {IVariable} from './ITestConfig'

interface IBaseResult {
    startTime:number
    duration:number
    success:boolean
} 

export interface IRequestResult extends IBaseResult{
    config?: AxiosRequestConfig
    error?:AxiosError
    data?: any
    headers?: any
    status?: number
    statusText?: string
   
}

export interface IAssertionResult {
    description:string
    success: boolean
    failStep:boolean
    value:any
    expression:string
}

export interface IStepResult extends IBaseResult{
    stepName:string
    ignoreDuration:boolean
    requestResults:IRequestResult[]
    assertions?:IAssertionResult[]
}


export interface ITestResults extends IBaseResult {
    testName: string,
    baseURL: string,
   // totalDuration: number
    returnValue: number
   
    variables?: IVariable[],
    errors?:object[]
    stepResults: IStepResult[]
}
