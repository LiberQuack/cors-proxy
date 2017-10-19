'use strict';

let cors = require('cors'),
    fs = require('fs'),
    express = require('express'),
    url = require('url'),
    fetch = require('node-fetch'),
    moment = require('moment'),
    proxyLogger = require('./proxy-logger'),
    bodyParser = require('body-parser').raw({type: _ => true});

function startNewProxy(target, proxyPort) {
    let proxy = _instantiateProxy();

    proxy.all('*', (clientReq, finalResponse) => {
        clientReq.perfs = {
            clientMethod: clientReq.method,
            clientUrl: clientReq.originalUrl,
            clientHost: `${clientReq.hostname} - ${clientReq.ip}`,
            clientStart: clientReq.headers['date-started'] ? moment(clientReq.headers['date-started'].replace(/"/g, '')) : moment(),
            serverStart: moment()
        };

        let protocol = target.indexOf("://") > -1 ? "" : "http://";
        let targetUrl = `${protocol}${target}${clientReq.originalUrl}`;
        console.log(`Redirecting from: host=${clientReq.hostname} method=${clientReq.method} to ${targetUrl}`);

        fetch(targetUrl, _createRequest(targetUrl, clientReq))
            .then(_responseToText)
            .then(results => _addPerfs(results, clientReq))
            .then(results => {
                proxyLogger.write(clientReq.perfs);
                return results;
            })
            .then(results => {
                let res = results[0], resBody = results[1];
                res.headers.forEach((value, key) => finalResponse.set(key, value));
                finalResponse.status(res.status).send(resBody);
            })
            .catch(err => {
                console.error(err);
                finalResponse.status(503).send({msg: `Host ${target} is unavailable`, err});
            })
    });

    console.log(`Resquests are going to be redirected to: [${target}/*]`);
    return proxy.listen(proxyPort);
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

function _addPerfs(results, clientReq) {
    let now = moment(), res = results[0], resBody = results[1];
    clientReq.perfs.serverEnd = now;
    clientReq.perfs.clientDiff = now - clientReq.perfs.clientStart;
    // clientReq.perfs.serverResponse = typeof resBody === "string" ? resBody : null;
    clientReq.perfs.codeResponse = res.status;
    return results;
}

function _instantiateProxy() {
    let proxy = express();
    proxy.use(bodyParser);
    proxy.use(cors());
    return proxy;
}

function _createRequest(targetUrl, clientReq) {
    let proxiedReq = {
        method: clientReq.method,
        headers: clientReq.headers,
        redirect: 'manual',
    };

    if (clientReq.body instanceof Uint8Array) {
        proxiedReq.body = clientReq.body.toString();
    }

    proxiedReq.headers.host = url.parse(targetUrl).host;
    return proxiedReq;
}

module.exports = {startNewProxy};