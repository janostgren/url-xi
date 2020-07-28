#! /usr/bin/env node
import { Command } from 'commander';
import { TestConfig } from '../config/testConfig'
import TestRunner from '../processor/testRunner'
import { TestResultProcessor } from '../processor/testResultProcessor';
import { configure, getLogger, Logger } from "log4js";

let logConfig: string = "./config/log4js.json"
if (process.platform === 'win32')
    logConfig = ".\\config\\log4js.json"

configure(logConfig)
let logger = getLogger('app')
let version="1.1.1"

let program = new Command();
program.version(version);

program
    .requiredOption('-f, --file <file>', 'test config file')
    .option('-r, --results <dir>', 'results dir')
    .option('-xh, --xheaders <headers>', 'extra headers', '{}')
    .option('-d, --debug', 'output extra debugging')

program.parse(process.argv);

logger.info("url-xi(%s) started with %s", version, process.argv)

let test_config: string = program.file;
let result_dir: string = program.results;
let headers: any = JSON.parse(program.xheaders)
let debug: boolean = program.debug

run(test_config, result_dir, headers, debug, logger)

async function run(test_config: string, result_dir: string, headers: any, debug: boolean, logger: Logger) {
    try {
        let testConfig: TestConfig = new TestConfig(headers, debug);
        await testConfig.createFromFile(test_config);
        let resultProccessor: TestResultProcessor = new TestResultProcessor(testConfig.configData, debug)
        let testRunner: TestRunner = new TestRunner(testConfig, debug);
        await testRunner.run(resultProccessor);
        resultProccessor.createResults();
        resultProccessor.viewResults();
        if(result_dir) {
            resultProccessor.saveResults(result_dir)
        }
    } catch (error) {
        logger.error(error)
    }
};

