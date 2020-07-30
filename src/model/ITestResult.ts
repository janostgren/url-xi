import {AxiosError,AxiosRequestConfig} from 'axios'
import {IAssertionResult,ITestStep,IVariable} from './ITestConfig'

export interface IXStepResult {
    step: ITestStep
    config?: AxiosRequestConfig
    error?:AxiosError
    data?: any
    headers?: any
    status?: number
    statusText?: string
    duration: number
    success:boolean
    assertions:IAssertionResult[]
}

export interface ITestResults {
    testName: string,
    variables?: IVariable[],
    baseURL: string,
    stepResults: IXStepResult[]
    totalDuration: number
    returnValue: number
    success:boolean
}
