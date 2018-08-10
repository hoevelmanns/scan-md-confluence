#!/usr/bin/env bash

echo "Building scripts...";

babel ./src/scanMdConfluence.js --out-file ./dist/scanMdConfluence.js
babel ./src/utils.js --out-file ./dist/utils.js

echo "Scripts successfully build!"