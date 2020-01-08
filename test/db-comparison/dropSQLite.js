const util = require('util');
const exec = util.promisify(require('child_process').exec);

const config = require('./config.json');

const run = () => {
  return exec('rimraf ' + config.sqlite.database)
    .then(() => console.log('SQLite database removed.'));
};

run();
