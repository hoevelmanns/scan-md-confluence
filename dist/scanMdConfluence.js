'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScanMdConfluence = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Confluence = require('confluence-api'),
    markdown2confluence = require('markdown2confluence-cws');

var ScanMdConfluence = exports.ScanMdConfluence = function () {
  function ScanMdConfluence() {
    _classCallCheck(this, ScanMdConfluence);

    this.config = {};
    this.utils = new _utils2.default();
  }

  _createClass(ScanMdConfluence, [{
    key: 'loadConfig',
    value: function loadConfig(configFile) {

      if (!configFile) {
        return this.utils.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
      }

      try {

        this.config = require(configFile);

        if (!this.utils.isConfigValid(this.config)) {
          return false;
        }
      } catch (e) {

        return this.utils.displayError("Error: The specified configuration file was not found.", e);
      }

      this.confluence = new Confluence(this.config.confluence);

      return this.confluence;
    }
  }, {
    key: 'processMarkdowns',
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

              _this.postLabels(pageId, metaData.labels);
            });
          });
        });
      }).catch(function (e) {
        _this.utils.displayError("Directory '" + config.scanDirectory + "' does not exist. \n", e);
      });
    }
  }, {
    key: 'prepareLabels',
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
    key: 'getMetaString',
    value: function getMetaString(text) {
      return text.match(/<!--*[\s\S]*?\-->*$/gm);
    }
  }, {
    key: 'parseMeta',
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
    key: 'getPage',
    value: function getPage(pageTitle) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.confluence.getContentByPageTitle(_this2.config.confluence.space, pageTitle, function (err, data) {

          if (err) {
            _this2.utils.displayError("Page not found: ", pageTitle);
          }

          resolve(data);
        });
      });
    }
  }, {
    key: 'pushMarkdown',
    value: async function pushMarkdown(metaData, content, parentId) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {

        content = markdown2confluence(content, _this3.config.confluence.markDown || null);
        parentId = parentId || _this3.config.confluence.parentPageId;

        var pageData = void 0,
            version = void 0;

        _this3.getPage(metaData.title).then(function (page) {

          if (page.hasOwnProperty('results') && page.results.length) {
            pageData = page.results[0];
            version = pageData.version.number + 1;

            _this3.confluence.putContent(_this3.config.confluence.space, pageData.id, version, pageData.title, content, function (err, data) {

              if (err || data.body.statusCode === 400) {
                return reject(err);
              }

              _this3.utils.displayInfo("Page updated: ", pageData.id + ", " + pageData.title);

              resolve(data.id);
            }, false, 'wiki');
          } else {
            _this3.confluence.postContent(_this3.config.confluence.space, metaData.title, content, parentId, function (err, data) {

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
    key: 'postLabels',
    value: function postLabels(pageId, labels) {
      var _this4 = this;

      if (!pageId || !labels || !labels.length) {
        return;
      }

      var preparedLabels = this.prepareLabels(labels);

      return new Promise(function (resolve, reject) {
        _this4.confluence.postLabels(pageId, preparedLabels, function (data) {
          _this4.utils.displayInfo("Labels created/updated for page " + pageId + ": ", labels);
          resolve(data);
        });
      });
    }
  }]);

  return ScanMdConfluence;
}();

var scanMdConfluence = module.exports = ScanMdConfluence;
