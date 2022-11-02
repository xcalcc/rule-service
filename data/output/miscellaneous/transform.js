const path = require('path');
require('dotenv').config({path: '.env'});
const fs = require('fs-extra');
const {ruleSets} = require('../../configs');
const logOutputPath = path.resolve(__dirname, './transformLogs');
fs.ensureDirSync(logOutputPath);

let log = [];

const correctExamples = data => {
    if (data.examples) {
        data.examples.good && Object.keys(data.examples.good).forEach(lang => {
            if (!Array.isArray(data.examples.good[lang])) {
                log.push(`[${data.code}] Good example in [${data.code}] - ${lang} is not array, converting...`);
                data.examples.good[lang] = [data.examples.good[lang]];
            }
        });
        data.examples.bad && Object.keys(data.examples.bad).forEach(lang => {
            if (!Array.isArray(data.examples.bad[lang])) {
                log.push(`[${data.code}] Bad example in [${data.code}] - ${lang} is not array, converting...`);
                data.examples.bad[lang] = [data.examples.bad[lang]];
            }
        });
    }
    return data;
}
const deleteMasterId = data => {
    if (data.master_id) {
        log.push(`[${data.code}] fake out master id "${data.master_id}"`);
        delete data.master_id;
    }
}
const addAliasBlock = data => {
    if (!data.hasOwnProperty('alias')) {
        log.push(`[${data.code}] alias field not found create one`);
        data.alias = {};
    }
}
const addStandardsBlock = data => {
    if (!data.hasOwnProperty('standards')) {
        log.push(`[${data.code}] standards field not found create one`);
        data.standards = {};
    }
}
const addMisraStandardsBlock = data => {
    //mc - misra c
    //mcpp - misra cpp
    const regMc = new RegExp(/msr(_\d*){2}$/i);
    const regMcpp = new RegExp(/msr(_\d*){3}$/i);

    if (!data.hasOwnProperty('standards')) {
        log.push(`[${data.code}] standards field not found create one for misra`);
        data.standards = {};
    }
    if (regMc.test(data.code)) {
        data.standards.mc = [data.code];
        delete data.standards.mcpp;
    }
    if (regMcpp.test(data.code)) {
        data.standards.mcpp = [data.code];
        delete data.standards.mc;
    }
}
const addCsvString = data => {
    if (!data.hasOwnProperty('csv_string')) {
        log.push(`[${data.code}] csv_string field not found, use code as csv string`);
        data.csv_string = [data.code];
    } else if (Array.isArray(data.csv_string) && !data.csv_string.includes(data.code)) {
        log.push(`[${data.code}] csv_string found, also make sure rule code in csv string`);
        data.csv_string.push(data.code);
    }
}
const addRuleSet = (data, rulesetName) => {
    const ruleSetObj = ruleSets.find(ruleset => ruleset.displayName.toLowerCase() === rulesetName);
    if (!data.hasOwnProperty('ruleSet') && ruleSetObj) {
        log.push(`[${data.code}] ruleset not found, adding ${JSON.stringify(rulesetName)}`);
        data.ruleSet = ruleSetObj;
    }
}
const replaceNameWithDescription = data => {
    if (data.name === data.code) {
        log.push(`[${data.code}] Rule name for [${data.code}] is same as code`);
        data.name = data.desc;
    }
}
const transform = (data, rulesetName) => {
    correctExamples(data);
    addAliasBlock(data);
    const rsn = rulesetName.toLowerCase();
    if (rsn === 'misra') {
        addMisraStandardsBlock(data);
    } else {
        addStandardsBlock(data);
    }
    addCsvString(data);
    deleteMasterId(data);

    addRuleSet(data, rsn);
    replaceNameWithDescription(data);
    return data;
}

module.exports = (dataFilePath, outputPath, ruleSet) => {
    let dataList = [];
    if (fs.pathExistsSync(dataFilePath)) {
        dataList = fs.readJsonSync(dataFilePath, {encoding: 'utf8'});
        fs.writeFileSync(path.join(__dirname, `${ruleSet}_backup`), JSON.stringify(dataList, null, 2), {encoding: 'utf8'});
        dataList.forEach(data => {
            transform(data, ruleSet);
        });
        fs.writeFileSync(outputPath, JSON.stringify(dataList, null, 2), {encoding: 'utf8'});
    }
    fs.writeFileSync(path.resolve(logOutputPath, `${ruleSet}_transform.log`), log.join('\n'), {encoding: 'utf8'});
    return {
        counts: dataList.length,
        codes: dataList.map(data => data.code)
    };
}
