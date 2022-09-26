const fs = require('fs-extra');
const path = require('path');
const Base = require('./Base');

class PathMsg extends Base {
    constructor(props) {
        super(props);
        this._data_path_cn = path.resolve(this._data_root_path, 'pathmsg_cn.json');
        this._data_path_en = path.resolve(this._data_root_path, 'pathmsg.json');
        this._init('PathMsg');
    }

    _setDataByLocale(locale) {
        const filePath = locale === 'en' ? this._data_path_en : this._data_path_cn;
        const pathMsgData = fs.readJsonSync(filePath);
        this.setData(pathMsgData, locale);
    }

    initData() {
        this._setDataByLocale('en');
        this._setDataByLocale('cn');
    }

}

module.exports = PathMsg;
