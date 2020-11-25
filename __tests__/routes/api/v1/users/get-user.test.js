const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { apiUrl, apiPort, server } = require('../../../../_server');
const { expect, should } = chai;
const usersRoute = `${apiUrl}/users`;

should();
chai.use(chaiHttp);

describe(`Get User Details: GET ${usersRoute}/user/:username`, () => {
  beforeEach(async () => {
    const signupRoute = `${apiUrl}/users`;
    server.listen(apiPort); // Get the server running and listening on port

    // First populate the users table
    for(let userData of testUsers) {
      await fetch(`http://localhost:${apiPort}${signupRoute}`, {
        method: 'post',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  it('should return a 404 "Not Found" status code if user does not exist', (done) => {
    const username = 'nonExistent';

    chai.request(server)
      .get(`${usersRoute}/user/${username}`)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a('object');
        res.body.should.be.empty;
        done();
    });
  });

  it('should get a user by username', (done) => {
    let count = 0;
    let doneCalled = false;

    for(let user of testUsers) {
      count++;
      const username = user.username;

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

          if(count === testUsers.length && !doneCalled) {
            doneCalled = true;
            done();
          }
      });
    }
  });
});
