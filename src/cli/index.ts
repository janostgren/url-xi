#! /usr/bin/env node
import { Command } from 'commander';
import { TestConfig } from '../config/testConfig'
import { ITestResults } from '../model/ITestResult'
import { TestRunner } from '../processor/testRunner'
import { TestResultProcessor } from '../processor/testResultProcessor';
import * as log4js from "log4js";
import path from 'path'
import fs from 'fs'
import express from 'express'
import * as apiRouter from '../server/router/apiRouter'
import * as body_parser from 'body-parser'
import * as helpers from '../lib/helpers'


const cliLogConfig =
{
    "appenders": {

        "app": {
            "type": "file",
            "filename": "log/url-xi.log",
            "maxLogSize": 10485760,
            "numBackups": 3

        },
        "errorFile": {
            "type": "file",
            "filename": "log/url-xi-error.log"
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
var nodata: boolean
var base_url: string
var inputs: string
var server: string, port: number

var pack: any = helpers.getPackageInfo()

let version = pack.version || 'version unknown'

let program = new Command();
program.version(version);

program
    .option('-f, --file <file>', 'test config file')
    .option('-r, --results <dir>', 'results dir')
    .option('-xh, --xheaders <headers>', 'extra headers', '{}')
    .option('-i, --inputs <inputs>', 'input variables. Comma separated list of value pairs var=value format', '')
    .option('-u, --url <url>', 'base url')
    .option('-d, --debug', 'output extra debugging')
    .option('-nd, --nodata', 'no response data in report')
    .option('-po, --parse_only', 'parse json only. No not run')
    .option('-rn, --result_name <result_name>', 'name of the result')
    .option('-s, --server', 'start as server')
    .option('-p, --port <port>', 'server port', '8070')

program.parse(process.argv);

test_file = program.file;
result_dir = program.results;
headers = JSON.parse(program.xheaders)
base_url = program.url
debug = program.debug
inputs = program.inputs
parse_only = program.parse_only
nodata = program.nodata
resultName = program.result_name
server = program.server
port = Number(program.port)

if (!server) {

    if (!test_file || !test_file.endsWith('.json')) {
        console.error("-f is mandatory and must end with .json")
        process.exit(9)
    }
    let tf_path = path.resolve(test_file)
    if (!fs.existsSync(tf_path) || !fs.lstatSync(tf_path).isFile()) {
        console.error("The specified test file [%s] is not valid", test_file)
        process.exit(9)
    }
    if (result_dir) {
        let res_path = path.resolve(result_dir)
        if (!fs.existsSync(res_path) || !fs.lstatSync(res_path).isDirectory()) {
            console.error("The result_dir [%s] is not a valid directory", result_dir)
            process.exit(9)
        }
        if(path.dirname(tf_path) === res_path) {
            console.error("The result_dir [%s] and directory of test file [%s] must be different directories ", result_dir,test_file)
            process.exit(9)

        }
        
    }
    if (!resultName) {
        let tf=path.parse(tf_path)
        resultName = tf.name
    }
}

/*
Configure logging from parameters
*/
let logConfigFile: string = `${__dirname}/../../config/log4js.json`

if (server) {
    log4js.configure(logConfigFile)
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
    log4js.configure(cliLogConfig)
}
var logger = log4js.getLogger('url-xi')

logger.info("url-xi(%s) started with %s", version, process.argv)

if (server)
    run_server()
else
    run_cli()

async function run_cli() {
    let exitCode: number = 0
    try {
        let testConfig: TestConfig = new TestConfig(headers, base_url, debug)
        let resultProcessor: TestResultProcessor = new TestResultProcessor(debug)
        let content: any = await testConfig.readFile(test_file);
        exitCode = content ? 0 : 5
        if (content)
            exitCode = testConfig.create(content) ? 0 : 5
        if (exitCode) {
            let errors: Array<object> = testConfig.errors()
            console.error("--- Test Config  parse errors---")
            errors.forEach(error => {
                console.error(error)
            })
            if (result_dir)
                await resultProcessor.saveErrors(content, errors, result_dir, resultName)
        }
        if (exitCode === 0 && !parse_only) {
            let testRunner: TestRunner = new TestRunner(testConfig, debug);
            let results: ITestResults = await testRunner.run(nodata, inputs);
            exitCode = results.stepResults ? 0 : 1
            resultProcessor.viewResults(results);
            if (result_dir) {
                await resultProcessor.saveResults(results, result_dir, resultName)
            }
        }
    } catch (error) {
        logger.error(error)
        exitCode = 1
    }
    process.exit(exitCode)
}

function mapStatic(app: express.Application, dir: string, pathDir: string) {
    let staticDir: string = path.join(__dirname, dir)
    app.use(pathDir, express.static(staticDir))
    logger.info("Static dir %s mapped to path=%s", pathDir, staticDir)

}

function run_server() {

    let app: express.Application = express()
    app.use(body_parser.urlencoded({ extended: true }));
    app.use(body_parser.json());
    app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));
    var router = express.Router();
    router.use(apiRouter.router)
    app.use('/api', router);
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '../../../client/index.html'));
    });

    mapStatic(app, '../../client/resources', '/resources')
    
    app.listen(port, () =>
        logger.info("URL XI server (version %s) started on http port %d", version, port));
}

