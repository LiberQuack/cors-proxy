let expect = require('chai').expect;

describe('Windows Service Installer', _ => {

    it('Should throw error on Linux', done => {
        expect(_ => require('../app/windows-service-installer')).to.throw();
        done();
    });

});