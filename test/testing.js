console.info(__filename)
let m=1
let str="kalle ?/={{_xxx}} {{$timestamp}}"
let val = str.replace(/{{(\$?[A-Za-z_]\w+)}}/gm, function (x, y) {
           
    console.log(x,y)
    if(y === "$timestamp")
        y=Date.now().toString()

   
    return y
})
console.log(val)
