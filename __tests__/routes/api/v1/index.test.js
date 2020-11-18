const chai = require('chai');
const { should } = chai;
const chaiHttp = require('chai-http');
const server = require('../../../_server');

should();
chai.use(chaiHttp);

describe('/api/v1', () => {
  describe('GET /', () => {
    it('should return a 403 status code and message Forbidden', (done) => {
      chai.request(server)
        .get('/api/v1')
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property('message').equal('Forbidden');
          done();
      });
    });
  });
});
