const fs = require('fs');
const path = require('path');
const router = {};
const apiRouteFiles = fs.readdirSync(`${__dirname}/api/v1`);

for(let i = 0, len = apiRouteFiles.length; i < len; i++) {
  const fileName = path.basename(apiRouteFiles[i], '.js');
  const routeKey = fileName;

  router[routeKey] = require(`./api/v1/${fileName}`);
}

module.exports = router;
