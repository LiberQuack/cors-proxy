let expect = require('chai').expect,
    fetch = require('node-fetch'),
    proxer = require('../app/proxer');

describe("Proxer", _ => {

    it("Should proxy GET requests with successfully", done => {
        let proxy = proxer.startNewProxy("httpbin.org", 9091);

        fetch('http://localhost:9091/get?potato').then(res => res.json())
            .then(json => {
                let keys = Object.keys(json.args);
                expect(keys).to.include('potato');
                proxy.close();
                done();
            });
    });

    it("Should start new proxy successfully", done => {
        let proxies = [
            proxer.startNewProxy("httpbin.org", 9091),
            proxyB = proxer.startNewProxy("http://httpbin.org", 9092),
            proxyC = proxer.startNewProxy("http://httpbin.org/", 9093),
            //TODO: proxyD = proxer.startNewProxy("https://httpbin.org/", 9094)
        ];

        let reqs = [
            fetch('http://localhost:9091/get').then(res => res.ok),
            fetch('http://localhost:9092/get').then(res => res.ok),
            fetch('http://localhost:9093/get').then(res => res.ok)
        ];

        Promise.all(reqs).then(results => {
            expect(results.every(it => it)).to.be.true;
            proxies.forEach(it => it.close());
            done();
        })
    })
});