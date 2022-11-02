const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const ExcelJS = require('exceljs');
const outputDetailPath = path.resolve(__dirname, './temp');
const configs = require('./configs');
fs.ensureDirSync(outputDetailPath);
//run one time
const extractDetailsToFile = async (masterFilePath = path.resolve(__dirname, './raw/RuleSetMaster.xlsx')) => {
    try {
        await fs.emptyDir(outputDetailPath);
        const masterWorkbook = new ExcelJS.Workbook();
        await masterWorkbook.xlsx.readFile(masterFilePath);
        const workSheet = masterWorkbook.getWorksheet('Rule Master');
        workSheet.eachRow((row, rowNum) => {
            const ruleCode = row.getCell('F').value.trim();
            const ruleCodeDetailPath = `${outputDetailPath}/${ruleCode}`;

            const writeDetails = () => {
                const detailFileEn = `${ruleCodeDetailPath}/details_en.md`;
                const detailFileCn = `${ruleCodeDetailPath}/details_cn.md`;
                fs.ensureFileSync(detailFileEn);
                fs.ensureFileSync(detailFileCn);
                const ruleDetailsEn = row.getCell('K').value;
                const ruleDetailsCn = row.getCell('L').value;

                fs.writeFileSync(detailFileEn, typeof ruleDetailsEn === 'string' ? ruleDetailsEn.replace(/\\n/gm, os.EOL) : '');
                fs.writeFileSync(detailFileCn, typeof ruleDetailsCn === 'string' ? ruleDetailsCn.replace(/\\n/gm, os.EOL) : '');
            }

            const writeMsgTempl = () => {
                const ruleMsgTempEn = row.getCell('M').value;
                const ruleMsgTempCn = row.getCell('N').value;
                const msgTemplFileEn = `${ruleCodeDetailPath}/msg_template_en.txt`;
                const msgTemplFileCn = `${ruleCodeDetailPath}/msg_template_cn.txt`;
                fs.ensureFileSync(msgTemplFileEn);
                fs.ensureFileSync(msgTemplFileCn);

                fs.writeFileSync(msgTemplFileEn, typeof ruleMsgTempEn === 'string' ? ruleMsgTempEn.replace(/\\n/gm, os.EOL) : '');
                fs.writeFileSync(msgTemplFileCn, typeof ruleMsgTempCn === 'string' ? ruleMsgTempCn.replace(/\\n/gm, os.EOL) : '');
            }

            const writeExamples = () => {
                // const languages = row.getCell('C').value;
                // const filteredLangs = languages && languages.split(',').filter(lang => {
                //     return !!configs.supportedProgrammingLang.includes(lang);
                // }) || [];
                Object.keys(configs.supportedProgrammingFileExt).forEach(ext => {
                    const goodExpFilePath = `${ruleCodeDetailPath}/example_good.${ext}`;
                    const badExpFilePath = `${ruleCodeDetailPath}/example_bad.${ext}`;
                    fs.ensureFileSync(goodExpFilePath);
                    fs.ensureFileSync(badExpFilePath);
                    //write good example
                    fs.writeFileSync(goodExpFilePath, '');
                    //write bad example
                    fs.writeFileSync(badExpFilePath, '');
                });
            }
            //ignore header
            if (rowNum > 1 && ruleCode !== "reserved") {
                writeMsgTempl();
                // writeDetails();
                // writeExamples();
            }
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports = extractDetailsToFile;
