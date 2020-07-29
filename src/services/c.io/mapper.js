const _ = require('lodash')
const baseMapper = require('./baseMapper')

module.exports = languageCode => {    
    let mapProduct = product => {
        let mapped = baseMapper.mapProduct(product, {}, languageCode)
        let mapperPath = config.get('constructor.io:mapper')
        if (mapperPath) {
            mapped = require(`${global.__basedir}/src/${mapperPath}`).mapProduct(product, mapped, languageCode)
        }
        return mapped
    }
    
    let mapProducts = products => ({
        section: 'Products',
        items: _.map(products, mapProduct)
    })

    return { mapProducts }
}
