#!/usr/bin/env bash

echo "Building scripts...";

DIR=`dirname $0`

babel $DIR/src/*.js --out-file $DIR/dist/scanMdConfluence.js

echo "Scripts successfully build!"