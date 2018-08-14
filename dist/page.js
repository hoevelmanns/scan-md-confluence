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
