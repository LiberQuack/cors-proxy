'use strict';

let proxy = require('express')(),
    targetParser = require('./target-parser'),
    fetch = require('node-fetch');

let targetHost = targetParser.parseArguments();

proxy.use(require('body-parser').raw({type: "*/*"}));

proxy.all('*', (clientReq, finalResponse) => {
    console.log(`Redirecting from: host=${clientReq.hostname} method=${clientReq.method} path=${clientReq.originalUrl} to ${targetHost}${clientReq.originalUrl}`);

    let proxiedReq = {
        method: clientReq.method,
        headers: clientReq.headers,
        redirect: 'manual',
    };

    if (clientReq.body instanceof Uint8Array) {
        proxiedReq.body = clientReq.body.toString();
    }

    fetch(`http://${targetHost}${clientReq.originalUrl}`, proxiedReq)
        .then(res => {
            let body, contentType = (res.headers.get('content-type') || "").toLowerCase();

            //TODO: Extract it from here
            switch (true) {
                case (contentType.indexOf('text') > -1):
                case (contentType.indexOf('application/javascript') > -1):
                    body = res.text();
                    res.headers.delete('content-encoding');
                    break;
                default:
                    body = res.buffer();
            }

            return Promise.all([res, body]);
        })
        .then(results => {
            let res = results[0], resBody = results[1];
            res.headers.forEach((value, key) => finalResponse.set(key, value));
            finalResponse.set("Access-Control-Allow-Origin", "*");
            finalResponse.set("Access-Control-Allow-Methods", clientReq.method);
            finalResponse.set("Access-Control-Allow-Headers", Object.keys(clientReq.headers));

            finalResponse.status(res.status).send(resBody);
        })
        .catch(err => {
            console.err(err);
            finalResponse.status(503).send({msg: `Host ${targetHost} is unavailable`, err});
        });
});

proxy.listen(8080);