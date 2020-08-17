const express = require('express')
const router = express.Router()
const fs = require('fs-extra')
const _ = require('lodash')
const CT = require('ctvault')
const pluralize = require('pluralize')
const utils = require('./utils')

const subscriberManager = require('./subscriptionManager')

let routes = {
    extensions: [],
    microservices: [],
    admin_microservices: [],
    subscriptions: [],
    ui: [],
}

let services = []

router.getServices = () => services
router.getService = key =>
    _.ff(router.getServices(), service => service.key === key)
router.getHooks = () => _.flatten(_.concat([], Object.values(routes)))
router.getHook = key => _.ff(router.getHooks(), hook => hook.key === key)

let loadDir = async dir => {
    if (!fs.existsSync(`${dir}/index.js`)) { return }

    let service = require(dir)
    service.key = _.last(dir.split('/'))
    services.push(service)
    service.asyncInit && await service.asyncInit()

    _.each(Object.keys(service), key => {
        if (key === 'asyncInit' || key === 'key' || key === 'model') {
            return
        }
        let objects = service[key]
        _.each(objects, obj => {
            obj.type = key
            obj.service = service.key
            routes[key].push(obj)

            switch (key) {
                case 'extensions':
                    router.post(obj.path, async (req, res, next) => {
                        let h = _.get(
                            obj,
                            `triggers.${req.body.resource.typeId}.${req.body.action}`
                        )
                        if (h) {
                            let actions = await h(req, res, next)
                            if (!res.headersSent) {
                                return res.status(200).json({ actions })
                            }
                        } else {
                            next({
                                error: `Handler not found for ${req.body.resource.typeId} / ${req.body.action} under path ${req.path}`,
                            })
                        }
                    })
                    break

                case 'microservices':
                case 'admin_microservices':
                    let paths = Array.isArray(obj.path) ? obj.path : [obj.path]
                    _.each(paths, path => {
                        router[obj.method || 'get'](
                            path,
                            async (req, res, next) => {
                                req.getHook = router.getHook

                                try {
                                    let response = await obj.handle(req, res, next)
                                    if (!res.headersSent) {
                                        res.status(200).json(response)
                                    }
                                } catch (error) {
                                    next(error)
                                }
                            }
                        )
                    })
                    break

                case 'subscriptions':
                    subscriberManager.subscribe(obj)
                    break

                case 'ui':
                    router.use(
                        obj.path,
                        express.static(
                            `${__dirname}/../services/${service.key}/${obj.localPath}`
                        )
                    )
                    break

                default:
                    break
            }
        })
    })
}

let compareModel = opts => ct => async model => {
    let dataModel = await ct[opts.typeKey].ensure(model)
    let newDataModel = model

    let dmKeys = _.map(dataModel[pluralize(opts.attributeKey)], 'name')
    let ndmKeys = _.map(newDataModel[pluralize(opts.attributeKey)], 'name')

    let addActions = _.map(_.difference(ndmKeys, dmKeys), key => {
        let action = {
            action: `add${opts.actionKey}`,
        }
        action[opts.attributeKey] = _.find(
            newDataModel[pluralize(opts.attributeKey)],
            fd => fd.name === key
        )
        return action
    })

    let removeActions = _.map(_.difference(dmKeys, ndmKeys), key => {
        let action = {
            action: `remove${opts.actionKey}`,
        }
        action[opts.fieldKey] = key
        return action
    })

    let actions = _.concat(addActions, removeActions)
    if (actions.length > 0) {
        await ct[opts.typeKey].update(dataModel, actions)

        if (addActions.length > 0) {
            logger.info(
                `Data model [ ${
                    model.key
                } ] updated: added fields [ ${_.difference(
                    ndmKeys,
                    dmKeys
                )} ] for project [ ${ct.projectKey} ]`
            )
        }
        if (removeActions.length > 0) {
            logger.info(
                `Data model [ ${
                    model.key
                } ] updated: removed fields [ ${_.difference(
                    dmKeys,
                    ndmKeys
                )} ] for project [ ${ct.projectKey} ]`
            )
        }
    } else {
        logger.info(
            `Data model [ ${model.key} ] up to date for project [ ${ct.projectKey} ]`
        )
    }
}

let compareDataModel = compareModel({
    typeKey: 'types',
    attributeKey: 'fieldDefinition',
    actionKey: 'FieldDefinition',
    fieldKey: 'fieldName',
})

let compareProductDataModel = compareModel({
    typeKey: 'productTypes',
    attributeKey: 'attribute',
    actionKey: 'AttributeDefinition',
    fieldKey: 'name',
})

let compareDataModels = async (ct, service) =>
    await Promise.all(
        Object.values(service.model.types || {}).map(await compareDataModel(ct))
    )

let compareProductDataModels = async (ct, service) =>
    await Promise.all(
        Object.values(service.model.productTypes || {}).map(
            await compareProductDataModel(ct)
        )
    )

module.exports = async () => {
    let serviceDir = `${global.__basedir}/src/services`
    if (fs.existsSync(serviceDir)) {
        await Promise.all(utils.file.getSubdirectories(serviceDir).map(loadDir))
    }

    // load the common services directory
    await loadDir(`${global.__basedir}/src/common/services`)

    let cts = await CT.getClients()
    await Promise.allSettled(
        cts.map(async ctinfo => {
            let ct = await CT.getClient(ctinfo.projectKey)
            if (!ct.expired) {
                let extensions = await ct.extensions.all()
                await Promise.all(
                    extensions.map(async ext => {
                        let hook = router.getHook(ext.key)
                        
                        if (hook && hook.service) {
                            let service = router.getService(hook.service)
                            await compareDataModels(ct, service)
                            await compareProductDataModels(ct, service)
                        }
                    })
                )
            }
        })
    )

    // load the /api route
    router.get('/api', (req, res) => res.json(router.getHooks()))
    router.use('/docs', express.static(`${__dirname}/../../docs`))
    return router
}
