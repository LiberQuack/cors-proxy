"use strict";

module.exports = {
    parseArguments: function (cmdArguments = process.argv) {
        let args = {
            targetHost: cmdArguments[2] || process.env["PROXY_TARGET"],
            proxyPort: +(cmdArguments[3] || process.env["PROXY_PORT"] || 8080)
        };

        if (!args.targetHost) {
            console.error("USAGE: npm start [http[s]://]<host>[:port] [proxyPort]\n\n");
            throw new Error("Host targetHost argument required...");
        }

        return args;
    }
};