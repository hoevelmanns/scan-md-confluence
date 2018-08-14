import Utils from "./utils";

export class ConfluencePage {

  constructor(confluenceApi, data, config) {

    this.markdown2confluence = require('markdown2confluence-cws');
    this.confluenceApi = confluenceApi;
    this.config = config;
    this.utils = new Utils();
    this.labels = [];

    if (!data || !data.hasOwnProperty('results')) return;

    const resultData = data.results[0];

    this.version = resultData.version.number;
    this.content = resultData.body.storage.value;
    this.title = resultData.title;
    this.id = resultData.id;

  }

  setLabels(labels) {
    this.labels = labels;
    return this;
  }

  setVersion(version) {
    this.version = version;
    return this;
  }

  getVersion() {
    return this.version;
  }

  setTitle(title) {
    this.title = title;
    return this;
  }

  getTitle() {
    return this.title;
  }

  setContent(content) {
    this.content = this
      .markdown2confluence(content, this.config.confluence.markDown);

    return this;
  }

  getContent() {
    return this.content;
  }

  setId(id) {
    this.id = id;
    return this;
  }

  getId() {
    return this.id;
  }

  async create() {
    return new Promise((resolve, reject) => {
      this.confluenceApi
        .postContent(
          this.config.confluence.space,
          this.title,
          this.content,
          this.config.confluence.parentPageId,
          (err, data) => {

            if (err || data.body.statusCode === 400) {
              return reject(err);
            }

            this.setId(data.id);

            this.utils.displaySuccess("Page created: ", this.id + ", " + this.title);

            return this.addLabels()
              .then(resolve)
              .catch(reject);

          }, 'wiki');
    });
  }

  async update() {
    return new Promise((resolve, reject) => {
      // page exist, so update this
      this.confluenceApi
        .putContent(
          this.config.confluence.space,
          this.id,
          this.version,
          this.title,
          this.content,
          (err) => {

            if (err) {
              reject(err);
            }

            this.utils.displayInfo("Page updated: ", this.id + ", " + this.title);

            return this.addLabels()
              .then(resolve)
              .catch(reject);

          }, false, 'wiki');
    });
  }

  async addLabels() {
    if (!this.id || !this.labels || !this.labels.length) return;

    return new Promise((resolve, reject) => {
      this.confluenceApi.postLabels(this.id, this.labels, data => {
        this.utils.displayInfo("Labels created/updated for page " +
          this.id + ": ", this.labels.map(label => label.name).join(', '));

        resolve(data);
      });
    })
  }

}