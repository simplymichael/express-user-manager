const chai = require('chai');
const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { apiUrl, apiPort, server } = require('../../../../_server');
const searchRoute = `${apiUrl}/users/search`;
const { should } = chai;

should();
chai.use(chaiHttp);

describe(`Search Users: POST ${searchRoute}`, () => {
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

  it('should return a 400 status code if the "query" parameter is missing', (done) => {
    chai.request(server)
      .get(searchRoute)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return matching success data if "query" parameter is supplied', (done) => {
    chai.request(server)
      .get(`${searchRoute}?query=Lanister`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(2); // total count of users matching search query
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(2); // total count of returned users (dictated by page and/or limit)
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        done();
    });
  });

  it('should return a maximum of LIMIT users when "limit" is specified', (done) => {
    chai.request(server)
      .get(`${searchRoute}?query=Lanister&limit=1`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(2);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(1);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        done();
    });
  });
});
