"use strict";

let fs = require('fs');

let logExists = fs.existsSync('proxy.log');

module.exports = {

    write: function (perfs) {
        let keys = Object.keys(perfs);
        let log = keys.map(key => `${perfs[key]}`).join(";") + ";\r\n";

        if (!logExists) {
            fs.writeFileSync('proxy.log', keys.join(";") + ";\r\n");
            logExists = true;
        }

        fs.appendFile('proxy.log', log, err => {
            if (err) console.error("Could not write logs", err);
        })
    }

};