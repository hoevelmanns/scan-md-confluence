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
