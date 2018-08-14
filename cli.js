#!/usr/bin/env node
'use strict';

var
  args = require('minimist')(process.argv.slice(2)),
  scanMdConfluence = require('./dist/scanMdConfluence'),
  scanner = new scanMdConfluence();

if (args) {
  scanner.init(process.cwd() + "/" + args.config).then(function () {
    scanner.utils.displayInfo("Configuration is valid. Scanning markdowns and update confluence. Please wait...");
    scanner.processMarkdowns();
  }).catch((e) => {
    
  });
}
