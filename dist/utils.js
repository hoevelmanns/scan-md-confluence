'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs'),
    colors = require('colors'),
    klaw = require('klaw'),
    path = require('path');

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, [{
    key: 'readFile',
    value: async function readFile(path) {

      return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {

          if (err) {
            reject(err);
          }

          resolve(data);
        });
      });
    }
  }, {
    key: 'scanMarkdowns',
    value: function scanMarkdowns(directory) {

      var files = [];

      return new Promise(function (resolve, reject) {
        klaw(directory).on('data', function (item) {

          if (path.extname(item.path) !== ".md") {
            return;
          }

          files.push(item.path);
        }).on('end', function () {
          return resolve(files);
        }).on('error', function () {
          return reject;
        });
      });
    }
  }, {
    key: 'displayError',
    value: function displayError(message) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


      if (!values) {
        values = "";
      }

      console.error(colors.red(String.fromCharCode("0x2718") + " " + message), colors.bold(values));
    }
  }, {
    key: 'displaySuccess',
    value: function displaySuccess(message) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


      if (!values) {
        values = "";
      }

      console.info(colors.green(String.fromCharCode("0x2705") + " " + message), colors.bold(values));
    }
  }, {
    key: 'displayInfo',
    value: function displayInfo(message) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


      if (!values) {
        values = "";
      }

      console.info(colors.yellow(String.fromCharCode("0x2705") + " " + message), colors.bold(values));
    }
  }]);

  return Utils;
}();

exports.default = Utils;
