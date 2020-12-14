const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { apiUrl, apiPort, server, customRoutes } = require('./_server');
const { should } = chai;
const usersRoute = `${apiUrl}${customRoutes.list}`;

should();
chai.use(chaiHttp);

describe(`Fetch Users: ${usersRoute}`, () => {
  beforeEach(async () => {
    const signupRoute = `${apiUrl}${customRoutes.signup}`;
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

  it('should return every registered user', (done) => {
    chai.request(server)
      .get(usersRoute)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.should.have.lengthOf(testUsers.length);

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

        done();
    });
  });
});
