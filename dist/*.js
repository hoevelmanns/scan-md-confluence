"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = exports.Config = function () {
  function Config() {
    _classCallCheck(this, Config);

    if (!Config.instance) {
      this._data = [];
      Config.instance = this;
    }

    return Config.instance;
  }

  _createClass(Config, [{
    key: "load",
    value: function load(file) {
      this._data = require(file);
    }
  }, {
    key: "data",
    value: function data() {
      return this._data;
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

var _scanMdConfluence = require('./scanMdConfluence');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfluencePage = exports.ConfluencePage = function () {
  function ConfluencePage(data) {
    _classCallCheck(this, ConfluencePage);

    if (!data || !data.hasOwnProperty('results')) {
      return;
    }

    var resultData = data.results[0];

    this.version = resultData.version.number;
    this.content = resultData.body.storage.value;
    this.title = resultData.title;
    this.id = resultData.id;
    this.markdown2confluence = require('markdown2confluence-cws');
  }

  _createClass(ConfluencePage, [{
    key: 'setVersion',
    value: function setVersion(version) {
      this.version = version;
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
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return this.title;
    }
  }, {
    key: 'setContent',
    value: function setContent(content) {
      this.content = this.markdown2confluence(content); // todo markdown2confluence
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
    }
  }, {
    key: 'getId',
    value: function getId() {
      return this.id;
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
  }

  _createClass(ScanMdConfluence, [{
    key: "loadConfig",
    value: function loadConfig(configFile) {

      if (!configFile) {
        return this.utils.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
      }

      try {

        _config.Config.load(configFile);
        return;

        this.config = require(configFile);

        if (!this.utils.isConfigValid(this.config)) {
          return false;
        }
      } catch (e) {

        return this.utils.displayError("Error: The specified configuration file was not found.", e);
      }

      this.confluenceApi = new Confluence(this.config.confluence);

      return this.confluenceApi;
    }
  }, {
    key: "processMarkdowns",
    value: function processMarkdowns() {
      var _this = this;

      this.utils.scanMarkdowns(process.cwd() + "/" + this.config.scanDirectory).then(function (files) {

        files.forEach(function (file) {

          _this.utils.readFile(file).then(function (content) {

            var metaData = _this.parseMeta(content);

            if (!metaData) {
              return;
            }

            content = content.replace(_this.getMetaString(content), '');

            _this.pushMarkdown(metaData, content, _this.config.confluence.parentPageId).then(function (pageId) {

              if (!pageId || !metaData.labels) {
                return;
              }

              _this.addLabels(pageId, metaData.labels);
            });
          });
        });
      }).catch(function (e) {
        _this.utils.displayError("Directory '" + config.scanDirectory + "' does not exist. \n", e);
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
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.confluenceApi.getContentByPageTitle(_this2.config.confluence.space, pageTitle, function (err, data) {

          if (err) {
            _this2.utils.displayError("Page not found: ", pageTitle);
          }

          resolve(new _page.ConfluencePage(data, _this2.config.confluence));
        });
      });
    }
  }, {
    key: "pushMarkdown",
    value: async function pushMarkdown(metaData, content, parentId) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {

        content = markdown2confluence(content, _this3.config.confluence.markDown || null);
        parentId = parentId || _this3.config.confluence.parentPageId;

        var pageData = void 0,
            version = void 0;

        _this3.getPage(metaData.title).then(function (page) {
          console.log("page", page.getTitle());

          return;

          if (page.hasOwnProperty('results') && page.results.length) {
            pageData = page.results[0];
            version = pageData.version.number + 1;

            _this3.confluenceApi.putContent(_this3.config.confluence.space, pageData.id, version, pageData.title, content, function (err, data) {

              if (err || data.body.statusCode === 400) {
                return reject(err);
              }

              _this3.utils.displayInfo("Page updated: ", pageData.id + ", " + pageData.title);

              resolve(data.id);
            }, false, 'wiki');
          } else {
            _this3.confluenceApi.postContent(_this3.config.confluence.space, metaData.title, content, parentId, function (err, data) {

              if (err || data.body.statusCode === 400) {
                return reject(err);
              }

              _this3.utils.displaySuccess("Page created: ", data.id + ", " + metaData.title);

              resolve(data.id);
            }, 'wiki');
          }
        });
      });
    }
  }, {
    key: "postLabels",
    value: function postLabels(pageId, labels) {
      var _this4 = this;

      if (!pageId || !labels || !labels.length) {
        return;
      }

      var preparedLabels = this.prepareLabels(labels);

      return new Promise(function (resolve, reject) {
        _this4.confluence.addLabels(pageId, preparedLabels, function (data) {
          _this4.utils.displayInfo("Labels created/updated for page " + pageId + ": ", labels);
          resolve(data);
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
    value: function readFile(path) {

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
  }, {
    key: 'isConfigValid',
    value: function isConfigValid(config) {
      var required = ['confluence', 'scanDirectory', 'confluence.username', 'confluence.password', 'confluence.baseUrl', 'confluence.version', 'confluence.space', 'confluence.parentPageId'],
          missing = [];

      var splittedKey = void 0;

      required.forEach(function (key) {

        splittedKey = key.split(".");

        if (splittedKey.length === 1) {
          !config[key] ? missing.push(key) : missing;
        } else if (splittedKey.length === 2) {
          !config[splittedKey[0]][splittedKey[1]] ? missing.push(key) : missing;
        }
      });

      if (missing.length) {

        this.displayError("Configuration ist not valid! Keys missing: ", missing.join(", "));
      }

      return missing.length === 0;
    }
  }]);

  return Utils;
}();

exports.default = Utils;
