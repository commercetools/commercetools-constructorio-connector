const _ = require('lodash')
const cio = require('./cioclient')
const mapper = require('./mapper')

const updated = async ({ resource }) => !resource.masterData.hasStagedChanges && await exportProduct(resource.masterData.current)
const exportProduct = async product => await cio.addOrUpdateItem(mapper.mapProduct(product))
const exportProducts = async products => await cio.addOrUpdateItemBatch({
    section: 'Products',
    items: _.map(products, mapper.mapProduct)
})

module.exports = {
    asyncInit: cio.verify,
    microservices: [
        {
            key: 'export-one-to-c.io',
            path: '/api/c.io/exportProduct',
            handle: async ({ ct, query }) => await exportProduct(await ct.productProjections.get({ id: query.id })),
        },
        {
            key: 'export-to-c.io',
            path: '/api/c.io/export',
            method: 'post',
            handle: async ({ ct }) => await Promise.all(_.chunk((await ct.productProjections.all()), 1000).map(exportProducts)),
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
