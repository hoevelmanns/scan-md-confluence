"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = exports.Config = function () {
  function Config(file) {
    _classCallCheck(this, Config);

    this.utils = new _utils2.default();

    if (!Config.instance) {
      this.load(file);

      Config.instance = this;
    }

    return Config.instance;
  }

  _createClass(Config, [{
    key: "load",
    value: function load(file) {

      if (!file) {
        return this.utils.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
      }

      try {

        this._data = require(file);
      } catch (e) {

        return this.utils.displayError("Error: The specified configuration file was not found.", e);
      }
    }
  }, {
    key: "setPassword",
    value: function setPassword(password) {
      this._data.confluence.password = password;
    }
  }, {
    key: "data",
    value: function data() {
      return this._data;
    }
  }, {
    key: "isValid",
    value: function isValid() {
      var _this = this;

      var required = ['confluence', 'scanDirectory', 'confluence.username', 'confluence.password', 'confluence.baseUrl', 'confluence.version', 'confluence.space', 'confluence.parentPageId'],
          missing = [];

      var splittedKey = void 0;

      required.forEach(function (key) {

        splittedKey = key.split(".");

        if (splittedKey.length === 1) {
          !_this._data[key] ? missing.push(key) : missing;
        } else if (splittedKey.length === 2) {
          !_this._data[splittedKey[0]][splittedKey[1]] ? missing.push(key) : missing;
        }
      });

      if (missing.length) {

        this.utils.displayError("Configuration ist not valid! Keys missing: ", missing.join(", "));
      }

      return missing.length === 0;
    }
  }]);

  return Config;
}();
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfluencePage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfluencePage = exports.ConfluencePage = function () {
  function ConfluencePage(confluenceApi, data, config) {
    _classCallCheck(this, ConfluencePage);

    this.markdown2confluence = require('markdown2confluence-cws');
    this.confluenceApi = confluenceApi;
    this.config = config;
    this.utils = new _utils2.default();
    this.labels = [];

    if (!data || !data.hasOwnProperty('results')) return;

    var resultData = data.results[0];

    this.version = resultData.version.number;
    this.content = resultData.body.storage.value;
    this.title = resultData.title;
    this.id = resultData.id;
  }

  _createClass(ConfluencePage, [{
    key: 'setLabels',
    value: function setLabels(labels) {
      this.labels = labels;
      return this;
    }
  }, {
    key: 'setVersion',
    value: function setVersion(version) {
      this.version = version;
      return this;
    }
  }, {
    key: 'getVersion',
    value: function getVersion() {
      return this.version;
    }
  }, {
    key: 'setTitle',
    value: function setTitle(title) {
      this.title = title;
      return this;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: 'setContent',
    value: function setContent(content) {
      this.content = this.markdown2confluence(content, this.config.confluence.markDown);

      return this;
    }
  }, {
    key: 'getContent',
    value: function getContent() {
      return this.content;
    }
  }, {
    key: 'setId',
    value: function setId(id) {
      this.id = id;
      return this;
    }
  }, {
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'create',
    value: async function create() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.confluenceApi.postContent(_this.config.confluence.space, _this.title, _this.content, _this.config.confluence.parentPageId, function (err, data) {

          if (err || data.body.statusCode === 400) {
            return reject(err);
          }

          _this.setId(data.id);

          _this.utils.displaySuccess("Page created: ", _this.id + ", " + _this.title);

          return _this.addLabels().then(resolve).catch(reject);
        }, 'wiki');
      });
    }
  }, {
    key: 'update',
    value: async function update() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        // page exist, so update this
        _this2.confluenceApi.putContent(_this2.config.confluence.space, _this2.id, _this2.version, _this2.title, _this2.content, function (err) {

          if (err) {
            reject(err);
          }

          _this2.utils.displayInfo("Page updated: ", _this2.id + ", " + _this2.title);

          return _this2.addLabels().then(resolve).catch(reject);
        }, false, 'wiki');
      });
    }
  }, {
    key: 'addLabels',
    value: async function addLabels() {
      var _this3 = this;

      if (!this.id || !this.labels || !this.labels.length) return;

      return new Promise(function (resolve, reject) {
        _this3.confluenceApi.postLabels(_this3.id, _this3.labels, function (data) {
          _this3.utils.displayInfo("Labels created/updated for page " + _this3.id + ": ", _this3.labels.map(function (label) {
            return label.name;
          }).join(', '));

          resolve(data);
        });
      });
    }
  }]);

  return ConfluencePage;
}();
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScanMdConfluence = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _page = require("./page");

