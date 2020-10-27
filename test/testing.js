
function countSeverity(arr,value) {
    let count = arr.filter(function (item) {
        if (item === value)
            return true;
        else
            return false;
    });
    return count.length;
}

let sevArr= ['I','I','W','F']

let info = countSeverity(sevArr,'I')
let fail = countSeverity(sevArr,'F')
let err = countSeverity(sevArr,'E')
let warn = countSeverity(sevArr,'W')
console.info(info,warn,fail,err)


