const chai = require('chai');
const { should } = chai;
const chaiHttp = require('chai-http');
const server = require('../../../_server');
const fetch = require('node-fetch');
const env = require('../../../../src/dotenv');
const port = env.PORT;

should();
chai.use(chaiHttp);

const userData = {
  firstname: 'Test',
  lastname: 'User',
  email: 'testuser@yahoo.com',
  username: 'testuser',
  password: '123sEcrEt',
  confirmPassword: '123sEcrEt',
};

describe('/api/v1/users', () => {
  describe('POST /', () => {
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

  describe('POST /login', async () => {
    let clonedUser = { ...userData };

    await fetch(`http://localhost:${port}/api/v1/users/login`, {
      method: 'post',
      body: JSON.stringify(clonedUser)
    });

    it('should return a 400 status code if login field is missing', (done) => {
      let clonedUser = { ...userData };

      chai.request(server)
        .post('/api/v1/users/login')
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
  });

  describe('GET /', () => {
    it('should return a 200 status code', (done) => {
      chai.request(server)
        .get('/api/v1/users')
        .end((err, res) => {
          res.should.have.status(200);
          done();
      });
    });
  });
});
