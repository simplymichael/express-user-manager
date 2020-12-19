const fs = require('fs');
const path = require('path');
const adapters = {};
const driverFiles = fs.readdirSync(`${__dirname}`);

for(let i = 0, len = driverFiles.length; i < len; i++) {
  const filename = path.basename(driverFiles[i], '.js');

  // don't iclude this index.js file
  if(filename === 'index') {
    continue;
  }

  adapters[filename] = require(`./${filename}`);
}

module.exports = {
  getAdapter(key) {
    return adapters[key] || null;
  },
};
