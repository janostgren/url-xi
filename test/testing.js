console.info("Testing")
let e = "let arr=['max','min','avg'];arr[Math.floor(Math.random() * arr.length)]"
try {
    var v = eval(e)

    console.info("eval=", v)
}
catch (error) {

}