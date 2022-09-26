const Validator = require('jsonschema').Validator;
const logger = require('../utils/logger');
const {gzip, ungzip} = require('node-gzip');
const v = new Validator();
const Schema = require('../data/validation/schemas');
const customRuleInfoSchema = Schema.customRuleInfoSchema;
v.addSchema(Schema.customRuleSchema, '/CustomRule');
v.addSchema(Schema.pathMsgListSchema, '/PathMsgListSchema');
v.addSchema(Schema.pathMsgSchema, '/PathMsgSchema');

const path = require('path');
const fs = require('fs-extra');
const customRuleFilePath = path.resolve(__dirname, '../data/custom');

module.exports = {
    extractRulesFromStandard(standardName, ruleList) {
        if(!standardName) return ruleList;
        return ruleList.filter(rule => !!(rule.hasOwnProperty(standardName) && rule[standardName]));
    },

    customRule: {
        validate(customRuleData) {
            const validateResult = v.validate(customRuleData, customRuleInfoSchema);
            if (validateResult.valid) {
                return {
                    success: true
                }
            }
            return {
                success: false,
                errors: validateResult.errors
            }
        },
        async writeToFile(projectId, json) {
            const compressed = await gzip(JSON.stringify(json));
            const filePath = path.resolve(customRuleFilePath, `${projectId}.gz`);
            fs.ensureFileSync(filePath);
            fs.writeFileSync(filePath, compressed);
            // fs.writeJsonSync(path.resolve(customRuleFilePath,`${projectId}.json`), json);
            logger.info(`Write custom rule [${projectId}] success`);
        },
        async readCustomRuleByProjectId(projectId) {
            const dataFilePath = path.resolve(customRuleFilePath, `${projectId}.gz`);
            const exists = fs.pathExistsSync(dataFilePath);
            if (!exists) {
                logger.error(`No custom rule for [${projectId}] found`);
                return {
                    rules: []
                };
            }
            const decompressed = await ungzip(fs.readFileSync(dataFilePath));
            return JSON.parse(decompressed.toString());
        }
    }
}