console.info("Testing")
let e = "let arr=['max','min','avg'];arr[Math.floor(Math.random() * arr.length)]"
try {
    var v = eval(e)
    var x = 44/0
    var o = 12
    var obj={"name":"tom","age":12}
    let js=JSON.stringify(o)
    let json= JSON.parse (obj)

    console.info("eval=%s, js=%s", v,json)
}
catch (error) {
    console.error(error.message,error.name)
    let s = JSON.stringify(error)
    if( s === "{}") {
        errJson = {"name":error.name,"message":error.message}
        console.log(errJson)
    }
   

    

}