const nconf = require('nconf');
const fs = require('fs-extra');

if (fs.existsSync(`${__basedir}/config/vault.json`)) {
  process.env['CT_VAULT_CONFIG'] = `${__basedir}/config/vault.json` 
}

nconf
  .argv()
  .env()
  .file('localjson', `config/local.json`)
  .file('envjson', `config/${process.env.NODE_ENV || 'development'}.json`)
  .file('config/default.json');
module.exports = nconf;
