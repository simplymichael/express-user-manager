const fs = require('fs');
const path = require('path');
const router = {};
const apiDir = __dirname;
const apiRouteFiles = fs.readdirSync(apiDir);

for(let i = 0, len = apiRouteFiles.length; i < len; i++) {
  const currFile = apiRouteFiles[i];

  // Ignore directories
  if(fs.statSync(`${apiDir}/${currFile}`).isDirectory()) {
    continue;
  }

  const fileName = path.basename(apiRouteFiles[i], '.js');
  const routeKey = fileName;

  if(fileName === 'api-v1') {
    continue;
  }

  router[routeKey] = require(`./${fileName}`);
}

module.exports = router;
