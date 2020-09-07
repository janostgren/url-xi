import fs from 'fs';
import util from 'util';

export async function sleep(ms:number) {
    await new Promise(resolve => setTimeout(resolve,ms))
}


export function toJson (str:any) {
    try {
        return JSON.parse(str)

    }catch(error) {
        return undefined
    }
}

export function readJsonFile(pathName:string) {
    try {
        
        let content = fs.readFileSync(pathName)
        return JSON.parse(content.toString())
    }
    catch(error) {
        return {}
    }
}

var packInfo:any

export function getPackageInfo () {
    if(packInfo === undefined){
        packInfo=readJsonFile(`${__dirname}/../../package.json`)
    } 
    return packInfo
}

export function isDotedString (str:string){
    return str && ((str.startsWith('"') && str.endsWith('"') ) || (str.startsWith("'") && str.endsWith("'")))
}

export function unDotify(str:string) {
    return isDotedString(str) ? str.substring(1,str.length-1):str
}

const stringConstructor = "test".constructor;
const arrayConstructor = [].constructor;
const objectConstructor = ({}).constructor;

export function whatIsIt(object:any) {
    if (object === null) {
        return "null";
    }
    if (object === undefined) {
        return "undefined";
    }
    if (object.constructor === stringConstructor) {
        return "String";
    }
    if (object.constructor === arrayConstructor) {
        return "Array";
    }
    if (object.constructor === objectConstructor) {
        return "Object";
    }
    {
        return "don't know";
    }
}

