const _ = require('lodash')

let extensions = []

module.exports = {
    register: extension => {
        extension.handle = async (req, res, next) => {
            console.log(`extension ${extension.key} handle()`)
            let h = extension.triggers && extension.triggers[req.body.resource.typeId] && extension.triggers[req.body.resource.typeId][req.body.action]
            if (h) {
                res.status(200).json(await h(req, res, next))
            }
            else {
                next({ error: `Handler not found for ${req.body.resource.typeId} / ${req.body.action} under path ${req.path}` })
            }         
        }

        extensions.push(extension)
    },

    handle: async (req, res, next) => {
        console.log(`handle ${req.path}`)
        let extension = _.first(_.filter(extensions, 'path'), p => p === req.path)
        if (extension) {
            extension.handle(req, res, next)
        }
        else {
            next({ error: `Route not found: ${req.path}` })
        }
    }
}