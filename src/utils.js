const
  fs = require('fs'),
  colors = require('colors'),
  klaw = require('klaw'),
  path = require('path');

export default class Utils {

  async readFile(path) {

    return new Promise(function (resolve, reject) {
      fs.readFile(path, 'utf8', function (err, data) {

        if (err) {
          reject(err)
        }

        resolve(data);

      });
    });
  }

  scanMarkdowns(directory) {

    const files = [];
    
    return new Promise( (resolve, reject) => {
      klaw(directory)
        .on('data', item => {

          if (path.extname(item.path) !== ".md") {
            return;
          }

          files.push(item.path);

        })
        .on('end', () => resolve(files))
        .on('error', () => reject)
    });

  }

  displayError(message, values = null) {

    if (!values) {
      values = "";
    }

    console.error(colors.red(String.fromCharCode("0x2718") + " " + message), colors.bold(values));

  }

  displaySuccess(message, values = null) {

    if (!values) {
      values = "";
    }

    console.info(colors.green(String.fromCharCode("0x2705") + " " + message), colors.bold(values));

  }

  displayInfo(message, values = null) {

    if (!values) {
      values = "";
    }

    console.info(colors.yellow(String.fromCharCode("0x2705") + " " + message), colors.bold(values));

  }

}