const path = require('path');
const Standard = require('./Standard');

class Autosar extends Standard {
    _data_path_cn = path.resolve(this._data_root_path, 'autosar_cn.json');
    _data_path_en = path.resolve(this._data_root_path, 'autosar.json');

    constructor(props) {
        super(props);
        this._init('autosar');
    }
}

module.exports = Autosar;
