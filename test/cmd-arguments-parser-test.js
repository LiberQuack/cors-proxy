let expect = require('chai').expect,
    argumentsParser = require('../app/cmd-arguments-parser');

describe('Target Parser', _ => {

    it('Should not start without host argument', done => {
        expect(_ => argumentsParser.parseArguments(['/bin/node', 'index.js'])).to.throw();
        done();
    });

    it('Should retrieve host argument', done => {
        let args = argumentsParser.parseArguments(['/bin/node', 'index.js', '10.204.2.104:8080']);
        expect(args.targetHost).to.be.equal('10.204.2.104:8080');
        done();
    });

    it('Should set default proxy port', done => {
        let args = argumentsParser.parseArguments(['/bin/node', 'index.js', '10.204.2.104:8080']);
        expect(args.proxyPort).to.be.equal(8080);
        done();
    });

    it('Should retrieve proxyPort from arguments', done => {
        let args = argumentsParser.parseArguments(['/bin/node', 'index.js', '10.204.2.104:8080', '6795']);
        expect(args.proxyPort).to.be.equal(6795);
        done();
    });

});