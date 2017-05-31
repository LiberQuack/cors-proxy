'use strict';

let express = require('express'),
    fetch = require('node-fetch'),
    moment = require('moment'),
    bodyParser = require('body-parser').raw({type: _ => true});

function startNewProxy(target, port = 8080) {
    let proxy = _instantiateProxy();

    proxy.all('*', (clientReq, finalResponse) => {
        console.log(`Redirecting from: host=${clientReq.hostname} method=${clientReq.method} path=${clientReq.originalUrl} to ${target}${clientReq.originalUrl}`);

        clientReq.perfs = {
            clientMethod: clientReq.method,
            clientUrl: clientReq.originalUrl,
            clientHost: `${clientReq.hostname} - ${clientReq.ip}`,
            clientStart: clientReq.headers['date-started'] ? moment(clientReq.headers['date-started']) : moment(),
            serverStart: moment()
        };

        fetch(`http://${target}${clientReq.originalUrl}`, _createRequest(clientReq))
            .then(_responseToText)
            .then(results => {
                let now = moment(), res = results[0], resBody = results[1];
                clientReq.perfs.serverEnd = now;
                clientReq.perfs.clientDiff = now - clientReq.perfs.clientStart;
                clientReq.perfs.serverResponse = typeof resBody === "string" ? resBody : null;
                clientReq.perfs.codeResponse = res.status;
                return results;
            })
            .then(results => {
                let res = results[0], resBody = results[1];
                res.headers.forEach((value, key) => finalResponse.set(key, value));
                finalResponse.set("Access-Control-Allow-Origin", "*");
                finalResponse.set("Access-Control-Allow-Methods", clientReq.method);
                finalResponse.set("Access-Control-Allow-Headers", Object.keys(clientReq.headers).join(','));
                finalResponse.status(res.status).send(resBody);
            })
            .catch(err => {
                console.error(err);
                finalResponse.status(503).send({msg: `Host ${target} is unavailable`, err});
            });
    });

    proxy.listen(port);
    return proxy;
}

function _responseToText(res) {
    let body, contentType = (res.headers.get('content-type') || "").toLowerCase();

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
}

function _instantiateProxy() {
    let proxy = express();
    proxy.use(bodyParser);
    return proxy;
}

function _createRequest(clientReq) {
    let proxiedReq = {
        method: clientReq.method,
        headers: clientReq.headers,
        redirect: 'manual',
    };

    if (clientReq.body instanceof Uint8Array) {
        proxiedReq.body = clientReq.body.toString();
    }

    return proxiedReq;
}

module.exports = {startNewProxy};