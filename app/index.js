let proxy = require('express')(),
    fetch = require('node-fetch');

let target = process.argv[2];

if (!target) {
    console.error("Host target argument required... node ./app/index.js <host>[:port]");
    process.exit(1);
} else {
    console.log(`Resquests are going to be redirected to: [${target}/*]`);
}

proxy.all('*', (proxyReq, proxyRes) => {
    console.log(`Redirecting from: host=${proxyReq.hostname} method=${proxyReq.method} path=${proxyReq.originalUrl} to ${target}${proxyReq.originalUrl}`);

    fetch(`http://${target}${proxyReq.originalUrl}`)
        .then(res => Promise.all([res, res.text()]))
        .then(results => {
            let res = results[0], resBody = results[1];
            proxy.set('Content-Type', res.headers.get('Content-Type'));
            proxyRes.status(res.status).send(resBody);
        })
        .catch(err => {
            proxyRes.status(503).send({msg: `Host ${target} is unavailable`, err});
        });
});

proxy.listen(8080);