
var faker = require('faker')
console.info("Testing")


var n = "12"
console.log(isNaN(Number(n)) ? "Not a number" : "Is a number", Number(n))

var inputs = 'inp1 = Kalle a, inp2 = "Nisse Person", inp3=12,x='

var arr = inputs.split(',').map(item => item.trim());
let inpMap = new Map()
arr.forEach(item => {
    //console.log("item=%s", item)

    let arr2 = item.split('=').map(item => item.trim());
    for (let idx = 0; idx < arr2.length - 1; idx += 2) {
        // console.log("var name=%s, value=%s", arr2[idx], arr2[idx+1])
        inpMap.set(arr2[idx], arr2[idx + 1])
    }

}
)
for (const [key, value] of inpMap.entries()) {
    console.log(key, value);
  }


let name = faker.date.future(10)
console.log(name)
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

function isDotedString(str) {
    return str && ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'")))
}
function unDotify(str) {
    return isDotedString(str) ? str.substring(1, str.length - 1) : str
}




