const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { env, apiUrl, apiPort, server, customRoutes } = require('./_server');
const { should } = chai;
const userData = testUsers[0];
const loginRoute = `${apiUrl}${customRoutes.login}`;
const forbiddedPasswords = ['Passw0rd', 'Password123'];

should();
chai.use(chaiHttp);

describe(`User Login: POST ${loginRoute}`, async () => {
  let clonedUser = { ...userData };

  beforeEach(async () => {
    server.listen(apiPort); // Get the server running and listening on port
    const signupRoute = `${apiUrl}${customRoutes.signup}`;

    // First create a user
    //
    // For some reason,
    // chai.request(server).post(signupRoute)
    // does not play well in creating the user,
    // and then logging-in afterwards.
    // So, we use node-fetch instead.
    await fetch(`http://localhost:${apiPort}${signupRoute}`, {
      method: 'post',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('should return a 400 status code if login field is missing', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ password: userData.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if email is valid and password is missing', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if username is valid and password is missing', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.username })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password length is less than 6', (done) => {
    let clonedUser = { ...userData };
    clonedUser.password = 'h3Llo';

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password length is greater than 20', (done) => {
    let clonedUser = { ...userData };
    clonedUser.password = 'h3Llo';

    for(let i = 0; i < 5; i++) clonedUser.password += clonedUser.password;

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password does not contain a number', (done) => {
    let clonedUser = { ...userData };
    clonedUser.password = 'heLlios';

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password does not contain an uppercase character', (done) => {
    let clonedUser = { ...userData };
    clonedUser.password = 'h3llios';

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password does not contain a lowercase character', (done) => {
    let clonedUser = { ...userData };
    clonedUser.password = 'H3LLIOS';

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password is a common word', (done) => {
    let clonedUser = { ...userData };
    const fp = forbiddedPasswords;
    clonedUser.password = fp[Math.round(Math.random() * fp.length)];

    chai.request(server)
      .post(loginRoute)
      .send({ login: clonedUser.email, password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 404 status code if login field is not an existent email or username', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ login: 'somefunnyemail@yahoo.com', password: clonedUser.password })
      .end((err, res) => {
        res.should.have.status(404);
        done();
    });
  });

  it('should authenticate user with valid email and password', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ login: userData.email, password: userData.password })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('user');
        res.body.data.should.have.property('authorization');

        for(let [key, value] of Object.entries(clonedUser)) {
          if(key === 'password' || key === 'confirmPassword') {
            continue;
          }

          res.body.data.user.should.have.property(key);
          res.body.data.user[key].should.equal(value);
        }

        res.body.data.authorization.should.have.property('token');
        res.body.data.authorization.token.should.be.a('string');
        res.body.data.authorization.token.should.satisfy(
          msg => msg.startsWith('Bearer '));
        res.body.data.authorization.should.have.property('expiresIn');
        res.body.data.authorization.expiresIn.should.be.a('string').and.satisfy(
          msg => msg === eval(env.AUTH_TOKEN_EXPIRY) + 's');
        done();
    });
  });

  it('should authenticate user with valid username and password', (done) => {
    chai.request(server)
      .post(loginRoute)
      .send({ login: userData.username, password: userData.password })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('user');
        res.body.data.should.have.property('authorization');

        for(let [key, value] of Object.entries(clonedUser)) {
          if(key === 'password' || key === 'confirmPassword') {
            continue;
          }

          res.body.data.user.should.have.property(key);
          res.body.data.user[key].should.equal(value);
        }

        res.body.data.authorization.should.have.property('token');
        res.body.data.authorization.token.should.be.a('string');
        res.body.data.authorization.token.should.satisfy(
          msg => msg.startsWith('Bearer '));
        res.body.data.authorization.should.have.property('expiresIn');
        res.body.data.authorization.expiresIn.should.be.a('string').and.satisfy(
          msg => msg === eval(env.AUTH_TOKEN_EXPIRY) + 's');
        done();
    });
  });

  describe('Already Logged in User', () => {
    const loginCredentials = {
      login: userData.email,
      password: userData.password
    };

    it('should return a 403 status code if user is already signed in', (done) => {
      const agent = chai.request.agent(server);

      agent.post(loginRoute)
        .send(loginCredentials)
        .then(function (res) {
          return agent
            .post(loginRoute)
            .send(loginCredentials)
            .then(function (res) {
              res.should.have.status(403);
              done();
              agent.close();
            });
          });
    });
  });
});
