const _ = require('lodash')

let getAttributeValue = attribute => {
    let value = _.get(attribute.value, 'en') ||
                _.get(attribute.value, 'label.en') ||
                _.get(attribute.value, 'label') ||
                attribute.value
    return (typeof value !== 'boolean') && value
}

module.exports = {
    mapProduct: product => ({
        item_name: _.get(product, 'name.en'),
        section: 'Products',
        url: `https://demo.commercetools.com/en/${product.slug.en}.html`,
        image_url: _.get(product, 'masterVariant.images[0].url'),
        description: _.get(product, 'description.en') || _.get(product, 'metaDescription.en'),
        id: product.slug.en,
        variations: _.map(_.concat([product.masterVariant], product.variants), variant => {
            let facets = _.zipObject(_.map(variant.attributes, 'name'), _.nmap(variant.attributes, getAttributeValue))
            return {
                id: variant.sku,
                url: `https://demo.commercetools.com/en/${product.slug.en}.html`,
                facets,
                keywords: [variant.sku, facets['designer']],
            }
        }),
    })
}
