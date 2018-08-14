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
