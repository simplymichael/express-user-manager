const chai = require('chai');
const chaiHttp = require('chai-http');
const testUsers = require('./_test-users.json');
const { server } = require('../../../../_server');
const { should } = chai;

should();
chai.use(chaiHttp);

describe('Fetch Users', () => {
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
