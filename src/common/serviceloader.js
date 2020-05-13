const express = require('express')
const router = express.Router();
const fs = require('fs-extra')
const _ = require('lodash')

const subscriberManager = require('./subscriptionManager')

let routes = {
    extensions: [],
    microservices: [],
    admin_microservices: [],
    subscriptions: []
}

let getServices = () => _.flatten(_.concat([], Object.values(routes)))
let getService = key => _.ff(getServices(), service => service.key === key)

router.getServices = getServices;
router.getService = getService;
router.canHandle = req => {
    let service = _.ff(getServices(), service => service.path === req.path && service.method === req.method.toLowerCase())
    return service && service.handle
}

let loadDir = dir => {
    let service = require(dir)
    let serviceName = _.last(dir.split('/'))

    _.each(Object.keys(service), key => {
        let objects = service[key]
        _.each(objects, obj => {
            obj.type = key
            obj.service = serviceName
            routes[key].push(obj)

            switch (key) {
                case 'extensions':
                    router.post(obj.path, async (req, res, next) => {
                        let h = _.get(obj, `triggers.${req.body.resource.typeId}.${req.body.action}`)
                        if (h) {
                            return res.status(200).json({ actions: await h(req, res, next) })
                        }
                        else {
                            next({ error: `Handler not found for ${req.body.resource.typeId} / ${req.body.action} under path ${req.path}` })
                        }
                    })
                    break;

                case 'microservices':
                case 'admin_microservices':
                    let paths = Array.isArray(obj.path) ? obj.path : [obj.path]
                    _.each(paths, path => {
                        router[obj.method || 'get'](path, async (req, res, next) => {
                            req.getService = getService
                            res.status(200).json(await obj.handle(req, res, next))
                        })
                    })
                    break;

                case 'subscriptions':
                    subscriberManager.subscribe(obj)
                    break;

                default:
                    break;
            }
        })
    })
}

let serviceDir = `${__dirname}/../services`
if (fs.existsSync(serviceDir)) {
  _.each(utils.file.getSubdirectories(serviceDir), loadDir)
}
else {
  logger.warn(`Couldn't find a services directory`)
}

// load the common services directory
loadDir('./services')

console.log(`${__dirname}/../../docs`)

// load the /api route
router.get('/api', (req, res) => res.json(getServices()))
router.use('/docs', express.static(`${__dirname}/../../docs`))

module.exports = router