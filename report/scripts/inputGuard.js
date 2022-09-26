/**
 * Script to validate new generated rule data and generate diff and reports
 *
 */
const fs = require('fs-extra');
const path = require('path');
const jsonDiff = require('json-diff');
const Validator = require('jsonschema').Validator;

const schemas = require('../../data/validation/schemas');
const v = new Validator();

const ruleListCurrentPath = path.resolve(__dirname, '../../data/directServe/rule-list.json');
const ruleSetsCurrentPath = path.resolve(__dirname, '../../data/directServe/rule-sets.json');
const ruleStandardCurrentPath = path.resolve(__dirname, '../../data/directServe/standards.json');

const ruleListCurrentNewPath = path.resolve(__dirname, '../../data/directServe/rule-list-new.json');
const ruleSetsCurrentNewPath = path.resolve(__dirname, '../../data/directServe/rule-sets-new.json');
const ruleStandardCurrentNewPath = path.resolve(__dirname, '../../data/directServe/standards-new.json');

const validateData = (data, schema, extraSchema) => {
    if (extraSchema) {
        v.addSchema(extraSchema.schema, extraSchema.uri);
    }
    return v.validate(data, schema);
}

const compareWithOldData = (oldData, newData) => {
    return jsonDiff.diffString(oldData, newData);
}

const testAndGenerateReport = () => {
    let diffRuleList = [], diffRuleSetList, diffRuleStandardList;
    if (fs.pathExistsSync(ruleListCurrentNewPath)) {
        const oldRuleData = fs.readJsonSync(ruleListCurrentPath, {encoding: 'utf8'});
        const newRuleData = fs.readJsonSync(ruleListCurrentNewPath, {encoding: 'utf8'});

        const validateResult = validateData(newRuleData.rules, schemas.ruleListSchema, {
            schema: schemas.ruleSchema,
            uri: '/RuleSchema'
        });
        if (validateResult.valid) {
            diffRuleList = compareWithOldData(oldRuleData, newRuleData);
        } else {
            console.error(`Validation failed: ${validateResult.errors}`);
        }
    }
    if (fs.pathExistsSync(ruleListCurrentNewPath)) {
        const oldRuleListData = fs.readJsonSync(ruleSetsCurrentPath, {encoding: 'utf8'});
        const newRuleListData = fs.readJsonSync(ruleSetsCurrentNewPath, {encoding: 'utf8'});
        diffRuleSetList = compareWithOldData(oldRuleListData, newRuleListData);
    }
    if (fs.pathExistsSync(ruleListCurrentNewPath)) {
        const oldRuleStandardData = fs.readJsonSync(ruleStandardCurrentPath, {encoding: 'utf8'});
        const newRuleStandardData = fs.readJsonSync(ruleStandardCurrentNewPath, {encoding: 'utf8'});
        diffRuleStandardList = compareWithOldData(oldRuleStandardData, newRuleStandardData);
    }
    console.log('Diff in rule list:', diffRuleList);
    console.log('Diff in rule set list:', diffRuleSetList);
    console.log('Diff in rule standard list:', diffRuleStandardList);

}

// testAndGenerateReport();

module.exports = {
    validateData,
    compareWithOldData,
    testAndGenerateReport,
}

