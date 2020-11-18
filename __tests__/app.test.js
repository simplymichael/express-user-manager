const chai = require('chai');
const { should } = chai;
const chaiHttp = require('chai-http');
const server = require('./_server');

should();
chai.use(chaiHttp);

describe('app', () => {
  describe('GET /', () => {
    it('should return a 200 status code', (done) => {
      chai.request(server)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          done();
      });
    });
  });
});
