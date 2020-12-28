const { appModule, statusCodes } = require('./_utils');

module.exports = loadUser;

async function loadUser(req, res, next) {
  const db = appModule.get('store');
  const username = req.params.username;
  const user = await db.findByUsername(username);

  if (!user) {
    res.status(statusCodes.notFound).json({});
    return;
  } else {
    req.user = user;
    next();
  }
}
