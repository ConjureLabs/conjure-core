const log = require('conjure-core/modules/log')('repo conjure config');

const internalDefinition = Symbol('parsed input object definition');
const singleLanguageKey = Symbol('get single language being used');

class Config {
  constructor(ymlInput) {
    const yaml = require('node-yaml');

    try {
      this[internalDefinition] = yaml.parse(ymlInput);
    } catch(err) {
      log.error(err);
      this.valid = false;
      return;
    }

    this.valid = true
    this.machine = new MachineConfig(this[internalDefinition]);
  }
}

class MachineConfig {
  constructor(config) {
    this[internalDefinition] = config.machine;
  }

  get environment() {
    return this[internalDefinition].environment || {};
  }

  // todo: possibly check for files like podfile or package.json and determine language, dynamically, for better ux
  get languages() {
    return this[internalDefinition].languages || {};
  }

  // todo: possibly use $PORT or something similar?
  get port() {
    return this[internalDefinition].port;
  }

  get pre() {
    const definedPre = this[internalDefinition].pre;
    return Array.isArray(definedPre) ? definedPre :
      typeof definedPre === 'string' ? [definedPre] :
      [];
  }

  get setup() {
    if (this[internalDefinition].setup) {
      return this[internalDefinition].setup;
    }

    const lang = this[singleLanguageKey]();

    switch (lang) {
      case 'node':
        return 'npm install';
        break;

      case 'java':
        break;

      default:
        return null;
    }
  }

  get start() {
    if (this[internalDefinition].start) {
      return this[internalDefinition].start;
    }

    const lang = this[singleLanguageKey]();

    switch (lang) {
      case 'node':
        return 'npm start';
        break;

      default:
        return null;
    }
  }

  [singleLanguageKey]() {
    const languagesUsing = Object.keys(this.languages);

    if (!languagesUsing.length || languagesUsing.length > 1) {
      return null;
    }

    return languagesUsing[0].toLowerCase();
  }
}

module.exports = Config;
