const _ = require('lodash')
const CT = require('ctvault')

let payloadGenerator = {
    extensions: (hook, data) => ({
        key: hook.key,
        triggers: _.map(Object.keys(hook.triggers), key => ({
            resourceTypeId: key,
            actions: _.map(Object.keys(hook.triggers[key]), ak => `${ak}`)
        })),
        destination: {
            type: "HTTP",
            url: `${data.protocol}://${data.host}${data.localPath}${hook.path}`,
            authentication: {
                type: "AuthorizationHeader",
                headerValue: data.project
            }
        }
    }),

    subscriptions: service => ({
        key: service.key,
        destination: config.get('pubSub'),
        changes: mapResourceTypeIds(service.changes),
        messages: mapResourceTypeIds(service.messages)
    })
}

let mapResourceTypeIds = obj => obj && _.map(Object.keys(obj), key => ({ resourceTypeId: key }))

let serviceTypes = ['subscriptions', 'extensions']
let admin_microservices = [
    {
        key: 'admin-project',
        path: '/api/project',
        handle: async ({ data, ct }) => ({
            extensions: await ct.extensions.get(),
            subscriptions: await ct.subscriptions.get()
        })
    },
    {
        key: 'admin-projects',
        path: '/api/projects',
        handle: CT.getClients
    },
    {
        key: 'admin-register-project',
        path: '/api/projects',
        method: 'post',
        handle: async ({ data, ct }) => await CT.saveCredential(data.object)
    },
    {
        key: 'admin-kubernetes-liveness-probe',
        path: '/api/isready',
        handle: () => 'Ready'
    },
    {
        // TODO I NEED HELP
        key: 'ensure-data-model',
        path: '/api/ensureDataModel',
        handle: async ({ ct }) => await Promise.all(Object.values(_.get(require('./model'), 'types')).map(ct.types.ensure))
    }
]
    
_.each(serviceTypes, type => {
    admin_microservices.push({
        key: `admin-register-${type}`,
        path: `/api/${type}`,
        method: 'post',
        handle: async ({ data, ct, getHook }) => await ct[type].ensure(payloadGenerator[type](getHook(data.object.key), data.object))
    })

    admin_microservices.push({
        key: `admin-delete-${type}`,
        path: `/api/${type}`,
        method: 'delete',
        handle: async ({ data, ct }) => {
            let service = await ct[type].get({ key: data.params.key })
            return service ? await ct[type].delete({ id: service.id, version: service.version }) : []
        }
    })
})

module.exports = { admin_microservices }