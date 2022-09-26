const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const Validator = require('jsonschema').Validator;
const v = new Validator();
const Schema = require('./schemas');
const dataConfigs = require('../configs');
const jsonDataPath = path.resolve(__dirname, '../output');
const rawDataPath = path.resolve(__dirname, '../raw');
const reportPath = path.resolve(__dirname, '../report/rule');

const rulesInBltin = fs.readJsonSync(path.resolve(jsonDataPath, 'blt.json'), {encode: 'utf8'});
const rulesInCert = fs.readJsonSync(path.resolve(jsonDataPath, 'cert.json'), {encode: 'utf8'});

const masterJson = fs.readJsonSync(path.resolve(jsonDataPath, 'master.json'), {encode: 'utf8'});

const rulesInRuleSets = rulesInBltin.map(rule => ({
    ...rule,
    ruleSet: 'Bultin'
})).concat(rulesInCert.map(rule => ({...rule, ruleSet: 'Cert'})));

const reportFilePath = path.resolve(reportPath, `./validation_report_${moment().format('YYYY-MM-DD')}.txt`);

let summary = {
    failedFiles: [],
    report: {
        noCoreCodeFound: [],
        noDetailFolder: [],
        notYetImplemented: [],
        cnContentEmpty: [],
        enContentEmpty: [],
        cnDetailFileMissing: [],
        enDetailFileMissing: [],
        noContentInBadExamples: [],
        noContentInGoodExamples: [],
    }
};

const dataConfig = [
    {
        name: 'ruleset-blt',
        filePaths: [path.resolve(jsonDataPath, './blt.json')],
        schema: Schema.ruleSetsSchema,
        extraSchema: [{schema: Schema.ruleSetSchema, uri: '/RuleSetSchema'}],
    },
    {
        name: 'ruleset-cert',
        filePaths: [path.resolve(jsonDataPath, './cert.json')],
        schema: Schema.ruleSetsSchema,
        extraSchema: [{schema: Schema.ruleSetSchema, uri: '/RuleSetSchema'}],
    },
    {
        name: 'standard-cwe',
        filePaths: [
            path.resolve(jsonDataPath, './cwe.json'),
            path.resolve(jsonDataPath, './cwe_cn.json'),
        ],
        schema: Schema.cweListSchema,
        extraSchema: [{schema: Schema.cweSchema, uri: '/CweSchema'}],
    },
    {
        name: 'standard-owasp',
        filePaths: [
            path.resolve(jsonDataPath, './owasp.json'),
            path.resolve(jsonDataPath, './owasp_cn.json'),
        ],
        schema: Schema.owaspListSchema,
        extraSchema: [{schema: Schema.owaspSchema, uri: '/OwaspSchema'}],
    },
    {
        name: 'standard-p3cSec',
        filePaths: [
            path.resolve(jsonDataPath, './p3c-sec.json'),
            path.resolve(jsonDataPath, './p3c-sec_cn.json'),
        ],
        schema: Schema.p3cSecListSchema,
        extraSchema: [{schema: Schema.p3cSecSchema, uri: '/P3cSecSchema'}],
    },
    {
        name: 'cert-info',
        filePaths: [
            path.resolve(jsonDataPath, './cert-info.json'),
            path.resolve(jsonDataPath, './cert-info_cn.json'),
        ],
        schema: Schema.certInfoListSchema,
        extraSchema: [{schema: Schema.certInfoSchema, uri: '/CertInfoSchema'}],
    },
    {
        name: 'Rule Master',
        filePaths: [
            path.resolve(jsonDataPath, './master.json'),
            path.resolve(jsonDataPath, './master_cn.json'),
        ],
        schema: Schema.masterRuleSchema,
        extraSchema: [{schema: Schema.ruleSchema, uri: '/RuleSchema'}],
    },
    {
        name: 'Path Message',
        filePaths: [
            path.resolve(jsonDataPath, './pathmsg.json'),
            path.resolve(jsonDataPath, './pathmsg_cn.json'),
        ],
        schema: Schema.pathMsgListSchema,
        extraSchema: [{schema: Schema.pathMsgSchema, uri: '/PathMsgSchema'}],
    },
];

