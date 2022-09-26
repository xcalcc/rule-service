const fs = require('fs-extra');
const configs = require('../configs');
const Base = require('./Base');

class RuleSet extends Base {
    _RULE_SETS = configs.ruleSets
    _indexedBy = {}
    _ruleSetMap = {}

    constructor(props) {
        super(props);
        this._init('RuleSet');
        this._setRuleSetMapByRuleSetId();
    }

    _setRuleSetMapByRuleSetId() {
        this._RULE_SETS.forEach(ruleSet => {
            if (!this._ruleSetMap.hasOwnProperty(ruleSet.id)) {
                this._ruleSetMap[ruleSet.id] = ruleSet;
            }
        });
    }

    getRuleSetMap(ruleSetId) {
        return this._ruleSetMap[ruleSetId];
    }

    _setData() {
        let merged = {};
        this._RULE_SETS.forEach(RULESET => {
            if (!RULESET.dataPath) {
                return;
            }
            let rules = fs.readJsonSync(RULESET.dataPath);
            rules = rules.map(rule => {
                const handled = {
                    ...rule,
                    ruleSetId: RULESET.id,
                    ruleSet: {...RULESET}
                };
                delete handled.ruleSet.dataPath;
                return handled;
            });

            merged[RULESET.id] = {
                ...RULESET,
                rules,
            };
        });
        this._index(merged);
        this.setData(merged);
    }

    initData() {
        this._setData();
    }

    get indexedByCsvCode() {
        return this._indexedBy['csv_code'];
    }

    get indexedByMasterId() {
        return this._indexedBy['master_id'];
    }

    _index(data) {
        this._indexedBy['csv_code'] = {};
        this._indexedBy['master_id'] = {};
        for (let ruleSet in data) {
            data[ruleSet] && data[ruleSet]['rules'].forEach(rule => {
                const masterId = rule['master_id'];
                const csvStr = rule['csv_string'];

                if (this._indexedBy['master_id'].hasOwnProperty(`_${masterId}`)) {
                    const ruleObj = this._indexedBy['master_id'][`_${masterId}`];
                    ruleObj['csv_string'].push(csvStr);
                    ruleObj['standards'] && Object.keys(ruleObj['standards']).forEach(standardCode => {
                        if(rule['standards'] && rule['standards'][standardCode]) {
                            const value = rule['standards'][standardCode].split(',');
                            ruleObj['standards'][standardCode] = ruleObj['standards'][standardCode].concat(value);
                            //dedup
                            const set = new Set(ruleObj['standards'][standardCode]);
                            ruleObj['standards'][standardCode] = Array.from(set);
                        }
                    });
                    ruleObj['alias'] && Object.keys(ruleObj['alias']).forEach(aliasCode => {
                        if(rule['alias'] && rule['alias'][aliasCode]) {
                            const value = rule['alias'][aliasCode].split(',');
                            ruleObj['alias'][aliasCode] = ruleObj['alias'][aliasCode].concat(value);
                            //dedup
                            const set = new Set(ruleObj['alias'][aliasCode]);
                            ruleObj['alias'][aliasCode] = Array.from(set);
                        }
                    });
                } else {
                    let standards = {};
                    let alias = {};
                    rule.standards && Object.keys(rule.standards).forEach(standardName => {
                        rule.standards[standardName] && (standards[standardName] = rule.standards[standardName].split(','));
                    });
                    rule.alias && Object.keys(rule.alias).forEach(aliasName => {
                        rule.alias[aliasName] && (alias[aliasName] = rule.alias[aliasName].split(','));
                    });
                    this._indexedBy['master_id'][`_${masterId}`] = {
                        csv_string: [csvStr],
                        severity: rule['severity'],
                        likelihood: rule['likelihood'],
                        cost: rule['cost'],
                        standards,
                        alias,
                        ruleSet: {
                            id: data[ruleSet].id,
                            code: data[ruleSet].code,
                            displayName: data[ruleSet].displayName,
                        }
                    }
                }
                this._indexedBy['csv_code'][csvStr.toLowerCase()] = {
                    masterId: masterId,
                    ruleSet: {
                        id: data[ruleSet].id,
                        code: data[ruleSet].code,
                        displayName: data[ruleSet].displayName,
                    }
                };
            });
        }
        // this._logger.info('Finish index rules by csv code');
    }
}

module.exports = RuleSet;
