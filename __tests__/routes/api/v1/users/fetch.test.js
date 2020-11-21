const chai = require('chai');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { apiUrl, server } = require('../../../../_server');
const { should } = chai;
const usersRoute = `${apiUrl}/users`;

should();
chai.use(chaiHttp);

describe('Fetch Users', () => {
  describe('GET /', () => {
    it('should return a 200 status code', (done) => {
      chai.request(server)
        .get(usersRoute)
        .end((err, res) => {
          res.should.have.status(200);
          done();
      });
    });
  });
});
