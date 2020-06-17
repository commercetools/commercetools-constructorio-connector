const _ = require('lodash');
const fs = require('fs-extra')

_.nmap = (coll, iter) => _.filter(_.map(coll, iter), x => x);
_.ff = (coll, filter) => _.first(_.filter(coll, filter));

module.exports = {
    file: {
        getSubdirectories: dir => _.map(_.filter(fs.readdirSync(dir, { withFileTypes: true }), dir => dir.isDirectory()), e => `${dir}/${e.name}`)
    },

    time: async (op, fn) => {
        let start = new Date()
        let obj = await fn()
        logger.debug(`[ ${op} ] ${new Date() - start}`)
        return obj
    }    
}