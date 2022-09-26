const fs = require('fs-extra');
const Base = require('./Base');
const Rule = require('./Rule');
const rule = new Rule();

class Standard extends Base {
    _data_path_cn = '';
    _data_path_en = '';
    _idPrefix = '';
    _rule = rule;

    constructor(props) {
        super(props);
    }

    _addIdPrefix(prefix) {
        this._idPrefix = prefix;
    }

    _setDataByLocale(locale) {
        const filePath = locale === 'en' ? this._data_path_en : this._data_path_cn;

        this.setData(fs.readJsonSync(filePath), locale);
    }
    _injectCsvCodes(locale) {
        const data = this._data[locale];
        const dataMap = {};
        const ruleList = rule.getData(locale);
        Object.keys(data).forEach(code => {
            let csv_codes = [];
            ruleList.forEach(rule => {
                const codes = rule.standards && rule.standards[this._name] || [];

                if (code && codes.includes(code)) {
                    csv_codes = rule.csv_string && csv_codes.concat(rule.csv_string) || csv_codes;
                }
            });
            dataMap[code] = {
                ...data[code],
                csv_codes: [...new Set(csv_codes)],
            };
        });
        this.setData(dataMap, locale);
    }

    initData() {
        this._setDataByLocale('en');
        this._injectCsvCodes('en');
        this._setDataByLocale('cn');
        this._injectCsvCodes('cn');
    }

}

module.exports = Standard;
