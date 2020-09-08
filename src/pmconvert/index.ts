#! /usr/bin/env node
import { Command } from 'commander';
import {PMConverter} from './pmConverter'

import * as log4js from "log4js";
import path from 'path'
import fs from 'fs'

import * as helpers from '../lib/helpers'


const cliLogConfig =
{
    "appenders": {

        "out":
        {
            "type": "stdout"
        }
    },
    "categories": {
        "default": { "appenders": ["out"], "level": "INFO" }
    }
}


var collection_file: string,
    env_file: string,
    outDir: string,
    debug: boolean;



var pack: any = helpers.getPackageInfo()

let version = pack.version || 'version unknown'

let program = new Command();
program.version(version);

program
    .requiredOption('-c, --collection <file>', 'pm collection file')
    .option('-o, --output <dir>', 'output dir')
    .option('-e, --env <file>', 'environment file')
    .option('-d, --debug', 'output extra debugging')



program.parse(process.argv);

collection_file = program.collection;
env_file = program.env;
outDir = program.output;

debug = program.debug



/*
Configure logging from parameters
*/



if (debug)
    cliLogConfig.categories.default.level = "DEBUG"
log4js.configure(cliLogConfig)

var logger = log4js.getLogger('pmConvert')

logger.info("url-xi pm converter(%s) started with %s", version, process.argv)

let collection_path = path.resolve(collection_file)
if (!fs.existsSync(collection_path) || !fs.lstatSync(collection_path).isFile()) {
    console.error("The specified collection file [%s] is not valid", collection_file)
    process.exit(9)
}
if (env_file) {
    let env_path = path.resolve(env_file)
    if (!fs.existsSync(env_path) || !fs.lstatSync(env_path).isFile()) {
        console.error("The specified environment file [%s] is not valid", env_file)
        process.exit(9)
    }

}
if (outDir) {
    let out_path = path.resolve(outDir)
    if (!fs.existsSync(out_path) || !fs.lstatSync(out_path).isDirectory()) {
        console.error("The output directory [%s] is not a valid directory", outDir)
        process.exit(9)
    }
    if (path.dirname(collection_path) === out_path) {
        console.error("The output directory [%s] and directory of collection file [%s] must be different directories.", outDir, collection_file)
        process.exit(9)

    }

}

run_cli()


async function run_cli() {
    let converter:PMConverter = new PMConverter(debug)
    let exitCode: number = 0
    try {
        await converter.initFromFile(collection_file,env_file)
        let test=converter.convert()
        if(outDir) {
            await converter.save(test,outDir)
        }

    } catch (error) {
        logger.error(error)
        exitCode = 1
    }
    process.exit(exitCode)
}





