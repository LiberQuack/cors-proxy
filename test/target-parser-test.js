let expect = require('chai').expect,
    targetParser = require('../app/target-parser');

describe('Target Parser', _ => {

    it('Should not start without host argument', done => {
        expect(_ => targetParser.parseArguments(['/bin/node', 'index.js'])).to.throw();
        done();
    });

    it('Should retrieve host argument', done => {
        expect(targetParser.parseArguments(['/bin/node', 'index.js', '10.204.2.104:8080'])).to.be.equal('10.204.2.104:8080');
        done();
    });

});