const validateFile = (filePath, schema) => {
    let fileData;
    try {
        if (!fs.pathExistsSync(filePath)) {
            writeToReport(`Error: File ${filePath} not found, skip validation`);
            return {
                file: path.basename(filePath),
                path: filePath,
                passed: false
            };
        }
        fileData = fs.readJsonSync(filePath, {encode: 'utf8'});
        const validateResult = v.validate(fileData, schema);
        if (validateResult.valid) {
            writeToReport(`[Passed] ${filePath}`);
            return {
                file: path.basename(filePath),
                path: filePath,
                passed: true
            };
        } else {
            validateResult.errors.length &&
            writeToReport(`[Failed] ${filePath}`);
            writeToReport(`Error: Validate error for ${filePath}, errors: ${validateResult.errors}`);
            const errorMsgs = validateResult.errors.map(error => {
                const code = fileData[error.path[0]].code || fileData[error.path[0]].csv_string;
                if (code) {
                    return `${error.property.replace(/instance\[\d*\]/, code)} ${error.message}, but ${error.instance}`;
                }
                return error.stack;
            });
            summary.failedFiles.push({
                file: path.basename(filePath),
                errors: errorMsgs
            });
            return {
                file: path.basename(filePath),
                path: filePath,
                passed: false,
                errors: validateResult.errors.map(error => error.stack).join('|')
            };
        }
    } catch (e) {
        writeToReport(`Error: Validate error for ${filePath}, errors: ${e}`);
        return {
            file: path.basename(filePath),
            path: filePath,
            passed: false,
            errors: [e]
        };
    }
}

/**
 * @Deprecated
 * Master table holding the severity/likelihood/cost is in accurate as each column is holding only a rule code in code string (as group)
 * Validate data consistency between master file and normalized table
 * Take normalized table as compare base
 */
const consistencyChecking = () => {
    console.log('Severity/Likelihood/Cost consistency checking starts...');
    fs.writeFileSync(consistencyFilePath, '');
    fs.appendFileSync(consistencyFilePath, `Consistency Checking Report\n`);
    fs.appendFileSync(consistencyFilePath, `${new Date()}\n\n`);

    const map = {
        medium: 'M',
        high: 'H',
        low: 'L',
        likely: 'L',
        unlikely: 'U',
        probable: 'P'
    };
    const ruleSetInconsistency = {};

    rulesInRuleSets.forEach(item => {
        const masterId = item.master_id;
        const ruleInMaster = masterJson[Number(masterId) - 1];
        if (ruleInMaster) {
            !ruleSetInconsistency.hasOwnProperty(item.ruleSet) && (ruleSetInconsistency[item.ruleSet] = {});

            if (
                map[ruleInMaster.severity.toLowerCase()] !== item.severity ||
                map[ruleInMaster.likelihood.toLowerCase()] !== item.likelihood ||
                map[ruleInMaster.cost.toLowerCase()] !== item.cost
            ) {
                ruleSetInconsistency[item.ruleSet][ruleInMaster.code] = {
                    rule: [map[ruleInMaster.severity.toLowerCase()], map[ruleInMaster.likelihood.toLowerCase()], map[ruleInMaster.cost.toLowerCase()]].join('   '),
                    ruleSet: [item.severity, item.likelihood, item.cost,].join('   ')
                }
            }
        } else {
            fs.appendFileSync(consistencyFilePath, `Normalized table - unfound master rule for [${item.core_string}] in master_id=${masterId}\n`);
        }
    });
    fs.appendFileSync(consistencyFilePath, '\nUnmatched >>>>>>\n');

    Object.keys(ruleSetInconsistency).forEach(ruleSetName => {
        fs.appendFileSync(consistencyFilePath,
            `\n---------------${ruleSetName}---------------`);
        Object.keys(ruleSetInconsistency[ruleSetName]).map(ruleCode => {
            fs.appendFileSync(consistencyFilePath, `\n[${ruleCode}   severity   likelihood   cost]`);
            fs.appendFileSync(consistencyFilePath, `\nNormalize: ${ruleSetInconsistency[ruleSetName][ruleCode]['ruleSet']}`);
            fs.appendFileSync(consistencyFilePath, `\nMaster: ${ruleSetInconsistency[ruleSetName][ruleCode]['rule']}\n`);
            console.error(`Unmatched data found, rule set [${ruleSetName}], rule code [${ruleCode}]`);
        });
    });
}

const writeToReport = (txt, useConsole) => {
    if(typeof txt === "object") txt = JSON.stringify(txt);
    useConsole && console.log(txt);
    fs.appendFileSync(reportFilePath, txt);
    fs.appendFileSync(reportFilePath, '\n');
}

