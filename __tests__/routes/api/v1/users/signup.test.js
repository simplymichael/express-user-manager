const chai = require('chai');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { server } = require('../../../../_server');
const { should } = chai;
const userData = testUsers[0];

should();
chai.use(chaiHttp);

describe('User Registration: POST /api/v1/users', () => {
  it('should return a 400 status code if firstname is missing', (done) => {
    let clonedUser = { ...userData };
    delete clonedUser.firstname;

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if lastname is missing', (done) => {
    let clonedUser = { ...userData };
    delete clonedUser.lastname;

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if username is missing', (done) => {
    let clonedUser = { ...userData };
    delete clonedUser.username;

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if email is missing', (done) => {
    let clonedUser = { ...userData };
    delete clonedUser.email;

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password is missing', (done) => {
    let clonedUser = { ...userData };
    delete clonedUser.password;

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should return a 400 status code if password and password confirm don\'t match', (done) => {
    let clonedUser = { ...userData };
    clonedUser.confirmPassword = 'secret';

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });

  it('should create user and return success data if all values are valid', (done) => {
    let clonedUser = { ...userData };

    chai.request(server)
      .post('/api/v1/users')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('user');
        done();
    });
  });
});
