"use strict";

let proxy = require('./proxer'),
    targetParser = require('./target-parser');

let targetHost = targetParser.parseArguments();

proxy.startNewProxy(targetHost, 8080);