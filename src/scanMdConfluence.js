var
  Confluence = require('confluence-api'),
  klaw = require('klaw'),
  path = require('path'),
  fs = require('fs'),
  appPath = process.argv[1],
  colors = require('colors'),
  args = require('minimist')(process.argv.slice(2)),
  markdown2confluence = require('markdown2confluence-cws'),
  config = {},
  self,
  markDownFiles = [];

var scanMdConfluence = module.exports = {

  init: function () {

    if (!args || !args.hasOwnProperty('config')) {
      this.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
      return;
    }

    try {

      config = require(appPath + '/../../' + args.config);

      if (!this.isConfigValid()) {
        return;
      }

      this.confluence = new Confluence(config.confluence);

      return this.confluence;

    } catch (e) {

      this.displayError("Error: The specified configuration file was not found.", e);

    }

  },

  processMarkdowns: function () {

    self = this;

    this.scanForMarkDowns().then(function () {

      markDownFiles.forEach(function (file) {
        self.read(file).then(function (content) {

          var metaData = self.parseMeta(content);

          if (!metaData) {
            return;
          }

          content = content.replace(self.metaStr(content), '');

          self.pushMarkdown(metaData, content, config.confluence.parentPageId).then(function (pageId) {

            if (!pageId || !metaData.labels) {
              return;
            }

            self.postLabels(pageId, metaData.labels);

          });

        })
      });

    }).catch(function (e) {
      self.displayError("Directory '" + config.scanDirectory + "' does not exist. \n", e);
    })

  },

  read: function (path) {

    return new Promise(function (resolve, reject) {
      fs.readFile(path, config.fileEncoding || 'utf8', function (err, data) {

        if (err) {
          reject(err)
        }

        resolve(data);

      });
    });

  },

  metaStr: function (text) {

    return text.match(/<!--*[\s\S]*?\-->*$/gm);

  },

  prepareLabels: function (labels) {

    var prepared = [];

    labels.split(',').map(function (item) {
      prepared.push({
        "prefix": "global",
        "name": item.trim().toLowerCase()
      });
    });

    return prepared;

  },

  parseMeta: function (text) {

    var
      metaData = {},
      matches = this.metaStr(text);

    if (!matches || !matches.length) {
      return;
    }

    matches[0]
      .replace('<!--', '')
      .replace('-->', '')
      .split('\n')
      .filter(function (key) {
        return key.length > 0
      })
      .map(function (item) {
        return item.split(':')
      })
      .map(function (item) {
        metaData[item[0]] = item[1].trim();
      });

    return metaData;

  },

  scanForMarkDowns: function () {

    self = this;

    return new Promise(function (resolve, reject) {
      klaw(config.scanDirectory)
        .on('data', function (item) {

          if (path.extname(item.path) !== ".md") {
            return;
          }

          markDownFiles.push(item.path);

        })
        .on('end', resolve)
        .on('error', reject)
    });

  },


  getPage: function (pageTitle) {

    self = this;

    return new Promise(function (resolve, reject) {
      self.confluence.getContentByPageTitle(config.confluence.space, pageTitle, function (err, data) {

        if (err) {
          self.displayError("Page not found: ", pageTitle);
        }

        resolve(data);

      })
    });

  },

  postLabels: function (pageId, labels) {

    self = this;

    if (!pageId || !labels || !labels.length) {
      return;
    }

    return new Promise(function (resolve, reject) {
      self.confluence.postLabels(pageId, self.prepareLabels(labels), function (data) {
        self.displayInfo("Labels created/updated for page " + pageId + ": ", labels);
        resolve(data);
      });
    })

  },

  pushMarkdown: function (metaData, content, parentId) {

    self = this;

    return new Promise(function (resolve, reject) {

      content = markdown2confluence(content, config.confluence.markDown || null);
      parentId = parentId || config.confluence.parentPageId;

      var
        pageData,
        version;

      self.getPage(metaData.title).then(function (page) {

        if (page.hasOwnProperty('results') && page.results.length) {
          pageData = page.results[0];
          version = pageData.version.number + 1;

          self.confluence.putContent(config.confluence.space, pageData.id, version, pageData.title, content, function (err, data) {

            if (err || data.body.statusCode === 400) {
              return reject(err);
            }

            self.displayInfo("Page updated: ", pageData.id + ", " + pageData.title);
            resolve(data.id);

          }, false, 'wiki');
        } else {
          self.confluence.postContent(config.confluence.space, metaData.title, content, parentId, function (err, data) {

            if (err || data.body.statusCode === 400) {
              return reject(err);
            }

            self.displaySuccess("Page created: ", data.id + ", " + metaData.title);
            resolve(data.id);

          }, 'wiki');
        }

      });
    });

  },

  displayError: function (message, values) {

    if (!values) {
      values = "";
    }

    console.error(colors.red(String.fromCharCode("0x2718") + " " + message), colors.bold(values));

  },

  displaySuccess: function (message, values) {

    if (!values) {
      values = "";
    }

    console.info(colors.green(String.fromCharCode("0x2705") + " " + message), colors.bold(values));

  },

  displayInfo: function (message, values) {

    if (!values) {
      values = "";
    }

    console.info(colors.yellow(String.fromCharCode("0x2705") + " " + message), colors.bold(values));

  },

  isConfigValid: function () {
    var
      required = [
        'confluence',
        'scanDirectory',
        'confluence.username',
        'confluence.password',
        'confluence.baseUrl',
        'confluence.version',
        'confluence.space',
        'confluence.parentPageId'
      ],
      missing = [],
      splittedKey;

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
};

if (scanMdConfluence.init()) {
  scanMdConfluence.processMarkdowns();
}