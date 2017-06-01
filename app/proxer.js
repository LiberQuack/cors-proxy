'use strict';

let connection, ADODB,
    express = require('express'),
    fetch = require('node-fetch'),
    moment = require('moment'),
    bodyParser = require('body-parser').raw({type: _ => true});

try {
    ADODB = require('node-adodb');
    connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=./csdaFrontendLog.mdb;');
} catch (err) {
    console.warn("Could not connect to ./csdaFrontendLog.mdb;");
}

function startNewProxy(target, proxyPort) {
    let proxy = _instantiateProxy();

    proxy.all('*', (clientReq, finalResponse) => {
        clientReq.perfs = {
            clientMethod: clientReq.method,
            clientUrl: clientReq.originalUrl,
            clientHost: `${clientReq.hostname} - ${clientReq.ip}`,
            clientStart: clientReq.headers['date-started'] ? moment(clientReq.headers['date-started']) : moment(),
            serverStart: moment()
        };

        let protocol = target.indexOf("://") > -1 ? "" : "http://";
        let targetUrl = `${protocol}${target}${clientReq.originalUrl}`;
        console.log(`Redirecting from: host=${clientReq.hostname} method=${clientReq.method} to ${targetUrl}`);

        fetch(targetUrl, _createRequest(clientReq))
            .then(_responseToText)
            .then(results => _addPerfs(results, clientReq))
            .then(results => {
                _saveLogs(clientReq.perfs);
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
            })
    });

    console.log(`Resquests are going to be redirected to: [${target}/*]`);
    return proxy.listen(proxyPort);
}

function _saveLogs(perfs) {
    if (!connection) return console.warn("No connection to mdb, can't save logs");

    let statement = `  INSERT INTO proxyLog (clientMethod, clientUrl, clientHost, clientStart, serverStart, serverEnd, clientDiff, serverResponse, codeResponse)
                       VALUES ('${perfs.clientMethod}', '${perfs.clientUrl}', '${perfs.clientHost}', #${perfs.clientStart.format('YYYY-MM-DD HH:mm:ss')}#,
                       #${perfs.serverStart.format('YYYY-MM-DD HH:mm:ss')}#, #${perfs.serverEnd.format('YYYY-MM-DD HH:mm:ss')}#,
                       ${perfs.clientDiff}, '${(perfs.serverResponse || "").substring(0, 30).replace(/'/g, '')}', ${perfs.codeResponse})`;

    connection.execute(statement).on('fail', err => console.warn("Could not save logs on csdaFrontendLog.mdb", err));
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
    clientReq.perfs.serverResponse = typeof resBody === "string" ? resBody : null;
    clientReq.perfs.codeResponse = res.status;
    return results;
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

    delete proxiedReq.headers.host;
    return proxiedReq;
}

module.exports = {startNewProxy};