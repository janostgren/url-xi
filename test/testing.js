console.info(__filename)
let m=1
let str="kalle ?/={{_xxx}}"
let val = str.replace(/{{([A-Za-z_]\w+)}}/gm, function (x, y) {
           
    console.log(x,y)
   
    return y
})
console.log(val)
