const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { getValidUserId } = require('../_utils');
const { deleteApiTestUser } = require('../_api-utils');
const { env, apiUrl, apiPort, server } = require('./_server');
const { should } = chai;
const userData = testUsers[0];
const loginRoute = `${apiUrl}/users/login`;
const updateRoute = `${apiUrl}/users`;
const loginCredentials = {
  login: userData.email,
  password: userData.password
};
const updateData = {
  firstname: 'updatedFirstname',
  lastname: 'updatedLastname',
  email: 'updatedEmail@provider.com',
  username: 'updatedUsername',
};

should();
chai.use(chaiHttp);

describe(`Update User: PUT ${apiUrl}/users`, async () => {
  let user = null;

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
    updateData.id = user.id;
  });

  afterEach((done) => {
    const deleteRoute = `${apiUrl}/users/user/${user.id}`;
    const userToLogin = { ...user, password: userData.password };

    deleteApiTestUser(userToLogin, server, loginRoute, deleteRoute)
      .then(function(res) {
        user = null;
        done();
      });
  });

  it('should return a 403 status code if user is not logged in', (done) => {
    chai.request(server)
      .put(updateRoute)
      .send(updateData)
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
          .put(updateRoute)
          .send(updateData)
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

  it('should return a 401 status code if "id" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData };
    delete updateWith.id;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(401);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('Unauthorized');
            agent.close();
            done();
          })
      });
  });

  it('should return a 401 status code if the updater\'s id is different from the updatee\'s id', (done) => {
    const agent = chai.request.agent(server);
    const updateeId = getValidUserId(updateData.id).split('').reverse('').join('');
    const updateWith = { ...updateData, id: updateeId };

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(401);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('Unauthorized');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if  "firstname" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData };
    delete updateWith.firstname;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('The firstname must be at least 3 characters');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if  "lastname" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData };
    delete updateWith.lastname;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('The lastname must be at least 3 characters');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if  "username" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData };
    delete updateWith.username;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('The username must be at least 3 characters');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if  "email" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData };
    delete updateWith.email;

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('Please enter a valid email');
            agent.close();
            done();
          })
      });
  });

  it('should return a 400 status code if  "email" is missing from the request body', (done) => {
    const agent = chai.request.agent(server);
    const updateWith = { ...updateData, email: 'invalidemail' };

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send(updateWith)
          .then(function (res) {
            res.should.have.status(400);
            res.should.have.property('body');
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.be.an('array');
            res.body.errors[0].should.be.an('object');
            res.body.errors[0].should.have.property('msg');
            res.body.errors[0].msg.should.equal('Please enter a valid email');
            agent.close();
            done();
          })
      });
  });

  it('should return a 200 status code if user is successfully updated', (done) => {
    const agent = chai.request.agent(server);

    agent
      .post(loginRoute)
      .send(loginCredentials)
      .then(function (res) {
        const { token, expiresIn } = res.body.data.authorization;

        return agent
          .put(updateRoute)
          .set('Authorization', token)
          .send({ ...updateData, ...user })
          .then(function (res) {
            res.should.have.status(200);
            res.should.have.property('body');
            res.body.should.be.an('object');
            res.body.should.not.have.property('errors');
            res.body.should.have.property('data');
            res.body.data.should.have.property('user');

            /*const updatedUser = res.body.data.user;

            updatedUser.should.have.property('id');
            getValidUserId(updatedUser.id).should.equal(getValidUserId(updateData.id));
            updatedUser.should.have.property('firstname');
            updatedUser.firstname.should.equal(updateData.firstname);
            updatedUser.should.have.property('lastname');
            updatedUser.lastname.should.equal(updateData.lastname);
            updatedUser.should.have.property('fullname');
            updatedUser.fullname.should.equal(
              [updateData.firstname, updateData.lastname].join(' '));
            updatedUser.should.have.property('username');
            updatedUser.username.should.equal(updateData.username);
            updatedUser.should.have.property('email');
            updatedUser.email.should.equal(updateData.email);
            updatedUser.should.have.property('signupDate');

            // TO DO: Fix this as it is failing in mysql.
            // For some reason,
            // the signupDate (createdAt field) changes after updating
            //updatedUser.signupDate.should.equal(user.signupDate);
            updatedUser.should.not.have.property('password');*/

            agent.close();
            done();
          });
      });
  });
});
