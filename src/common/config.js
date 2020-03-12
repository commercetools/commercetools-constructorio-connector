const nconf = require('nconf');

nconf
  .argv()
  .env()
  .file('envjson', `config/${process.env.NODE_ENV || 'development'}.json`)
  .file('config/default.json');
module.exports = nconf;
