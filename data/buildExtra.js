const excelToJson = require("convert-excel-to-json");
const fs = require("fs-extra");
const path = require('path');
const transformFormat = require('./output/miscellaneous/transform');
const RuleInfo = require("./class/RuleInfo");
const misraAutosarPlaceholderPath = path.resolve(__dirname, './miscellaneous/output/misra.xlsx');
const misraRulesDataPathEn = path.resolve(__dirname, './miscellaneous/misra_en.json');
const misraRulesDataPathCn = path.resolve(__dirname, './miscellaneous/misra_cn.json');


const transformList = process.env.EXTRA_RULE_FILES && process.env.EXTRA_RULE_FILES.split(',');

const injectPlaceHolderForMisraAutosars = async () => {
    //read xlsx
    const sheetData = excelToJson({
        sourceFile: misraAutosarPlaceholderPath,
        sheets: [
            {
                name: 'Sheet1',
                columnToKey: {A: 'code'}
            },
        ]
    });
    const ruleList = sheetData['Sheet1'] || [];
    let misraDataEn = fs.readJsonSync(misraRulesDataPathEn, {encoding: 'utf8'});
    let misraDataCn = fs.readJsonSync(misraRulesDataPathCn, {encoding: 'utf8'});
    const generatedRuleList = ruleList
        .map(item => {
            item.code = (item.code + '').trim();
            return item;
        })
        .filter(item => item.code !== '')
        .filter(item => !!misraDataEn.find(rule => rule.code !== item.code))
        .map(item => new RuleInfo(item.code).data);
    fs.writeFileSync(misraRulesDataPathEn, JSON.stringify(misraDataEn.concat(generatedRuleList), null, 4), {encoding: 'utf8'});
    fs.writeFileSync(misraRulesDataPathCn, JSON.stringify(misraDataCn.concat(generatedRuleList), null, 4), {encoding: 'utf8'});
}

module.exports = async () => {
    let transformedData = {};
    try {
        transformList.length && transformList.forEach(ruleSetName => {
            const ruleSetInput = path.join(__dirname, './output/miscellaneous/input/', ruleSetName);
            const ruleSetOutput = path.join(__dirname, './output/miscellaneous/');
            const fileToTransformEn = path.resolve(ruleSetInput, 'rules_en.json');
            const fileToTransformCn = path.resolve(ruleSetInput, 'rules_cn.json');
            if (!transformedData.hasOwnProperty(ruleSetName)) {
                transformedData[ruleSetName] = {};
            }
            if (fs.pathExistsSync(fileToTransformEn)) {
                transformedData[ruleSetName][`en`] = transformFormat(fileToTransformEn, path.resolve(ruleSetOutput, `${ruleSetName}_en.json`), ruleSetName);
            }
            if (fs.pathExistsSync(fileToTransformCn)) {
                transformedData[ruleSetName][`cn`] = transformFormat(fileToTransformCn, path.resolve(ruleSetOutput, `${ruleSetName}_cn.json`), ruleSetName);
            }
        });

        // await injectPlaceHolderForMisraAutosars();
    } catch (e) {
        console.error(e);
    } finally {
        console.log(`Finishing building ${transformList} rules`);
        return transformedData;
    }
}