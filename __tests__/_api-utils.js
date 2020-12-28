const chai = require('chai');

module.exports = {
  deleteApiTestUser,
};

function deleteApiTestUser(user, serverUrl, loginRoute, deleteRoute) {
  const agent = chai.request.agent(serverUrl);

  return agent
    .post(loginRoute)
    .send({ login: user.email, password: user.password })
    .then(function (res) {
      const { token, expiresIn } = res.body.data.authorization;

      return agent
        .delete(deleteRoute)
        .set('Authorization', token)
        .send({ userId: user.id })
        .then(function (res) {
          agent.close();
          return res.body;
        });
    });
}
