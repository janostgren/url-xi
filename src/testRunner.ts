import { TestConfig, ITestConfigData, ITestStep, IHttpRequest } from './testConfig'
import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'


import { Api } from './api';
class TestRunner {
    private _debug: boolean = false;
    private _testConfig: TestConfig
    constructor(config: TestConfig) {
        this._testConfig = config

    }
    public async run(debug: boolean = false) {
        this._debug = debug

        if (this._debug)
            console.debug("TestRunner %s started...", this._testConfig.configData.testName);
        try {
            for (let idx: number = 0; idx < this._testConfig.configData.steps.length; idx++) {
                let testStep: ITestStep = this._testConfig.configData.steps[idx];
                if (this._debug)
                    console.debug("Running step %s ", testStep.stepName)

                let request: IHttpRequest = testStep.request

                let config: AxiosRequestConfig = {
                    baseURL: this._testConfig.configData.baseUrl,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
                let api: Api = new Api(config);
                let response: AxiosResponse;
                let method: string = request.method
                switch (method.toLowerCase) {
                    default:
                        response = await api.get(request.path)

                }
                if(response)
                    console.log(response.data)
            }
        } catch (error) {
            console.error(error)

        }
    }

}

export =TestRunner;