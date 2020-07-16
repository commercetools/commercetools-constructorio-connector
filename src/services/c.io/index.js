// third party imports
const _ = require('lodash')

// local imports
const mapper = require('./mapper')
const cioclient = require('./cioclient')

// get constructor.io client based on the credentials in the connected CT project
const getCIOClient = async ct => cioclient(await ct.customObjects.ensure(mapper.defaultCIOConfig))

// on update, only update constructor.io if the product has no staged changes (is published)
const updated = async ({ ct, resource }) => {
    let productType = await ct.productTypes.get({ id: resource.productType.id })
    let product = resource.masterData.current
    product.productType = { obj: productType }
    return !resource.masterData.hasStagedChanges && await exportProduct(ct)(product)
}

// export one product to constructor.io based on a CT product ID
const exportProduct = ct => async product => (await getCIOClient(ct)).addOrUpdateItem(mapper.mapProduct(product))

// export the entire project catalog to constructor.io
const exportProducts = ct => async products => (await getCIOClient(ct)).addOrUpdateItemBatch(mapper.mapProducts(products))

module.exports = {
    microservices: [
        {
            key: 'export-one-to-c.io',
            path: '/api/c.io/exportProduct',
            handle: async ({ ct, query }) => await exportProduct(ct)(await ct.productProjections.get({ id: query.id }, { expand: ['productType'] })),
        },
        {
            key: 'export-to-c.io',
            path: '/api/c.io/export',
            method: 'post',
            handle: async ({ ct }) => await Promise.all(_.chunk((await ct.productProjections.all({ expand: ['productType'] })), 1000).map(exportProducts(ct))),
        },
    ],
    subscriptions: [{
        key: 'product-listener',
        changes: {
            product: {
                ResourceCreated: updated,
                ResourceUpdated: updated
            }
        }
    }]
}