const checkRuleDetails = detailsOnly => {
    writeToReport(`\n---Validating details---`);
    const exampleExtensions = Object.keys(dataConfigs.supportedProgrammingFileExt);
    const report = {
        validated: {},
        invalid: [],
        noDetailFolder: [],
        nyi: [],
    };
    rulesInRuleSets.forEach(ruleInfo => {
        const ruleCode = ruleInfo.core_string;
        const csvCode = ruleInfo.csv_string;
        const nyi = !!ruleInfo.nyi && ruleInfo.nyi === 'N';
        if (!ruleCode) {
            report.invalid.push(ruleInfo);
            return;
        }
        if (nyi) {
            !report.nyi.includes(ruleCode) && report.nyi.push(ruleCode);
            return;
        }
        if (report.validated.hasOwnProperty(ruleCode)) {
            console.log(`*${csvCode}* as [${ruleCode}] has already validated`);
        }
        const folderPath = path.resolve(rawDataPath, `./details/${ruleCode}`);

        //validate examples
        if (!fs.existsSync(folderPath)) {
            !report.noDetailFolder.includes(ruleCode) && report.noDetailFolder.push(ruleCode);
            return;
        }
        !report.hasOwnProperty(ruleCode) && (report.validated[ruleCode] = {});
        const validated = report.validated[ruleCode];
        //validate empty contents for details
        const detailCnPath = path.resolve(folderPath, 'details_cn.md');
        const detailEnPath = path.resolve(folderPath, 'details_en.md');
        if (fs.existsSync(detailCnPath)) {
            const detailsContentCn = fs.readFileSync(detailCnPath);
            if (detailsContentCn.length === 0) {
                validated.detailsCn = 0;
            } else {
                validated.detailsCn = 1;
            }
        } else {
            validated.detailsCn = -1;
        }
        if (fs.existsSync(detailEnPath)) {
            const detailsContentEn = fs.readFileSync(detailEnPath);
            if (detailsContentEn.length === 0) {
                validated.detailsEn = 0;
            } else {
                validated.detailsEn = 1;
            }
        } else {
            validated.detailsEn = -1;
        }
        //early return
        if (detailsOnly) {
            return;
        }
        validated[`example_bad`] = {};
        validated[`example_good`] = {};

        exampleExtensions.forEach(ext => {
            const goodExpPath = path.resolve(folderPath, `example_good.${ext}`);
            const badExpPath = path.resolve(folderPath, `example_bad.${ext}`);
            if (fs.existsSync(badExpPath)) {
                const badExpContent = fs.readFileSync(badExpPath);
                if (badExpContent.length === 0) {
                    validated[`example_bad`][dataConfigs.supportedProgrammingFileExt[ext]] = 0;
                } else {
                    validated[`example_bad`][dataConfigs.supportedProgrammingFileExt[ext]] = 1;
                }
            } else {
                validated[`example_bad`][dataConfigs.supportedProgrammingFileExt[ext]] = -1;
            }

            if (fs.existsSync(goodExpPath)) {
                const goodExpContent = fs.readFileSync(goodExpPath);

                if (goodExpContent.length === 0) {
                    validated[`example_good`][dataConfigs.supportedProgrammingFileExt[ext]] = 0;
                } else {
                    validated[`example_good`][dataConfigs.supportedProgrammingFileExt[ext]] = 1;
                }
            } else {
                validated[`example_good`][dataConfigs.supportedProgrammingFileExt[ext]] = -1;
            }
        });

        fs.ensureFileSync(path.resolve(reportPath, 'detailValidationReport.json'));
        //write to json for report
        fs.writeFileSync(path.resolve(reportPath, 'detailValidationReport.json'), JSON.stringify(report, null, 4));
    });


    const derivePath = path.resolve(reportPath, './toFix');
    fs.ensureDirSync(derivePath);
    fs.emptyDirSync(derivePath);

    writeToReport('--------Detail report: validated--------');
    Object.keys(report.validated)
        .filter(ruleCode =>
            report.validated[ruleCode].detailsCn === 0 ||
            report.validated[ruleCode].detailsCn === -1 ||
            report.validated[ruleCode].detailsEn === 0 ||
            report.validated[ruleCode].detailsEn === -1 ||
            (Object.keys(report.validated[ruleCode].example_bad).reduce((acc, curr) => {
                acc += report.validated[ruleCode].example_bad[curr];
                return acc;
            }, 0) <= 0) ||
            (Object.keys(report.validated[ruleCode].example_good).reduce((acc, curr) => {
                acc += report.validated[ruleCode].example_good[curr];
                return acc;
            }, 0) <= 0)
        )
        .forEach(ruleCode => {
            writeToReport(`***${ruleCode}***`);
            const singleReport = report.validated[ruleCode];
            switch (singleReport.detailsCn) {
                case 0:
                    writeToReport(`Details cn: content is empty`);
                    summary.report.cnContentEmpty.push(ruleCode);
                    fs.copySync(path.resolve(rawDataPath, `./details/${ruleCode}`), path.resolve(`${derivePath}/missingDetailCn`, ruleCode), { overwrite: true });
                    break;
                case -1:
                    summary.report.cnDetailFileMissing.push(ruleCode);
                    writeToReport(`Details cn: file not found`);
                    break;
                default:
                    break;
            }
            switch (singleReport.detailsEn) {
                case 0:
                    writeToReport(`Details en: content is empty`);
                    summary.report.enContentEmpty.push(ruleCode);
                    fs.copySync(path.resolve(rawDataPath, `./details/${ruleCode}`), path.resolve(`${derivePath}/missingDetailEn`, ruleCode), { overwrite: true });
                    break;
                case -1:
                    summary.report.enDetailFileMissing.push(ruleCode);
                    writeToReport(`Details en: file not found`);
                    break;
                default:
                    break;
            }

            if((Object.keys(singleReport.example_bad).reduce((acc, curr) => {
                acc += singleReport.example_bad[curr];
                return acc;
            }, 0) <= 0)) {
                writeToReport(`No content for any lang in bad examples`);
                summary.report.noContentInBadExamples.push(ruleCode);
                fs.copySync(path.resolve(rawDataPath, `./details/${ruleCode}`), path.resolve(`${derivePath}/missingExpBad`, ruleCode), { overwrite: true });
            }
            if((Object.keys(singleReport.example_good).reduce((acc, curr) => {
                acc += singleReport.example_good[curr];
                return acc;
            }, 0) <= 0)) {
                writeToReport(`No content for any lang in good examples`);
                summary.report.noContentInGoodExamples.push(ruleCode);
                fs.copySync(path.resolve(rawDataPath, `./details/${ruleCode}`), path.resolve(`${derivePath}/missingExpGood`, ruleCode), { overwrite: true });
            }

            /*singleReport.example_bad && Object.keys(singleReport.example_bad).forEach(lang => {
                switch (singleReport.example_bad[lang]) {
                    case 0:
                        writeToReport(`Example bad [${lang}]: content not found`);
                        break;
                    case -1:
                        break;
                    default:
                        break;
                }
            });
            singleReport.example_good && Object.keys(singleReport.example_good).forEach(lang => {
                switch (singleReport.example_good[lang].toString()) {
                    case '0':
                        writeToReport(`Example good [${lang}]: content found`);
                        break;
                    case '-1':
                        break;
                    default:
                        break;
                }
            });*/
            writeToReport(`******\n`);
        });

    writeToReport('--------Fatal - No core code found--------');
    report.invalid.forEach(item => {
        summary.report.noCoreCodeFound.push(item.csv_string);
        writeToReport(`${item.csv_string}`);
    });
    writeToReport('--------Fatal - No related detail folder--------');
    report.noDetailFolder.forEach(item => {
        summary.report.noDetailFolder.push(item);
        writeToReport(`${item}`);
    });
    writeToReport('--------Not yet implemented--------');
    report.nyi.forEach(item => {
        summary.report.notYetImplemented.push(item);
        writeToReport(`${item}`);
    });
}

