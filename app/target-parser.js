"use strict";

module.exports = {
    parseArguments: function (cmdArguments = process.argv) {
        let target = cmdArguments[2];

        if (!target) {
            throw new Error("Host target argument required... node ./app/proxer.js <host>[:port]");
        } else {
            console.log(`Resquests are going to be redirected to: [${target}/*]`);
            return target;
        }
    }
};