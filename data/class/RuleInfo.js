// Rule info class as a constructor for rule instance in rule list

class RuleInfo {
    _schema = {
        // "master_id": 'number',
        "category": 'string',
        "language": 'string',
        "code": 'string',
        "name": 'string',
        "desc": 'string',
        "msg_templ": 'string',
        "severity": 'string',
        "likelihood": 'string',
        "cost": 'string',
        "details": 'string',
        "examples": 'object',
        "standards": 'object',
        "csv_string": 'array',
        "alias": 'object',
        "ruleSet": 'object',
    };
    _data = {};

    constructor(data, status) {
        Object.keys(this._schema).forEach(key => {
            switch (this._schema[key]) {
                case 'string':
                    this._data[key] = '';
                    break;
                case 'array':
                    this._data[key] = [];
                    break;
                case 'object':
                    this._data[key] = {};
                    break;
                case 'number':
                    this._data[key] = null;
                    break;
                default:
                    break;
            }
        });
        this._data = {
            ...this._data,
            ...data
        };
        if (status) {
            this._data.status = status;
        }
    }

    get data() {
        return this._data;
    }
}

module.exports = RuleInfo;
