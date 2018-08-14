import Utils from "./utils"
import {ConfluencePage} from "./page";
import {Config} from "./config";

const
  Confluence = require('confluence-api');

export class ScanMdConfluence {

  constructor() {
    this.utils = new Utils();
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

  init(configFile) {

    const config = new Config(configFile);

    if (!config.isValid()) return;

    this.config = config.data();

    this.confluenceApi = new Confluence(this.config.confluence);

    return this.confluenceApi;
  }

  processMarkdowns() {
    this.utils
      .scanMarkdowns(process.cwd() + "/" + this.config.scanDirectory)
      .then(files => {

        files.forEach(file => {

          this.utils.readFile(file).then(content => {

            const metaData = this.parseMeta(content);

            if (!metaData) return;

            content = content.replace(this.getMetaString(content), '');

            this
              .pushMarkdown(metaData, content, this.config.confluence.parentPageId)
              .then(() => {
                this.utils.displaySuccess("Confluence pages successfully updated.")
              });

          })
        });

      }).catch((e) => {
      this.utils.displayError("Directory '" + this.config.scanDirectory + "' does not exist. \n", e);
    });
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

    return new Promise(resolve => {
      this.confluenceApi
        .getContentByPageTitle(this.config.confluence.space, pageTitle, (err, data) =>
          resolve(new ConfluencePage(this.confluenceApi, data, this.config)))
    });

  }

  async pushMarkdown(metaData, content, parentId) {

    return new Promise((resolve, reject) => {

      this.getPage(metaData.title).then(page => {

        page
          .setContent(content)
          .setLabels(this.prepareLabels(metaData.labels));

        if (!page.id) {

          page
            .setTitle(metaData.title)
            .create().then(resolve)
            .catch((e) => {
              this.utils.displayError("Error creating page", e);
              reject(e);
            });

        } else {

          page
            .setVersion(++page.version)
            .update()
            .then(resolve)
            .catch((e) => {
              this.utils.displayError("Conflict updating page ", page.getTitle(), page.getId());
              reject(e);
            });
        }
      });
    });
  }
}

const scanMdConfluence = module.exports = ScanMdConfluence;