const path = require('path');
const generateMapsForRuleSetAndStandards = require('./scripts/standardsMapToCertAndBuiltin');
const RuleList = require("../data/class/Rule");
const ruleList = new RuleList();
const outputPath = path.resolve(__dirname, './');

const getRuleList = () => {

    return ruleList.getData('en');
}

generateMapsForRuleSetAndStandards(getRuleList(), ['cwe', 'owasp', 'p3c-sec'], outputPath);
