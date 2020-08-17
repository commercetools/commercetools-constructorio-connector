const _ = require('lodash')
const async = require('async')
const ConstructorIO = require('constructorio')
const cioclient = require('../src/services/c.io/cioclient');
const CT = require('ctvault')

// let constructorioOrig = cioclient({
//     apiToken: 'tok_79rFqrkSyRSzj4k3',
//     apiKey: 'key_gJqStkiOTxzPjCFs'
// })

// let constructorioNew = cioclient({
//     apiToken: 'tok_79rFqrkSyRSzj4k3',
//     apiKey: 'key_Uw5Fs43iLTfSA87F'
// })

let constructorioOrig = new ConstructorIO({
    apiToken: 'tok_79rFqrkSyRSzj4k3',
    apiKey: 'key_gJqStkiOTxzPjCFs'
})

let constructorioNew = new ConstructorIO({
    apiToken: 'tok_79rFqrkSyRSzj4k3',
    apiKey: 'key_Uw5Fs43iLTfSA87F'
})

let getItems = async (cio, page = 1) => {
    return new Promise((resolve, reject) => {
        console.log(`getItems page [ ${page} ]`)
        cio.getItem({
            section: 'Products',
            num_results_per_page: 100,
            page
        }, (e, r) => {
            if (e) { reject(e) }
            else { resolve(r.items) }
        })
    })
}

let getAllItems = async function() {
    return new Promise((resolve, reject) => {
        this.getItem({
            section: 'Products',
            num_results_per_page: 1
        }, async (err, resp) => {
            if (err) { reject(err) }

            let totalPages = Math.ceil(resp.total_count / 100)
            let items = []
            for (let page = 1; page < totalPages + 1; page++) {
                let pageItems = await getItems(this, page)
                items = _.concat(items, pageItems)
            }
            resolve(items)
        })
    })
}

constructorioOrig.getAllItems = getAllItems.bind(constructorioOrig)
constructorioNew.getAllItems = getAllItems.bind(constructorioNew)

let run = async() => {
    let origItems = await constructorioOrig.getAllItems()
    let newItems = await constructorioNew.getAllItems()

    console.log(`Items in original index: ${origItems.length}`)
    console.log(`Items in new index ${newItems.length}`)
    
    let diffItems = _.differenceBy(origItems, newItems, 'id')
    _.each(diffItems, item => {
        console.log(`Differing item: ${item.name}`)
    })
}

run()

// constructorioOrig.getItem({
//     section: 'Products',
//     num_results_per_page: 100
// }, (origErr, origResp) => {
//     if (origErr) {
//         console.error(`error: ${JSON.stringify(origErr)}`)
//     }

//     constructorioNew.getItem({
//         section: 'Products',
//         num_results_per_page: 100
//     }, (newErr, newResp) => {
//         let origItems = _.uniqBy(origResp.items, 'id')

//         console.log(`Items in original index: ${origItems.length}`)
//         console.log(`Items in new index: ${newResp.total_count}`)

//         let diffItems = _.differenceBy(origResp.items, newResp.items, 'name')
//         // console.log(`Differing items: ${JSON.stringify(diffItems)}`)
//         console.log(`Differing items: ${diffItems.length}`)
//     })
// })