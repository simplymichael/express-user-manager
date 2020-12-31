const chai = require('chai');
const spies = require('chai-spies');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const hooks = require('../../src/utils/hooks');
const { deleteApiTestUser } = require('../_api-utils');
const { getValidUserId } = require('../_utils');
const testUsers = require('./_test-users.json');
const {
  env,
  apiUrl,
  apiPort,
  server,
  userModule,
  customRoutes
} = require('./_server');
const { should } = chai;
const usersRoute = `${apiUrl}${customRoutes.list}`;
const signupRoute = `${apiUrl}${customRoutes.signup}`;
const loginRoute = `${apiUrl}${customRoutes.login}`;
const userDataRoute = `${apiUrl}${customRoutes.getUser}`;
const searchRoute = `${apiUrl}${customRoutes.search}`;
const updateRoute = `${apiUrl}${customRoutes.updateUser}`;
const deleteRoute = `${apiUrl}${customRoutes.deleteUser}`;
const logoutRoute = `${apiUrl}${customRoutes.logout}`;
const appName = 'express-user-manager';
const testUserData = testUsers[0];
const loginCredentials = {
  login: testUserData.email,
  password: testUserData.password
};

should();
chai.use(spies);
chai.use(chaiHttp);

function assertGlobalHook(res) {
  res.body.should.have.property('injected');
  res.body.injected.should.be.an('object');
  res.body.injected.should.have.property('data');
  res.body.injected.data.should.be.an('object');
  res.body.injected.data.should.have.property(
    'message', 'This is a global hook');
}

