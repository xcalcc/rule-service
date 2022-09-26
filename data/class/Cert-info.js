const path = require('path');
const Standard = require('./Standard');

class CertInfo extends Standard {
    _data_path_cn = path.resolve(this._data_root_path, 'cert-info_cn.json');
    _data_path_en = path.resolve(this._data_root_path, 'cert-info.json');

    constructor(props) {
        super(props);
        this._init('cert');
    }

    _injectCsvCodes(locale) {
        const data = this._data[locale];
        const dataMap = {};
        const ruleList = this._rule.getData(locale);
        Object.keys(data).forEach(code => {
            let csv_codes = [];
            ruleList.forEach(rule => {
                const codes = rule.alias && rule.alias[this._name] || [];

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
}

module.exports = CertInfo;
