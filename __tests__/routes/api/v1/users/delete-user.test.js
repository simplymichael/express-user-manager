const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { env, apiUrl, apiPort, server } = require('../../../../_server');
const { should } = chai;
const userData = testUsers[0];
const loginRoute = `${apiUrl}/users/login`;
const loginCredentials = {
  login: userData.email,
  password: userData.password
};

should();
chai.use(chaiHttp);

describe(`Delete User: DELETE /api/users/user/:userId`, async () => {
  let user = null;
  let deleteRoute = `${apiUrl}/users/user/`;

  beforeEach(async () => {
    server.listen(apiPort); // Get the server running and listening on port
    const signupRoute = `${apiUrl}/users`;

    // First create a user
    //
    // For some reason,
    // chai.request(server).post(signupRoute)
    // does not play well in creating the user,
    // and then logging-in afterwards.
    // So, we use node-fetch instead.
    const createData = await fetch(`http://localhost:${apiPort}${signupRoute}`, {
      method: 'post',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    });

    jsonResult = await createData.json();
    user = jsonResult.data.user;
    deleteRoute += user.id;
  });

  afterEach((done) => {
    user = null;
    deleteRoute = `${apiUrl}/users/user/`;
    done();
  });

  it('should return a 403 status code if user is not logged in', (done) => {
    chai.request(server)
      .delete(deleteRoute)
      .send({ userId: user.id })
      .end((err, res) => {
        res.should.have.status(403);
        res.should.have.property('body');
        res.body.should.be.a('object');
        res.body.should.have.property('errors');
        res.body.errors.should.be.an('array');
        res.body.errors[0].should.be.an('object');
        res.body.errors[0].should.have.property('msg');
        res.body.errors[0].msg.should.equal('Please log in first.');
        done();
    });
  });

  it('should return a 401 status code if "authorization" header is missing', (done) => {
    const agent = chai.request.agent(server);

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        return agent
          .delete(deleteRoute)
          .send({ userId: user.id })
          .then(function (res) {
            res.should.have.status(401);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('Invalid access token!');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if "userId" in request url and request body do not match', (done) => {
    const agent = chai.request.agent(server);

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .delete(deleteRoute)
          .set('Authorization', token)
          .send({ userId: user.id.toString().split('').reverse().join('') })
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('The user id must be specified in the request url and request body!');
            agent.close();
            done();
          })
      });
  });

  it('should return a 404 status code if specified user by "userId" does not exist', (done) => {
    const agent = chai.request.agent(server);
    const reversedUserId = user.id.toString().split('').reverse().join('');
    deleteRoute = `${apiUrl}/users/user/${reversedUserId}`;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .delete(deleteRoute)
          .set('Authorization', token)
          .send({ userId: reversedUserId })
          .then(function (res) {
            res.should.have.status(404);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('User not found!');
            agent.close();
            done();
          })
      });
  });

  it('should return a 200 status code if user is successfully deleted', (done) => {
    const agent = chai.request.agent(server);

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .delete(deleteRoute)
          .set('Authorization', token)
          .send({ userId: user.id })
          .then(function (res) {
            res.should.have.status(200);
            res.should.have.property('body');
            res.body.should.be.an('object');
            res.body.should.not.have.property('errors');
            res.body.should.have.property('data');
            res.body.data.should.be.an('object');
            res.body.data.should.have.property('user');
            res.body.data.user.should.be.an('object');

            return agent
              .get(`${apiUrl}/users/user/${user.username}`)
              .send()
              .then(function(res) {
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.be.empty;
                agent.close();
                done();
              });
          });
      });
  });
});
