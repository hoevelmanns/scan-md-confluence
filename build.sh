#!/usr/bin/env bash

echo "Building scripts...";

DIR=`dirname $0`

babel $DIR/src/scanMdConfluence.js --out-file $DIR/dist/scanMdConfluence.js
babel $DIR/src/utils.js --out-file $DIR/dist/utils.js
babel $DIR/src/page.js --out-file $DIR/dist/page.js
babel $DIR/src/config.js --out-file $DIR/dist/config.js

echo "Scripts successfully build!"