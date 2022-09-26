const excelToJson = require('convert-excel-to-json');

module.exports = {
    parseBuffer: buffer => {
        const json = excelToJson({
            source: buffer
        });
        const sheets = {};
        for(const sheetName in json) {
            const sheetData = json[sheetName];
            const headers = sheetData[0];
            const records = [];
            for(let i=1; i < sheetData.length-1; i++) {
                const item = {};
                for(const property in sheetData[i]) {
                    const headerLabel = headers[property];
                    item[headerLabel] = sheetData[i][property] || null;
                }
                records.push(item);
            }
            sheets[sheetName] = records;
        }

        return sheets;
    },
    parseFile: fileUrl => {
        return excelToJson({
            sourceFile: fileUrl
        });
    },
    indexedByRuleCode: ruleList => {
        const output = {};
        for(let item of ruleList) {
            output[item.rule_code] = item;
        }
        return output;
    }
}