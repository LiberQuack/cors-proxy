"use strict";

module.exports = {
    parseArguments: function (cmdArguments = process.argv) {
        let args = {
            targetHost: cmdArguments[2],
            proxyPort: +(cmdArguments[3] || 8080)
        };

        if (!args.targetHost) {
            console.error("USAGE: node ./app/proxer.js [http[s]://]<host>[:port]");
            throw new Error("Host targetHost argument required...");
        }

        return args;
    }
};