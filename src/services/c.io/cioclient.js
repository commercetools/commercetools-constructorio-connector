const _ = require('lodash')
const ConstructorIO = require('constructorio')

let constructorio = new ConstructorIO(global.config.get('constructorio'))
let constructorIOCallback = methodName => (error, response) => {
    logger.debug(`constructor.io: calling method [ ${methodName} ]`)
    return new Promise((resolve, reject) => {
        if (error) {
            logger.error(`constructor.io: error in method [ ${methodName} ]: ${JSON.stringify(error)}`)
            reject(error)
        } else {
            logger.debug(`constructor.io: successfully executed method [ ${methodName} ]`)
            resolve(response)
        }
    })
}

module.exports = _.zipObject(Object.keys(ConstructorIO.prototype), _.map(Object.keys(ConstructorIO.prototype), methodName => {
    let method = constructorio[methodName].bind(constructorio)
    return methodName === 'verify' ? method(constructorIOCallback(methodName)) : args => method(args, constructorIOCallback(methodName))
}))