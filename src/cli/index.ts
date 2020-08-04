#! /usr/bin/env node
import { Command } from 'commander';
import { TestConfig } from '../config/testConfig'
import { ITestResults} from '../model/ITestResult'
import TestRunner from '../processor/testRunner'
import { TestResultProcessor } from '../processor/testResultProcessor';
import { configure, getLogger, Logger } from "log4js";
import path from 'path'
import fs from 'fs'

const cliLogConfig =
{
    "appenders": {

        "app": {
            "type": "file",
            "filename": "log/url-xi.log",
            "maxLogSize": 10485760,
            "numBackups": 3,
            "Append":false
        },
        "errorFile": {
            "type": "file",
            "filename": "log/url-xi-error.log",
            "Append":false
        },
        "errors": {
            "type": "logLevelFilter",
            "level": "ERROR",
            "appender": "errorFile"
        },
        "out":
        {
            "type": "stdout"
        }

    },
    "categories": {
        "default": { "appenders": ["app", "errors", "out"], "level": "INFO" }
    }
}


var test_file: string, result_dir: string, headers: any, debug: boolean
var parse_only: boolean, resultName: string
var base_url:string
var server: string, port: number
var testfile_path: any


let version = "1.1.5"

let program = new Command();
program.version(version);

program
    .option('-f, --file <file>', 'test config file')
    .option('-r, --results <dir>', 'results dir')
    .option('-xh, --xheaders <headers>', 'extra headers', '{}')
    .option('-u, --url <url>', 'base url')
    .option('-d, --debug', 'output extra debugging')
    .option('-po, --parse_only', 'parse json only. No not run')
    .option('-rn, --result_name', 'name of the result')
    .option('-s, --server', 'start as server')
    .option('-p, --port', 'server port', '8066')

program.parse(process.argv);



test_file = program.file;
result_dir = program.results;
headers = JSON.parse(program.xheaders)
base_url=program.url
debug = program.debug
parse_only = program.parse_only
resultName = program.result_name
server = program.server
port = program.port

if (!server) {

    if (!test_file || !test_file.endsWith('.json')) {
        console.error("-f is mandatory and must end with .json")
        process.exit(2)
    }
    testfile_path = path.parse(test_file)
    if (!testfile_path) {
        console.error("The specified test file %s is not valid", test_file)
        process.exit(2)
    }
    if (result_dir && !fs.lstatSync(result_dir).isDirectory()) {
        console.error("The result_dir %s is not valid", result_dir)
        process.exit(2)
    }
    if (!resultName)
        resultName = testfile_path.name
}

/*
Configure logging from parameters
*/
let logConfigFile: string = `${__dirname}/../../config/log4js.json`

if (server) {
    configure(logConfigFile)
}
else {
    if (!result_dir)
        cliLogConfig.categories.default.appenders = ["out"]
    else {
        let applog = path.resolve(result_dir, resultName + ".log")
        let errlog = path.resolve(result_dir, resultName + "_error.log")
        cliLogConfig.appenders.app.filename = applog
        cliLogConfig.appenders.errorFile.filename = errlog
    }
    if (debug)
        cliLogConfig.categories.default.level = "DEBUG"
    configure(cliLogConfig)
}
var logger = getLogger('url-xi')

logger.info("url-xi(%s) started with %s", version, process.argv)


run_cli()

async function run_cli() {
    try {
        let ok:boolean = false
        let testConfig: TestConfig = new TestConfig(headers, base_url,debug);
        let content:any=await testConfig.readFile(test_file);
        if(content) 
            ok=testConfig.create(content)
        if (ok && !parse_only) {
           
            let testRunner: TestRunner = new TestRunner(testConfig, debug);
            let results:ITestResults=await testRunner.run();
            let resultProccessor: TestResultProcessor = new TestResultProcessor(results, debug)
            resultProccessor.viewResults();
            if (result_dir) {
                resultProccessor.saveResults(result_dir,resultName)
            }
        }
    } catch (error) {
        logger.error(error)
    }
};