var _config = require("./config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Confluence = require('confluence-api');

var ScanMdConfluence = exports.ScanMdConfluence = function () {
  function ScanMdConfluence() {
    _classCallCheck(this, ScanMdConfluence);

    this.utils = new _utils2.default();
    this.confluenceApi = null;
    this.readline = require('readline-sync');
    this.markdown2confluence = require('markdown2confluence-cws');
    this.config = {
      confluence: {
        username: "",
        password: "",
        baseUrl: "",
        version: 3,
        space: "",
        parentPageId: 0,
        markDown: {
          codeStyling: {
            linenumbers: true,
            theme: "RDark"
          },
          codeLanguageMap: {
            markdownLanguage: "confluenceLanguage"
          }
        }
      },
      "fileEncoding": "utf8",
      "scanDirectory": null
    };
  }

  _createClass(ScanMdConfluence, [{
    key: "init",
    value: function init(configFile) {
      var _this = this;

      var config = new _config.Config(configFile);

      return new Promise(function (resolve, reject) {

        if (!_this.config.confluence.password) {
          config.setPassword(_this.readline.question('Please type your Confluence password: ', {
            hideEchoBack: true
          }));
        }

        if (!config.isValid()) return reject();

        _this.config = config.data();

        _this.confluenceApi = new Confluence(_this.config.confluence);

        return resolve(_this.confluenceApi);
      });
    }
  }, {
    key: "processMarkdowns",
    value: function processMarkdowns() {
      var _this2 = this;

      this.utils.scanMarkdowns(process.cwd() + "/" + this.config.scanDirectory).then(function (files) {

        files.forEach(function (file) {

          _this2.utils.readFile(file).then(function (content) {

            var metaData = _this2.parseMeta(content);

            if (!metaData) return;

            content = content.replace(_this2.getMetaString(content), '');

            _this2.pushMarkdown(metaData, content, _this2.config.confluence.parentPageId).then(function () {
              _this2.utils.displaySuccess("Confluence pages successfully updated.");
            });
          });
        });
      }).catch(function (e) {
        _this2.utils.displayError("Directory '" + _this2.config.scanDirectory + "' does not exist. \n", e);
      });
    }
  }, {
    key: "prepareLabels",
    value: function prepareLabels(labels) {
      var prepared = [];

      labels.split(',').map(function (item) {
        prepared.push({
          "prefix": "global",
          "name": item.trim().toLowerCase()
        });
      });

      return prepared;
    }
  }, {
    key: "getMetaString",
    value: function getMetaString(text) {
      return text.match(/<!--*[\s\S]*?\-->*$/gm);
    }
  }, {
    key: "parseMeta",
    value: function parseMeta(text) {
      var metaData = {},
          matches = this.getMetaString(text);

      if (!matches || !matches.length) {
        return;
      }

      matches[0].replace('<!--', '').replace('-->', '').split('\n').filter(function (key) {
        return key.length > 0;
      }).map(function (item) {
        return item.split(':');
      }).map(function (item) {
        metaData[item[0]] = item[1].trim();
      });

      return metaData;
    }
  }, {
    key: "getPage",
    value: function getPage(pageTitle) {
      var _this3 = this;

      return new Promise(function (resolve) {
        _this3.confluenceApi.getContentByPageTitle(_this3.config.confluence.space, pageTitle, function (err, data) {
          return resolve(new _page.ConfluencePage(_this3.confluenceApi, data, _this3.config));
        });
      });
    }
  }, {
    key: "pushMarkdown",
    value: async function pushMarkdown(metaData, content) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {

        _this4.getPage(metaData.title).then(function (page) {

          page.setContent(content).setLabels(_this4.prepareLabels(metaData.labels));

          if (!page.id) {

            page.setTitle(metaData.title).create().then(resolve).catch(function (e) {
              _this4.utils.displayError("Error creating page", e.statusCode);
              return reject(e);
            });
          } else {

            page.setVersion(++page.version).update().then(resolve).catch(function (e) {
              _this4.utils.displayError("Conflict updating page ", page.getTitle(), page.getId());
              return reject(e);
            });
          }
        });
      });
    }
  }]);

  return ScanMdConfluence;
}();

var scanMdConfluence = module.exports = ScanMdConfluence;
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
