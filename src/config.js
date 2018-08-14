import Utils from "./utils";

export class Config {

  constructor(file) {

    this.utils = new Utils();
    
    if(! Config.instance){
      this.load(file);
      
      Config.instance = this;
    }

    return Config.instance;
  }

  load(file) {

    if (!file) {
      return this.utils.displayError("Error: You must specify the configuration file with the parameter '--config=/path/configuration.json'");
    }

    try {

      this._data = require(file);


    } catch (e) {

      return this.utils.displayError("Error: The specified configuration file was not found.", e);

    }
    
  }

  setPassword(password) {
    this._data.confluence.password = password;
  }

  data() {
    return this._data;
  }

  isValid() {
    const
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
      missing = [];

    let splittedKey;

    required.forEach( key => {

      splittedKey = key.split(".");

      if (splittedKey.length === 1) {
        !this._data[key] ? missing.push(key) : missing;
      } else if (splittedKey.length === 2) {
        !this._data[splittedKey[0]][splittedKey[1]] ? missing.push(key) : missing;
      }

    });

    if (missing.length) {

      this.utils.displayError("Configuration ist not valid! Keys missing: ", missing.join(", "));

    }

    return missing.length === 0;
  }
}