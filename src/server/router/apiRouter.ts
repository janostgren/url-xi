import {ApiController} from '../controller/apiController'
import express, { Router } from 'express' 

let controller:ApiController = new ApiController()
export var router = express.Router();
const api_route = '/url-xi'
const api_parse = api_route+'/parse'
const api_run = api_route+'/run'

router.post(api_parse,function (request:any, response:any) {
    controller.parse(request,response)
})
router.post(api_run,async function (request:any, response:any) {
    await controller.run(request,response)
})

