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

      var config = new _config.Config(configFile);

      if (!config.isValid()) return;

      this.config = config.data();

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

            if (!metaData) return;

            content = content.replace(_this.getMetaString(content), '');

            _this.pushMarkdown(metaData, content, _this.config.confluence.parentPageId).then(function () {
              _this.utils.displaySuccess("Confluence pages successfully updated.");
            });
          });
        });
      }).catch(function (e) {
        _this.utils.displayError("Directory '" + _this.config.scanDirectory + "' does not exist. \n", e);
      });
    }
  }, {
    key: "prepareLabels",
    value: function prepareLabels(labels) {
      console.log("lasdfsadf", labels);
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

      return new Promise(function (resolve) {
        _this2.confluenceApi.getContentByPageTitle(_this2.config.confluence.space, pageTitle, function (err, data) {
          return resolve(new _page.ConfluencePage(_this2.confluenceApi, data, _this2.config));
        });
      });
    }
  }, {
    key: "pushMarkdown",
    value: async function pushMarkdown(metaData, content, parentId) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {

        _this3.getPage(metaData.title).then(function (page) {

          page.setContent(content).setLabels(_this3.prepareLabels(metaData.labels));

          if (!page.id) {

            page.setTitle(metaData.title).create().then(resolve).catch(function (e) {
              _this3.utils.displayError("Error creating page", e);
              reject(e);
            });
          } else {

            page.setVersion(++page.version).update().then(resolve).catch(function (e) {
              _this3.utils.displayError("Conflict updating page ", page.getTitle(), page.getId());
              reject(e);
            });
          }
        });
      });
    }
  }]);

  return ScanMdConfluence;
}();

var scanMdConfluence = module.exports = ScanMdConfluence;
