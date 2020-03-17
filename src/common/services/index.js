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
            url: `${data.protocol}://${data.host}/api${hook.path}`,
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
        path: '/project',
        handle: async ({ data, ct }) => ({
            extensions: await ct.extensions.get(),
            subscriptions: await ct.subscriptions.get()
        })
    },
    {
        key: 'admin-projects',
        path: '/projects',
        handle: async ({ data, ct }) => await CT.getClients()
    },
    {
        key: 'admin-register-project',
        path: '/projects',
        method: 'post',
        handle: async ({ data, ct }) => await CT.saveCredential(data.object)
    },
    // {
    //     key: 'pub-sub-message',
    //     path: '/pubsub',
    //     method: 'post',
    //     handler: async (data, ct, router) => {
    //         router.processPubSub(data.object)
    //         return []
    //     }
    // }
]
    
_.each(serviceTypes, type => {
    admin_microservices.push({
        key: `admin-register-${type}`,
        path: `/${type}`,
        method: 'post',
        handle: async ({ data, ct, getService }) => await ct[type].ensure(payloadGenerator[type](getService(data.object.key), data.object))
    })

    admin_microservices.push({
        key: `admin-delete-${type}`,
        path: `/${type}`,
        method: 'delete',
        handle: async ({ data, ct }) => {
            let service = await ct[type].get({ key: data.params.key })
            return service ? await ct[type].delete({ id: service.id, version: service.version }) : []
        }
    })
})

module.exports = { admin_microservices }