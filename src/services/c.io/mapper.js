const _ = require('lodash')

let defaultLanguageCode = 'en'

let getURL = product => `https://demo.commercetools.com/${defaultLanguageCode}/${product.slug[defaultLanguageCode]}.html`

let getAttributeValue = (model, attribute) => {
    switch (model.type.name) {
        case 'text':
            return attribute.value;
    
        case 'enum':
            return attribute.value.label;

        case 'ltext':
            return attribute.value[defaultLanguageCode];

        case 'lenum':
            return attribute.value.label[defaultLanguageCode];

        default:
            break;
    }
}

const mapProduct = product => {
    console.log(JSON.stringify(product))

    let sameForAllAttributes = _.filter(product.productType.obj.attributes, att => att.attributeConstraint === 'SameForAll' && att.isSearchable)
    let variantAttributes = _.filter(product.productType.obj.attributes, att => att.attributeConstraint !== 'SameForAll' && att.isSearchable)

    let productFacets = {}
    _.each(sameForAllAttributes, att => {
        let matchingAttribute = _.find(product.masterVariant.attributes, a => a.name === att.name)
        if (matchingAttribute) {
            let value = getAttributeValue(att, matchingAttribute)
            if (value) {
                productFacets[att.name] = value
            }
        }
    })

    let x = {
        item_name: product.name[defaultLanguageCode],
        section: 'Products',
        url: getURL(product),
        image_url: _.get(product, 'masterVariant.images[0].url'),
        description: _.get(product, `description.${defaultLanguageCode}`) || _.get(product, `metaDescription.${defaultLanguageCode}`),
        id: product.slug[defaultLanguageCode],
        facets: productFacets,
        keywords: [productFacets['designer']],
        variations: _.map(_.concat([product.masterVariant], product.variants), variant => {
            let variantFacets = {}
            _.each(variantAttributes, att => {
                let matchingAttribute = _.find(variant.attributes, a => a.name === att.name)
                if (matchingAttribute) {
                    let value = getAttributeValue(att, matchingAttribute)
                    if (value) {
                        variantFacets[att.name] = value
                    }
                }
            })
    
            return {
                id: variant.sku,
                url: getURL(product),
                facets: variantFacets,
                keywords: [variant.sku],
            }
        }),
    }
    console.log(JSON.stringify(x))
    return x
}

const mapProducts = products => ({
    section: 'Products',
    items: _.map(products, mapper.mapProduct)
})

const defaultCIOConfig = {
    container: "config",
    key: "constructor.io",
    value: {
        apiToken: "YOUR_API_TOKEN",
        apiKey: "YOUR_API_KEY",
        languageCode: "en"
    }
}

module.exports = {
    mapProduct,
    mapProducts,
    defaultCIOConfig
}
