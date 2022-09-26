const position = 'data/class/';
const fs = require('fs-extra');
const path = require('path');
const logger = require('../../utils/logger');
const dataRoot = path.resolve(__dirname, '../output');
const versionFilePath = path.resolve(__dirname, dataRoot, 'masterver.json');

class Base {
    _locales = ['en', 'cn'];
    _logger = {};
    _name = 'base';
    _data = {};
    _ver = '';
    _data_root_path = dataRoot;
    _data_path_cn = '';
    _data_path_en = '';

    constructor() {
    }

    initData() {
    }

    _init(name = this._name) {
        this._name = name;
        const _meta = {
            fileName: `${position}${this._name}`,
        }
        this._logger.info = (msg, meta) => {
            logger.info(msg, {
                ..._meta,
                ...meta
            });
        }
        this._logger.error = (err, meta) => {
            logger.error(err, {
                ..._meta,
                ...meta
            });
        }
        this._setVer();
        this.initData();
    }

    _checkLocaleAvailability(locale) {
        if (!this._locales.includes(locale)) {
            return false;
        }
        return true;
    }

    _setVer() {
        this._ver = fs.readJsonSync(versionFilePath);
    }

    get ver() {
        return this._ver;
    }

    setData(data, locale) {
        if (locale && !this._checkLocaleAvailability(locale)) {
            this._logger.error(`Locale ${locale} is not supported`);
            return;
        }
        if (!locale) {
            this._locales.forEach(lang => {
                this._data[lang] = data;
            });
        } else {
            this._data[locale] = data;
        }
    }

    getData(locale = 'en') {
        if (!this._checkLocaleAvailability(locale)) {
            this._logger.error(`Locale ${locale} is not supported`);
            return null;
        }
        return this._data[locale];
    }

    search() {
    }

    getLocales() {
        return this._locales;
    }
}

module.exports = Base;
