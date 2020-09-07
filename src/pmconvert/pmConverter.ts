import { TestBase } from '../lib/testbase'
import { ITestConfigData, IVariable } from '../model/ITestConfig'
import fs from 'fs';

import util from 'util';
import { IPMCollection, Variable } from './IPMCollection'

export class PMConverter extends TestBase {

    private pmCollection: IPMCollection = {} as any;
    private envVariables: Variable[] = []

    constructor(debug?: boolean) {
        super(debug, "PMConverter")
    }

    public async initFromFile(pathName: string, envPath?: string) {

        try {
            let envContent: string = ""
            let readFile = util.promisify(fs.readFile);
            let content = (await readFile(pathName)).toString();
            if (envPath) {
                let envContent = (await readFile(envPath)).toString();
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
        if (envContent)
            this.envVariables = JSON.parse(envContent)
        this._logger.info("PM collection [%s] initialized", this.pmCollection.info.name)
        return true
    }

    public convert() {
        let testConfig: ITestConfigData = {} as any
        testConfig.testName = this.pmCollection.info.name

        this.pmCollection.variable?.forEach(v => {
            this._logger.debug("Reading variable [%s] value=%s", v.key || v.name, v.value || "")
        }
        )
        this.pmCollection.item?.forEach(item => {
            this._logger.debug("Reading Item [%s]",item.name,item.description)
            
        }
        )
    }

}