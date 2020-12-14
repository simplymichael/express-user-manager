const { emit, statusCodes, publicFields } = require('./_utils');
let responseData;

module.exports = getUser;

/* GET user data */
async function getUser(req, res) {
  const user = {};

  // Populate the user variable with values we want to return to the client
  // req.user comes from the loadUser middleware
  publicFields.forEach(key => {
    user[key] = req.user[key];
  });

  responseData = {
    data: { user }
  };

  emit('getUserSuccess', responseData);
  res.status(statusCodes.ok).json(responseData);
}
