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

  it('should return get users case-insensitively', (done) => {
    chai.request(server)
      .get(`${usersRoute}?lastname=lanister`)
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
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return a maximum of LIMIT users when "limit" is specified', (done) => {
    const LIMIT = 1;
    chai.request(server)
      .get(`${usersRoute}?limit=${LIMIT}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(testUsers.length);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(LIMIT);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return no results if get by non-existent firstname', (done) => {
    chai.request(server)
      .get(`${usersRoute}?firstname=Lanister`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(0);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(0);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return matching success data if get by existing firstname', (done) => {
    chai.request(server)
      .get(`${usersRoute}?firstname=Jamie`)
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
        done();
    });
  });

  it('should return no results if get by non-existent lastname', (done) => {
    chai.request(server)
      .get(`${usersRoute}?lastname=Jamie`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(0);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(0);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return matching success data if get by existing lastname', (done) => {
    chai.request(server)
      .get(`${usersRoute}?lastname=Lanister`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(2);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(2);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return matching success data if get by first and last names, at least one matching', (done) => {
    chai.request(server)
      .get(`${usersRoute}?firstname=bibi&lastname=Lanister`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(2);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(2);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });

  it('should return no results if get by first and last names, none matching', (done) => {
    chai.request(server)
      .get(`${usersRoute}?firstname=Johnson&lastname=Bibi`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('total');
        res.body.data.total.should.equal(0);
        res.body.data.should.have.property('length');
        res.body.data.length.should.equal(0);
        res.body.data.should.have.property('users');
        res.body.data.users.should.be.a('array');
        res.body.data.users.length.should.equal(res.body.data.length);
        done();
    });
  });
});
