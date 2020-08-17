const _ = require('lodash')
const ConstructorIO = require('constructorio');

let constructorIOCallback = methodName => (error, response) => {
    return new Promise((resolve, reject) => {
        logger.debug(`constructor.io: calling method [ ${methodName} ]`)
        if (error) {
            logger.error(`constructor.io: error in method [ ${methodName} ]: ${JSON.stringify(error)}`)
            reject(error)
        } else {
            logger.debug(`constructor.io: successfully executed method [ ${methodName} ]`)
            resolve(response)
        }
    })
}

module.exports = config => {
    let constructorio = new ConstructorIO(config)
    return _.zipObject(Object.keys(ConstructorIO.prototype), _.map(Object.keys(ConstructorIO.prototype), methodName => {
        let method = constructorio[methodName].bind(constructorio)
        return methodName === 'verify' ? () => method(constructorIOCallback(methodName)) : args => method(args, constructorIOCallback(methodName))
    }))
}