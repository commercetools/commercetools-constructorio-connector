const _ = require('lodash')

module.exports = languageCode => {
    let getURL = product => `https://demo.commercetools.com/${languageCode}/${product.slug[languageCode]}.html`

    let getAttributeValue = attribute => {
        return _.get(attribute, `value.label[${languageCode}]`) ||
            _.get(attribute, `value[${languageCode}]`) ||
            _.get(attribute, `value.label`) ||
            _.get(attribute, `value`)
    }
    
    let mapAttributes = (model, attributes) => _.zipObject(
        _.map(model, 'name'),
        _.map(model, att => getAttributeValue(_.find(attributes, a => a.name === att.name)))
    )
    
    let baseMapProduct = product => {
        let searchableAttributes = _.filter(product.productType.obj.attributes, att => att.isSearchable)
        let [productAttributes, variantAttributes] = _.partition(searchableAttributes, att => att.attributeConstraint === 'SameForAll')
    
        return {
            item_name: product.name[languageCode],
            section: 'Products',
            url: getURL(product),
            image_url: _.get(product, 'masterVariant.images[0].url'),
            description: _.get(product, `description.${languageCode}`) || _.get(product, `metaDescription.${languageCode}`),
            id: product.slug[languageCode],
            facets: mapAttributes(productAttributes, product.masterVariant.attributes),
            keywords: [],
            variations: _.map(_.concat([product.masterVariant], product.variants), variant => {
                return {
                    id: variant.sku,
                    url: getURL(product),
                    facets: mapAttributes(variantAttributes, variant.attributes),
                    keywords: [variant.sku],
                }
            }),
        }
    }
    
    let mapProduct = product => {
        let mapped = baseMapProduct(product)
        let mapperPath = global.config.get('constructor.io:mapper')
        if (mapperPath) {
            mapped = require(`${global.__basedir}/src/${mapperPath}`).mapProduct(product, mapped)
        }
        return mapped
    }
    
    let mapProducts = products => ({
        section: 'Products',
        items: _.map(products, mapProduct)
    })

    return { mapProducts }
}
