const fs = require('fs-extra');
const path = require('path');

const mapRulesToStandardsCodes = (ruleList, standards) => {
    let map = [];
    for (let rule of ruleList) {
        if (!rule.ruleSet || (rule.ruleSet.id !== 'X' && rule.ruleSet.id !== 'S')) continue;
        if (!rule.standards) continue;
        let record = [rule.code, rule.ruleSet.displayName];
        for (let standard of standards) {
            if (!rule.standards.hasOwnProperty(standard)) continue;
            if (!rule.standards[standard].length) continue;
            record.push([rule.standards[standard].join(';')]);
        }
        map.push(record);
    }
    return map;
}

const generateCsv = (arrData, opts) => {
    const delimiter = ',';
    let outputStr = opts.fields && opts.fields.join(delimiter);
    arrData.forEach(line => {
        outputStr = outputStr.concat(`\n${line.join(delimiter)}`);
    })
    return outputStr;
}

module.exports = (ruleList, standards = ['cwe'], outputFilePath = './') => {
    const outputPath = path.resolve(__dirname, path.resolve(outputFilePath, './standardsMapToRules.csv'));
    console.log(`Generating csv for standards mapping to ${outputPath}`);

    const opts = {fields: ['Rule code', 'RuleSet']};
    standards.forEach(standard => {
        opts.fields.push(`${standard.toUpperCase()} code(s)`);
    });
    const csvData = mapRulesToStandardsCodes(ruleList, standards);
    console.log(`CsvJsonData to write:`, csvData);
    try {
        const csv = generateCsv(csvData, opts);
        console.log('Generate csv successfully from json', csv);

        fs.writeFileSync(outputPath, csv, {encoding: 'utf8'});
    } catch (err) {
        console.error(err);
    }
}

