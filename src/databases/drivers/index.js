const fs = require('fs');
const path = require('path');
const drivers = {};
const driverFiles = fs.readdirSync(`${__dirname}`);

for(let i = 0, len = driverFiles.length; i < len; i++) {
  const filename = path.basename(driverFiles[i], '.js');

  if(path.basename(filename) === 'index') { // don't iclude this index.js file
    continue;
  }

  drivers[filename] = require(`./${filename}`);
}

module.exports = {
  getDriver(key) {
    return drivers[key];
  },
};
