let proxy = require('express')(),
    fetch = require('node-fetch');

let target = process.argv[2];

if (!target) {
    console.error("Host target argument required... node ./app/index.js <host>[:port]");
    process.exit(1);
} else {
    console.log(`Resquests are going to be redirected to: [${target}/*]`);
}

proxy.use(require('body-parser').text(_ => true));

proxy.all('*', (proxyReq, proxyRes) => {
    console.log(`Redirecting from: host=${proxyReq.hostname} method=${proxyReq.method} path=${proxyReq.originalUrl} to ${target}${proxyReq.originalUrl}`);

    let fetchOpts = {
        method: proxyReq.method,
        headers: proxyReq.headers,
        redirect: 'manual'
    };

    fetch(`http://${target}${proxyReq.originalUrl}`, fetchOpts)
        .then(res => Promise.all([res, res.text()]))
        .then(results => {
            let res = results[0],
                resBody = results[1];
            res.headers.forEach((value, key) => proxyRes.set(key, value));
            proxyRes.status(res.status).send(resBody);
        })
        .catch(err => {
            proxyRes.status(503).send({msg: `Host ${target} is unavailable`, err});
        });
});

proxy.listen(8080);