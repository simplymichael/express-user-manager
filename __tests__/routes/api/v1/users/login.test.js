const chai = require('chai');
//const fetch = require('node-fetch');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { server } = require('../../../../_server');
const { should } = chai;
const userData = testUsers[0];

should();
chai.use(chaiHttp);

describe('User Login: POST /api/v1/users/login', async () => {
  let clonedUser = { ...userData };

  /*await fetch(`http://localhost:${port}/api/v1/users/login`, {
    method: 'post',
    body: JSON.stringify(clonedUser)
  });*/

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
      .post('/api/v1/users/login')
      .send(clonedUser)
      .end((err, res) => {
        res.should.have.status(400);
        done();
    });
  });
});
