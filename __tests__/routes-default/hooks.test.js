const chai = require('chai');
const spies = require('chai-spies');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const hooks = require('../../src/utils/hooks');
const { deleteApiTestUser } = require('../_api-utils');
const testUsers = require('./_test-users.json');
const { apiUrl, apiPort, server, userModule } = require('./_server');
const { should } = chai;
const usersRoute = `${apiUrl}/users`;
const appName = 'express-user-manager';

should();
chai.use(spies);
chai.use(chaiHttp);

describe.only(`API Hooks`, () => {
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

  /*describe('Global hooks: add hooks to every route', () => {
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

    beforeEach(async () => {
      const userData = testUsers[0];
      const signupRoute = `${apiUrl}/users`;
      server.listen(apiPort); // Get the server running and listening on port

      await fetch(`http://localhost:${apiPort}${signupRoute}`, {
        method: 'post',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it(`should add the hook to users list route: ${usersRoute}`, (done) => {

      chai.request(server)
        .get(usersRoute)
        .end((err, res) => { console.log('RESPONSE IS: ', res.body)
          res.should.have.status(200);
          res.should.have.property('body');
          res.body.should.be.an('object');
          res.body.should.have.property('injected');
          res.body.injected.should.be.an('object');
          res.body.injected.should.have.property('data');
          res.body.injected.data.should.be.an('object');
          res.body.injected.data.should.have.property(
            'message', 'This is a global hook');

          done();
      });
    });
  });*/

  describe(`Get user: GET ${usersRoute}/user/:username`, () => {
    let user = null;

    beforeEach(async () => {
      const userData = testUsers[0];
      const signupRoute = `${apiUrl}/users`;
      server.listen(apiPort); // Get the server running and listening on port

      const createData = await fetch(`http://localhost:${apiPort}${signupRoute}`, {
        method: 'post',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });

      const jsonResult = await createData.json();

      user = jsonResult.data.user;
    });

    afterEach(async () => {
      const deleteRoute = `${apiUrl}/users/user/${user.id}`;
      const userToLogin = { ...user, password: testUsers[0].password };

      await deleteApiTestUser(userToLogin, server, `${apiUrl}/users/login`, deleteRoute);

      user = null;
    });

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
        .get(`${usersRoute}/user/${username}`)
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
