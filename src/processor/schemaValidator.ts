import * as jsonSchema from 'jsonschema' 
import * as testSchema from '../model/schema'


let errors:Array<any> 

export function validate(json:Object) {
    let validator:jsonSchema.Validator= new jsonSchema.Validator() 

    errors=[]
    let results:jsonSchema.ValidatorResult=validator.validate(json, testSchema.testCaseSchema)
    if(!results.valid) {
        errors=results.errors
    }
    return results.valid
}

export function getErrors() {
    return errors;
}


