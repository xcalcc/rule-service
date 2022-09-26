const path = require('path');
const Standard = require('./Standard');

class Owasp extends Standard {
    _data_path_cn = path.resolve(this._data_root_path, 'owasp_cn.json');
    _data_path_en = path.resolve(this._data_root_path, 'owasp.json');

    constructor(props) {
        super(props);

        // this._addIdPrefix('A');
        this._init('owasp');
    }
}

module.exports = Owasp;
