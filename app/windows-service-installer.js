"use strict";

const os = require('os'),
    readline = require('readline'),
    Service = require('node-windows').Service,
    argsParser = require('../app/cmd-arguments-parser');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (os.type() !== "Windows_NT") {
    console.error("Service installation failed, verify if you are on Microsoft Windows system");
    throw new Error("Cannot install service");
}

rl.question('Service name -> ', name => {
    rl.question('Proxy target [protocol]<host>[:port] -> ', target => {
        rl.question('Proxy should run on port 1-65535 (default 8080) -> ', port => {
            rl.close();
            _install(name, target, port);
        });
    });
});

function _install(name, target, port) {
    let args = argsParser.parseArguments([null, null, target, port]);

    let svc = new Service({
        name: name,
        description: `A simple proxy for recording logs about requests and responses ` +
                        `proxyTarget(${args.targetHost}) proxyPort(${args.proxyPort})`,
        script: `${__dirname}/index.js`,
        env: [{
            name: "PROXY_TARGET",
            value: args.targetHost
        }, {
            name: "PROXY_PORT",
            value: args.proxyPort
        }]
    });

    svc.on('install', () => console.log("Service installed successfully :)"));
    svc.on('alreadyinstalled', () => console.log("Service already installed"));
    svc.on('invalidinstallation', () => console.log("Service was installed, but some errors may occur"));
    svc.install();
}