/**
 * Validate json and generate report
 * @returns Object
 */
async function validateOnce() {
    try {
        fs.ensureFileSync(reportFilePath);
        fs.writeFileSync(reportFilePath, `Report on ${moment().format('YYYY-MM-DD')} \r\n`);

        writeToReport('---Validate converted json using predefined schema---');
        let allValid = true;
        const resultList = dataConfig.map(config => {
            // writeToReport(`${config.name}:`);
            config.extraSchema && config.extraSchema.forEach(item => {
                v.addSchema(item.schema, item.uri);
                console.log(`schema added: ${item.uri}`)
            });
            return config.filePaths.map(filePath => {
                const validateResult = validateFile(filePath, config.schema);
                if (!validateResult.passed) {
                    allValid = false;
                }
                return validateResult;
            });
        }).flat();
        writeToReport(`All valid: ${allValid}`);
        resultList.forEach(result => {
            if (!result.passed) {
                // writeToReport(`${result.file} failed`);
                writeToReport(result);
            }
        });
        // consistencyChecking();
        checkRuleDetails();
        return {
            allValid,
            summary,
        };
    } catch (e) {
        console.error(e);
        return {
            allValid: false
        };
    }

}

// validateOnce().catch(e => console.error(e));

module.exports = {
    validateOnce,
    validateFile,
};
