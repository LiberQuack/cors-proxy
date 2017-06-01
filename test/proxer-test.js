let expect = require('chai').expect,
    fetch = require('node-fetch'),
    proxer = require('../app/proxer');

describe("Proxer", _ => {


    it("Should proxy requests with body successfully", done => {
        let proxy = proxer.startNewProxy("httpbin.org", 9091);
        fetch('http://localhost:9091/get?potato')
            .then(res => res.json())
            .then(json => {
                let keys = Object.keys(json.args);
                expect(keys).to.include('potato');
                proxy.close();
                done();
            });
    });

});