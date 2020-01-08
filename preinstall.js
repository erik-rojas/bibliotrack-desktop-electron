const sys = require('util');
const exec = require('child_process').exec;

function puts(error, stdout) { sys.puts(stdout); }

const os = require('os');

if (os.type() === 'Windows_NT') {
  // exec('npm install --global --production windows-build-tools --add-python-to-path', puts);
}
