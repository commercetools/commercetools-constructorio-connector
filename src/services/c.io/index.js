// third party imports
const _ = require('lodash')

// local imports
const mapper = require('./mapper')
const cioclient = require('./cioclient')

// get constructor.io client based on the credentials in the connected CT project
const getCIOClient = async ct => cioclient(await ct.customObjects.ensure({
    container: "config",
    key: "constructor.io",
    value: {
        apiToken: config.get('constructor.io:apiToken'),
        apiKey: config.get('constructor.io:apiKey'),
        languageCode: "en"
    }
}))

// on update, only update constructor.io if the product has no staged changes (is published)
const updated = async ({ ct, resource }) => {
    // if the product has staged changes, just bail 
    if (resource.masterData.hasStagedChanges) { return }

    // get the current product data
    let product = resource.masterData.current
    product.productType = { obj: await ct.productTypes.get({ id: resource.productType.id }) }
    product.categories = await Promise.all(product.categories.map(async catRef => ({ obj: await ct.categories.get({ id: catRef.id }) })))
    return await exportProducts(ct)([product])
}

// export the entire project catalog to constructor.io
const exportProducts = ct => async products => {
    let cio = await getCIOClient(ct)
    cio.addOrUpdateItemBatch(mapper(cio.languageCode).mapProducts(products))
}

module.exports = {
    microservices: [{
        key: 'export-one-to-c.io',
        path: '/api/c.io/exportProduct',
        handle: async ({ ct, query }) => await exportProducts(ct)([await ct.productProjections.get({ id: query.id }, { expand: ['productType', 'categories[*]'] })]),
    },
    {
        key: 'export-to-c.io',
        path: '/api/c.io/export',
        method: 'post',
        handle: async ({ ct }) => await Promise.all(_.chunk((await ct.productProjections.all({ expand: ['productType', 'categories[*]'] })), 1000).map(exportProducts(ct))),
    }],
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