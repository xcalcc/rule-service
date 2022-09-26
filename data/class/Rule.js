const fs = require('fs-extra');
const path = require('path');
const Base = require('./Base');
const RuleSet = require('./RuleSet');
const ruleSet = new RuleSet();

class Rule extends Base {
    _csvCodeMap = {};
    _filteredRules = process.env.FILTERED_RULES && process.env.FILTERED_RULES.split(',') || [];
    _standardIdPrefix = {
        // cwe: 'CWE-',
        // owasp: 'A',
    };
    _miscellaneousFilePath = path.resolve(this._data_root_path, 'miscellaneous');
    _extraRules = process.env.EXTRA_RULE_FILES && process.env.EXTRA_RULE_FILES.split(',');

    constructor(props) {
        super(props);
        this._data_path_cn = path.resolve(this._data_root_path, 'master_cn.json');
        this._data_path_en = path.resolve(this._data_root_path, 'master.json');
        this._init('Rule');
    }

    _setCsvCodeMap(locale) {
        const ruleSetMap = ruleSet.getData(locale);

        let ruleListInRuleSet = [];
        Object.keys(ruleSetMap).forEach(ruleSetCode => {
            ruleListInRuleSet = ruleListInRuleSet.concat(ruleSetMap[ruleSetCode]['rules']);
        });
        const csvCodeMapToIndex = {};

        this._data[locale].forEach((rule, index) => {
            if (rule['csv_string'] && rule['csv_string'].length) {
                rule['csv_string'].forEach(csvStr => {
                    csvCodeMapToIndex[csvStr] = index;
                });
            }
        });
        this._csvCodeMap = csvCodeMapToIndex;
    }

    _addExtraRules(locale) {
        const extraRuleFilePaths = this._extraRules && this._extraRules.map(fileName => path.resolve(this._miscellaneousFilePath, `${fileName}_${locale}.json`));
        let extraRules = [];
        extraRuleFilePaths && extraRuleFilePaths.forEach(filePath => {
            if (fs.pathExistsSync(filePath)) {
                const rules = fs.readJsonSync(filePath, {encode: 'utf8'});
                rules.forEach(rule => {
                    if (!isNaN(Number(rule.master_id))) {
                        rule.master_id = Number(rule.master_id);
                    }
                })
                console.log(`Concatinating extra rules for [${filePath}]`);
                extraRules = extraRules.concat(rules);
            }
        });
        extraRules.forEach(rule => {
            this._csvCodeMap[rule['code']] = rule['master_id'];
        });
        return extraRules;
    }

    get csvCodeMap() {
        return this._csvCodeMap;
    }

    _setDataByLocale(locale) {
        const filePath = locale === 'en' ? this._data_path_en : this._data_path_cn;
        this._dataTempForConsistencyChecking = [];
        const masterData = fs.readJsonSync(filePath);
        const dataToSet = masterData.map(ruleInfo => {
            const masterId = ruleInfo['master_id'];
            //inject ruleSet info
            const ruleSetInfo = ruleSet.indexedByMasterId[`_${masterId}`] || {};
            //inject standards/alias
            ruleSetInfo.standards && Object.keys(ruleSetInfo.standards).forEach(standard => {
                if (!ruleInfo.standards) {
                    ruleInfo.standards = {};
                }
                if (ruleInfo.standards.hasOwnProperty(standard)) {
                    //remove invalid and add prefix
                    if (!!!ruleInfo.standards[standard].trim()) {
                        delete ruleInfo.standards[standard];
                    } else {
                        ruleInfo.standards[standard] = ruleInfo.standards[standard].split(',').map(item =>
                            `${this._standardIdPrefix[standard] || ''}${item.trim()}`);
                    }
                }
            });

            this._dataTempForConsistencyChecking.push({
                ruleInfo,
                ruleSetInfo,
            });

            return {
                ...ruleInfo,
                ...ruleSetInfo,
            }
        });
        const targetList = [
            ...dataToSet,
            ...this._addExtraRules(locale)
        ];
        //filter if is set in .env
        const filtered = targetList.filter(rule => this._filteredRules && !this._filteredRules.includes(rule.code));

        this.setData(filtered, locale);
        this._setCsvCodeMap(locale);
    }

    initData() {
        this._setDataByLocale('en');
        this._setDataByLocale('cn');
    }

    searchByRuleSetId(ruleSetId, locale = 'en') {
        // return this._data[locale];
    }

    static report(ruleList) {
        const reportPath = path.resolve(__dirname, '../../report/rule_list_report.txt');
        fs.ensureFileSync(reportPath);
        const misraCodes = ruleList.filter(rule => rule.ruleSet && rule.ruleSet.id === 'M');

        let dataToWrite = `Reported on ${new Date()}\n`;
        dataToWrite = dataToWrite.concat(`\nRule list Summary total: ${ruleList.length}`);
        //misra
        const misraReady = misraCodes.filter(rule => !rule.status);
        dataToWrite = dataToWrite.concat(`\n---Misra/Autosar ready (${misraReady.length})---\n`);
        misraReady.forEach(rule => {
            dataToWrite = dataToWrite.concat(`${rule.code} => (csv_string) ${rule.csv_string.join(',')}\n`);
        });

        const misraPending = misraCodes.filter(rule => rule.status && rule.status === 'pending');
        dataToWrite = dataToWrite.concat(`\n---Misra/Autosar pending  (${misraPending.length})---\n`);
        misraPending.forEach(rule => {
            dataToWrite = dataToWrite.concat(`${rule.code} => (csv_string) ${rule.csv_string.join(',')}\n`);
        });

        const certCodes = ruleList.filter(rule => rule.ruleSet && rule.ruleSet.id === 'S');
        dataToWrite = dataToWrite.concat(`\n---CERT related (${certCodes.length})---\n`);
        certCodes.forEach(rule => {
            dataToWrite = dataToWrite.concat(`${rule.code} => (csv_string) ${rule.csv_string.join(',')}\n`);
        });

        const builtinCodes = ruleList.filter(rule => rule.ruleSet && rule.ruleSet.id === 'X');
        dataToWrite = dataToWrite.concat(`\n---BUILTIN related (${builtinCodes.length})---\n`);
        builtinCodes.forEach(rule => {
            dataToWrite = dataToWrite.concat(`${rule.code} => (csv_string) ${rule.csv_string.join(',')}\n`);
        });

        const noRuleSetCodes = ruleList.filter(rule => !rule.ruleSet || !['M', 'S', 'X'].includes(rule.ruleSet.id));
        dataToWrite = dataToWrite.concat(`\n---No ruleSet associated (${noRuleSetCodes.length})---\n`);
        noRuleSetCodes.forEach(rule => {
            dataToWrite = dataToWrite.concat(`${rule.code} => (csv_string) ${rule.csv_string ? rule.csv_string.join(',') : 'N/A'}\n`);
        });

        fs.writeFileSync(reportPath, dataToWrite, {encoding: 'utf8'});
    }
}

module.exports = Rule;