describe(`Custom API routes Hooks`, () => {
  let user = null;
  let createdUsers = [];

  beforeEach(async () => {
    server.listen(apiPort); // Get the server running and listening on port

    const createData = await fetch(`http://localhost:${apiPort}${signupRoute}`, {
      method: 'post',
      body: JSON.stringify(testUserData),
      headers: { 'Content-Type': 'application/json' },
    });

    const jsonResult = await createData.json();

    user = jsonResult.data.user;

    createdUsers.push(user);
  });

  afterEach(async () => {
    if(user && user.id) {
      const delRoute = `${deleteRoute}/${user.id}`;
      const userToLogin = { ...user, password: testUsers[0].password };

      await deleteApiTestUser(userToLogin, server, `${loginRoute}`, delRoute);
    }

    user = null;
    createdUsers = [];
  });

  it('should throw an error if an invalid target is specified for a request hook', () => {
    const target = '/fun';

    try {
      userModule.addRequestHook(target, (req, res, next) => {
        req.params.agent = 'CLI';
      });
    } catch(err) {
      (typeof err).should.equal('object');
      err.should.match(new RegExp(
        `${appName}::addRequestHook: invalid hook target "${target}"`));
    }
  });

  it('should throw an error if an invalid target is specified for a response hook', () => {
    const target = '/fun';

    try {
      userModule.addResponseHook(target, (req, res, next) => {
        res.body.data.user.role = 'user';
      });
    } catch(err) {
      (typeof err).should.equal('object');
      err.should.match(new RegExp(
        `${appName}::addResponseHook: invalid hook target "${target}"`));
    }
  });

  describe('Global hooks: add hooks to every route', () => {
    before(() => {
      userModule.addRequestHook('*', (req, res, next) => {
        req.injected = {
          data: {
            message: 'This is a global hook',
          }
        };

        next();
      });

      userModule.addResponseHook('*', (req, res, next) => {
        res.body.injected = req.injected;
      });
    });

    after(() => {
      userModule.removeRequestHook('*');
      userModule.removeResponseHook('*');
    });

    it(`should add the hooks to the signup route POST ${signupRoute}`, (done) => {
      let clonedUser = { ...testUsers[1] };

      chai.request(server)
        .post(signupRoute)
        .send(clonedUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('user');

          const user = res.body.data.user;

          user.should.have.property('id');
          user.should.have.property('firstname', clonedUser.firstname);
          user.should.have.property('lastname', clonedUser.lastname);
          user.should.have.property('fullname',
            [clonedUser.firstname, clonedUser.lastname].join(' '));
          user.should.have.property('username', clonedUser.username);
          user.should.have.property('email', clonedUser.email);
          user.should.have.property('signupDate')
          user.should.not.have.property('password');

          assertGlobalHook(res);

          done();
      });
    });

    it(`should add the hooks to the login route POST ${loginRoute}`, (done) => {
      chai.request(server)
        .post(loginRoute)
        .send({ login: user.email, password: testUserData.password })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('user');
          res.body.data.should.have.property('authorization');

          for(let [key, value] of Object.entries(testUserData)) {
            if(key === 'password' || key === 'confirmPassword') {
              continue;
            }

            res.body.data.user.should.have.property(key, value);
          }

          res.body.data.authorization.should.have.property('token');
          res.body.data.authorization.token.should.be.a('string');
          res.body.data.authorization.token.should.satisfy(
            msg => msg.startsWith('Bearer '));
          res.body.data.authorization.should.have.property('expiresIn');
          res.body.data.authorization.expiresIn.should.be.a('string').and.satisfy(
            msg => msg === eval(env.AUTH_TOKEN_EXPIRY) + 's');

          assertGlobalHook(res);

          done();
      });
    });

    it(`should add the hooks to the users listing route GET ${usersRoute}`, (done) => {
      chai.request(server)
        .get(usersRoute)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('total');
          res.body.data.total.should.equal(createdUsers.length);
          res.body.data.should.have.property('length');
          res.body.data.length.should.equal(createdUsers.length);
          res.body.data.should.have.property('users');
          res.body.data.users.should.be.a('array');
          res.body.data.users.should.have.lengthOf(createdUsers.length);

          res.body.data.users.forEach(user => {
            user.should.have.property('id');
            user.should.have.property('firstname');
            user.should.have.property('lastname');
            user.should.have.property('username');
            user.should.have.property('email');
            user.should.have.property('fullname');
            user.should.have.property('signupDate');
            user.should.not.have.property('password');
          });

          assertGlobalHook(res);

          done();
      });
    });

    it(`should add the hooks to user details retrieval route: GET ${userDataRoute}/:username`, (done) => {
      const username = user.username;
      const userRole = 'user';

      chai.request(server)
        .get(`${userDataRoute}/${username}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('user');
          res.body.data.user.should.have.property('id');
          res.body.data.user.should.have.property('signupDate');
          res.body.data.user.should.have.property('firstname', user.firstname);
          res.body.data.user.should.have.property('lastname', user.lastname);
          res.body.data.user.should.have.property('username', user.username);
          res.body.data.user.should.have.property('email', user.email);
          res.body.data.user.should.have.property(
            'fullname', `${user.firstname} ${user.lastname}`);
          res.body.data.user.should.not.have.property('password');

          assertGlobalHook(res);

          done();
      });
    });

    it(`should add the hooks to the search route GET ${searchRoute}`, (done) => {
      chai.request(server)
        .get(`${searchRoute}?query=${testUserData.firstname}&by=firstname`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('total');
          res.body.data.total.should.equal(1);
          res.body.data.should.have.property('length');
          res.body.data.length.should.equal(1);
          res.body.data.should.have.property('users');
          res.body.data.users.should.be.a('array');
          res.body.data.users.length.should.equal(res.body.data.length);

          assertGlobalHook(res);
          done();
      });
    });

    it(`should add the hooks to the user data update route PUT ${updateRoute}`, (done) => {
      const agent = chai.request.agent(server);
      const updateData = {
        id: user.id,
        firstname: 'updatedFirstname',
        lastname: 'updatedLastname',
        email: 'updatedEmail@provider.com',
        username: 'updatedUsername',
      };

      agent
        .post(loginRoute)
        .send(loginCredentials)
        .then(function (res) {
          const { token, expiresIn } = res.body.data.authorization;

          return agent
            .put(updateRoute)
            .set('Authorization', token)
            .send(updateData)
            .then(function (res) {
              res.should.have.status(200);
              res.should.have.property('body');
              res.body.should.be.an('object');
              res.body.should.not.have.property('errors');
              res.body.should.have.property('data');
              res.body.data.should.have.property('user');

              const updatedUser = res.body.data.user;

              updatedUser.should.have.property('id');
              getValidUserId(updatedUser.id).should.equal(getValidUserId(updateData.id));
              updatedUser.should.have.property('firstname', updateData.firstname);
              updatedUser.should.have.property('lastname', updateData.lastname);
              updatedUser.should.have.property('fullname',
                [updateData.firstname, updateData.lastname].join(' '));
              updatedUser.should.have.property('username', updateData.username);
              updatedUser.should.have.property('email', updateData.email);
              updatedUser.should.have.property('signupDate');
              updatedUser.should.not.have.property('password');

              assertGlobalHook(res);

              // Update back to the original user data
              // so that we can successfully delete them in the afterEach hook
              return agent
                .put(updateRoute)
                .set('Authorization', token)
                .send(user)
                .then(function (res) {
                  res.should.have.status(200);
                  res.should.have.property('body');
                  res.body.should.be.an('object');
                  res.body.should.not.have.property('errors');
                  res.body.should.have.property('data');
                  res.body.data.should.have.property('user');

                  const newUser = res.body.data.user;

                  newUser.should.have.property('id');
                  getValidUserId(newUser.id).should.equal(getValidUserId(user.id));
                  newUser.should.have.property('firstname', user.firstname);
                  newUser.should.have.property('lastname', user.lastname);
                  newUser.should.have.property('fullname',
                    [user.firstname, user.lastname].join(' '));
                  newUser.should.have.property('username', user.username);
                  newUser.should.have.property('email', user.email);
                  newUser.should.have.property('signupDate');
                  newUser.should.not.have.property('password');

                  assertGlobalHook(res);

                  agent.close();
                  done();
                });
            });
        });
    });

    it(`should add the hooks to the user delete route DELETE ${deleteRoute}/:id`, (done) => {
      const agent = chai.request.agent(server);

      agent
        .post(loginRoute)
        .send(loginCredentials)
        .then(function (res) {
          const { token, expiresIn } = res.body.data.authorization;

          return agent
            .delete(`${deleteRoute}/${user.id}`)
            .set('Authorization', token)
            .send({ userId: user.id })
            .then(function (res) {
              res.should.have.status(200);
              res.should.have.property('body');
              res.body.should.be.an('object');
              res.body.should.not.have.property('errors');

              assertGlobalHook(res);

              return agent
                .get(`${userDataRoute}/${user.username}`)
                .send()
                .then(function(res) {
                  res.should.have.status(404);

                  // So that we can test,
                  // and not attempt the afterEach hook deleteTestUser() call
                  user = null;
                  agent.close();
                  done();
                });
            });
        });
    });

    it(`should add the hooks to the logout route GET ${logoutRoute}`, (done) => {
      const agent = chai.request.agent(server);

      agent
        .post(loginRoute)
        .send(loginCredentials)
        .then(function (res) {
          const { token, expiresIn } = res.body.data.authorization;

          return agent
            .get(logoutRoute)
            .then(function(res) {
              assertGlobalHook(res);

              return agent
                .delete(`${deleteRoute}/${user.id}`)
                .set('Authorization', token)
                .send({ userId: user.id })
                .then(function (res) {
                  res.should.have.status(403);
                  res.should.have.property('body');
                  res.body.should.be.a('object');
                  res.body.should.have.property('errors');
                  res.body.errors.should.be.an('array');
                  res.body.errors[0].should.be.an('object');
                  res.body.errors[0].should.have.property('msg');
                  res.body.errors[0].msg.should.equal('Please log in first.');

                  agent.close();
                  done();
                });
            });
        });
    });

  });

  describe(`Get user: GET ${userDataRoute}/:username`, () => {
    specify('request hook should inject and response hook should add a "role" field with the injected role value to the user', (done) => {
      const username = user.username;
      const userRole = 'user';

      userModule.addRequestHook('getUser', (req, res, next) => {
        // Inject user role into the request,
        req.injected = {
          user: {
            role: userRole,
          },
        };

        // Call next() to hand-over execution to the next middleware
        next();
      });

      userModule.addResponseHook('getUser', (req, res) => {
        // Add a role to the user, from the data injected into the request
        res.body.data.user.role = req.injected.user.role;
      });

      chai.request(server)
        .get(`${userDataRoute}/${username}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('data');
          res.body.data.should.have.property('user');
          res.body.data.user.should.have.property('id');
          res.body.data.user.should.have.property('signupDate');
          res.body.data.user.should.have.property('firstname', user.firstname);
          res.body.data.user.should.have.property('lastname', user.lastname);
          res.body.data.user.should.have.property('username', user.username);
          res.body.data.user.should.have.property('email', user.email);
          res.body.data.user.should.have.property(
            'fullname', `${user.firstname} ${user.lastname}`);
          res.body.data.user.should.not.have.property('password');

          // check that the injected user role is present in the user's data
          res.body.data.user.should.have.property('role', userRole);

          done();
      });
    });
  });
});
