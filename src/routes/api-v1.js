const fs = require('fs');
const path = require('path');
const router = {};
const apiDir = `${__dirname}/api/v1`;
const apiRouteFiles = fs.readdirSync(apiDir);

for(let i = 0, len = apiRouteFiles.length; i < len; i++) {
  const currFile = apiRouteFiles[i];

  // Ignore directories
  if(fs.statSync(`${apiDir}/${currFile}`).isDirectory()) {
    continue;
  }

  const fileName = path.basename(apiRouteFiles[i], '.js');
  const routeKey = fileName;

  router[routeKey] = require(`./api/v1/${fileName}`);
}

module.exports = router;
