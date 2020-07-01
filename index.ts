import { Command } from 'commander';
import {TestConfig} from './src/testConfig'
import TestRunner from './src/testRunner'


let program = new Command();
program.version('0.0.1');

program
    .option('-c, --config <config>', 'test configuration', 'default_test.json')
    .option('-d, --dir <dir>', 'configuration dir', './config')
    .option('-r, --results <dir>', 'results dir', './results')
    .option('-d, --debug', 'output extra debugging')


program.parse(process.argv);
let conf_dir: string = program.dir;
let test_config: string = program.config;
let debug: boolean = program.debug

run(conf_dir,test_config,debug)


async function run (conf_dir:string,test_config:string,debug:boolean) {
    
    console.info("conf_dir=%s, test_config=%s", conf_dir, test_config);
    let testConfig = new TestConfig(debug);
    await testConfig.create(conf_dir, test_config);
    let testRunner = new TestRunner(testConfig);

    await testRunner.run(debug);
};

