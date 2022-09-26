const path = require('path');
const Standard = require('./Standard');

class P3CSec extends Standard {
    _data_path_cn = path.resolve(this._data_root_path, 'p3c-sec_cn.json');
    _data_path_en = path.resolve(this._data_root_path, 'p3c-sec.json');

    constructor(props) {
        super(props);
        this._init('p3c-sec');
    }
}

module.exports = P3CSec;
