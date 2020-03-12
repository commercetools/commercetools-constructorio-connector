const _ = require('lodash');
const fs = require('fs-extra')

_.nmap = (coll, iter) => _.filter(_.map(coll, iter), x => x);

module.exports = {
    file: {
        getSubdirectories: dir => _.filter(fs.readdirSync(dir, { withFileTypes: true }), dir => dir.isDirectory())
    }
}