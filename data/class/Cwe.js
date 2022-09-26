const path = require('path');
const Standard = require('./Standard');

class Cwe extends Standard {
    _data_path_cn = path.resolve(this._data_root_path, 'cwe_cn.json');
    _data_path_en = path.resolve(this._data_root_path, 'cwe.json');

    constructor(props) {
        super(props);
        // this._addIdPrefix('CWE-');
        this._init('cwe');
    }
}

module.exports = Cwe;
