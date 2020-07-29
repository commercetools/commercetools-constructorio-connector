const _ = require('lodash')

module.exports = {
    mapProduct: (product, mapped = {}) => {
        let parentCategory = product.categories[0].obj
    
        // there are no keywords in the current index
        delete mapped.keywords
    
        mapped.id = product.id
    
        // change URLs to match existing data
        mapped.url = `/p/${parentCategory.id}/${product.slug.en}`
        mapped.image_url = ''
    
        // and facets
        mapped.facets = {
            Brand: [parentCategory.name.en],
            Price: product.masterVariant.prices[0].value.centAmount / 100.0,
            Category: [parentCategory.name.en]
        }
    
        // set group_ids based on the categories this product is in
        mapped.group_ids = _.map(product.categories, c => c.obj.key || c.obj.id)

        // not worrying about variations just yet
        delete mapped.variations

        return mapped
    }
}