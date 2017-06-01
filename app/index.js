"use strict";

let proxy = require('./proxer'),
    targetParser = require('./cmd-arguments-parser');

let args = targetParser.parseArguments();

proxy.startNewProxy(args.targetHost, args.proxyPort);