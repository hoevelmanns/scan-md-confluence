import Utils from "./utils"

const
  Confluence = require('confluence-api'),
  args = require('minimist')(process.argv.slice(2)),
  markdown2confluence = require('markdown2confluence-cws');

export class ScanMdConfluence {

  constructor() {

    this.config = {};
    this.utils = new Utils();
  }

  loadConfig() {

    if (!args || !args.hasOwnProperty('config')) {
      this.utils.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
      return;
    }

    try {

      this.config = require(__dirname + '/../../' + args.config);

      if (!this.utils.isConfigValid(this.config)) {
        return;
      }

      this.confluence = new Confluence(this.config.confluence);

      return this.confluence;

    } catch (e) {

      this.utils.displayError("Error: The specified configuration file was not found.", e);

    }
  }

  processMarkdowns() {

    this.utils
      .scanMarkdowns(this.config.scanDirectory).then(files => {

      files.forEach(file => {

        this.utils.readFile(file).then(content => {

          const metaData = this.parseMeta(content);

          if (!metaData) {
            return;
          }

          content = content.replace(this.getMetaString(content), '');

          this.pushMarkdown(metaData, content, this.config.confluence.parentPageId).then(pageId => {

            if (!pageId || !metaData.labels) {
              return;
            }

            this.postLabels(pageId, metaData.labels);

          });

        })
      });

    }).catch((e) => {
      this.utils.displayError("Directory '" + config.scanDirectory + "' does not exist. \n", e);
    })

  }

  prepareLabels(labels) {
    const prepared = [];

    labels.split(',').map(item => {
      prepared.push({
        "prefix": "global",
        "name": item.trim().toLowerCase()
      });
    });

    return prepared;
  }

  getMetaString(text) {
    return text.match(/<!--*[\s\S]*?\-->*$/gm);
  }

  parseMeta(text) {
    const
      metaData = {},
      matches = this.getMetaString(text);

    if (!matches || !matches.length) {
      return;
    }

    matches[0]
      .replace('<!--', '')
      .replace('-->', '')
      .split('\n')
      .filter((key) => {
        return key.length > 0
      })
      .map((item) => {
        return item.split(':')
      })
      .map((item) => {
        metaData[item[0]] = item[1].trim();
      });

    return metaData;
  }


  getPage(pageTitle) {

    return new Promise((resolve, reject) => {
      this.confluence
        .getContentByPageTitle(this.config.confluence.space, pageTitle, (err, data) => {

          if (err) {
            this.utils.displayError("Page not found: ", pageTitle);
          }

          resolve(data);
        })
    });

  }

  async pushMarkdown(metaData, content, parentId) {

    return new Promise((resolve, reject) => {

      content = markdown2confluence(content, this.config.confluence.markDown || null);
      parentId = parentId || this.config.confluence.parentPageId;

      let
        pageData,
        version;

      this.getPage(metaData.title).then(page => {

        if (page.hasOwnProperty('results') && page.results.length) {
          pageData = page.results[0];
          version = pageData.version.number + 1;

          this.confluence
            .putContent(this.config.confluence.space, pageData.id, version, pageData.title, content, (err, data) => {

              if (err || data.body.statusCode === 400) {
                return reject(err);
              }

              this.utils.displayInfo("Page updated: ", pageData.id + ", " + pageData.title);

              resolve(data.id);

            }, false, 'wiki');
        } else {
          this.confluence
            .postContent(this.config.confluence.space, metaData.title, content, parentId, (err, data) => {

              if (err || data.body.statusCode === 400) {
                return reject(err);
              }

              this.utils.displaySuccess("Page created: ", data.id + ", " + metaData.title);

              resolve(data.id);

            }, 'wiki');
        }

      });
    });
  }

  postLabels(pageId, labels) {

    if (!pageId || !labels || !labels.length) {
      return;
    }

    const preparedLabels = this.prepareLabels(labels);

    return new Promise((resolve, reject) => {
      this.confluence.postLabels(pageId, preparedLabels, data => {
        this.utils.displayInfo("Labels created/updated for page " + pageId + ": ", labels);
        resolve(data);
      });
    })
  }
}

const scanMdConfluence = module.exports = new ScanMdConfluence();

if (args && (args.hasOwnProperty('s') || args.hasOwnProperty('scan')) && scanMdConfluence.loadConfig()) {
  scanMdConfluence.processMarkdowns();
}