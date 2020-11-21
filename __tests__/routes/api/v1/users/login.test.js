const chai = require('chai');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { apiUrl, server } = require('../../../../_server');
const { should } = chai;
const userData = testUsers[0];
const loginRoute = `${apiUrl}/users/login`;
const forbiddedPasswords = ['Passw0rd', 'Password123'];

should();
chai.use(chaiHttp);

describe(`User Login: POST ${loginRoute}`, async () => {
  let clonedUser = { ...userData };

  it('should return a 400 status code if login field is missing', (done) => {
    let clonedUser = { ...userData };

    chai.request(server)
      .post(loginRoute)
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
      .post(loginRoute)
      .send(clonedUser)
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
      .send(clonedUser)
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
      .send(clonedUser)
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
      .send(clonedUser)
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
      .send(clonedUser)
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
      .send(clonedUser)
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
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });
});
