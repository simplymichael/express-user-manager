const { emit, appModule, statusCodes, publicFields } = require('./_utils');
const errorName = 'updateUserError';
let responseData;

module.exports = updateUser;

/* Update user */
async function updateUser(req, res) {
  const store = appModule.get('store');
  const { id } = req.body;
  let { firstname, lastname, username, email } = req.body;

  firstname = (typeof firstname === 'string' ? firstname : '').trim();
  lastname = (typeof lastname === 'string' ? lastname : '').trim();
  username = (typeof username === 'string' ? username : '').trim();
  email = (typeof email === 'string' ? email : '').trim();

  if(firstname.length === 0) {
    responseData = {
      errors: [{
        msg: 'The firstname field cannot be empty.',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  if(lastname.length === 0) {
    responseData = {
      errors: [{
        msg: 'The lastname field cannot be empty.',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  if(username.length === 0) {
    responseData = {
      errors: [{
        msg: 'The username field cannot be empty.',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  if(email.length === 0) {
    responseData = {
      errors: [{
        msg: 'The email field cannot be empty.',
      }]
    };


    emit(errorName, responseData);
    res.status(statusCodes.badRequest).json(responseData);
    return;
  }

  const userData = await store.findById(id);

  if(!userData) {
    responseData = {
      errors: [{
        msg: 'User not found.',
      }]
    };

    emit(errorName, responseData);
    res.status(statusCodes.notFound).json(responseData);
    return;
  }

  await store.updateUser(id, {
    firstname,
    lastname,
    username,
    email
  });

  const user = {};
  const updatedUser = await store.findById(id);

  // Populate the post variable with values we want to return to the client
  publicFields.forEach(key => user[key] = updatedUser[key]);

  responseData = {
    data: { user }
  };

  emit('updateUserSuccess', responseData);
  res.status(statusCodes.ok).json(responseData);
  return;
}
