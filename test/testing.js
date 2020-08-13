
var faker = require('faker')
console.info("Testing")


//let str = '"Kalle"'
//console.log(isDotedString(str),unDotify(str))

let name = faker.date.future(10)
console.log (name)
console.log(faker.fake("{{name.findName}}, {{name.firstName}} {{name.suffix}}"));

let f = 'finance.mask'
console.log(fakeData(f))






function fakeData(str) {
    try {
    return faker.fake(`{{${str}}}`)
    }
    catch (e) {
        return ""
    }
}

function isDotedString (str){
    return str && ((str.startsWith('"') && str.endsWith('"') ) || (str.startsWith("'") && str.endsWith("'")))
}
function unDotify(str) {
    return isDotedString(str) ? str.substring(1,str.length-1):str
}


    

