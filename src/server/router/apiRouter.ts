import {ApiController} from '../controller/apiController'
import  * as express from   'express' 

let controller:ApiController = new ApiController()
export var router:express.IRouter = express.Router()
const api_route = '/url-xi'
const api_parse = api_route+'/parse'
const api_run = api_route+'/run'

router.post(api_parse,function (request:express.Request,response:express.Response) {
    controller.parse(request,response)
})
router.post(api_run,async function (request:express.Request,response:express.Response) {
    await controller.run(request,response)
})

