// third party libs
const _ = require('lodash')
const { PubSub } = require('@google-cloud/pubsub');
const CT = require('ctvault')

let handlers = {}

let topic = config.get('pubSub:topic')
if (!_.isEmpty(topic)) {
    const subscription = new PubSub().subscription(topic);
    subscription.on(`message`, async pubSubMessage => {
        logger.debug(`Processing PubSub message...`)

        let message = JSON.parse(pubSubMessage.data)
        pubSubMessage.ack()

        console.log(`MESSAGE: ${JSON.stringify(message, '', 4)}`)

        try {
            let projectKey = message.projectKey
            let ct = await CT.getClient(projectKey)

            let resourceType = message.resource.typeId
            let matching = ct.findMatchingMethod(resourceType)

            let resource = {}
            if (matching) {
                resource = await ct[matching].get({ id: message.resource.id })
            }
            else {
                logger.error(`Couldn't find SDK method to retrieve resource type [ ${resourceType} ]`)
            }

            let subscriptions = await ct.subscriptions.get()
            _.each(_.nmap(subscriptions, s => handlers[s.key]), handler => {
                let method = null

                if (resourceType === 'Message') {
                    if (handler.messages && handler.messages[message.notificationType]) {
                        method = handler.messages[message.notificationType]
                    }
                }
                else {
                    if (handler.changes && handler.changes[resourceType] && handler.changes[resourceType][message.notificationType]) {
                        method = handler.changes[resourceType][message.notificationType]
                    }
                }

                return method && method({ resourceType, message, resource, ct })
            })
        } catch (error) {
            console.error(`Error processing message: `)
            console.error(error.stack)
        }
    });

    subscription.on(`error`, (error) => { logger.error(`Error connecting to Google PubSub: ${JSON.stringify(error)}`) })
    logger.info(`Connected to Google PubSub topic [ ${topic} ]`)
}

module.exports = {
    subscribe: handler => handlers[handler.key] = handler
}