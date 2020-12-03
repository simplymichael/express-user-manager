const fs = require('fs');
const path = require('path');
const drivers = {};
const driverFiles = fs.readdirSync(`${__dirname}`);

for(let i = 0, len = driverFiles.length; i < len; i++) {
  const filename = path.basename(driverFiles[i], '.js');
  const baseFilename = path.basename(filename);

  // don't iclude this index.js file or the db-interface.js file
  if(baseFilename === 'index' || baseFilename === 'db-interface') {
    continue;
  }

  drivers[filename] = require(`./${filename}`);
}

module.exports = {
  getDriver(key) {
    return drivers[key];
  },
};
