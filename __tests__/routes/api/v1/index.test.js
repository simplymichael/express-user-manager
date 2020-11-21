const chai = require('chai');
const { should } = chai;
const chaiHttp = require('chai-http');
const { apiUrl, server } = require('../../../_server');

should();
chai.use(chaiHttp);

describe(`GET ${apiUrl}`, () => {
  it('should return a 403 status code and message Forbidden', (done) => {
    chai.request(server)
      .get(apiUrl)
      .end((err, res) => {
        res.should.have.status(403);
        res.body.should.have.property('message').equal('Forbidden');
        done();
    });
  });
});
