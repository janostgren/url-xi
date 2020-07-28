import { getLogger, Logger } from "log4js";

export abstract class TestBase {
    protected _debug: boolean = false;
    protected _logger:Logger
    
    constructor(debug: boolean = false,loggerName:string='app' ) {    
        this._debug = debug   
        this._logger = getLogger(loggerName)    
    }
}