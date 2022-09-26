/**
 * Utilize csvreader to convert master file/normalized file into .inc
 **/
const path = require('path');
const fs = require('fs-extra');
const excelToJson = require('convert-excel-to-json');
const masterFilePath = path.resolve(__dirname, './raw/RuleSetMaster.xlsx');
const normalizedFilePath = path.resolve(__dirname, './raw/normalized_rule_map.xlsx');
const jsonFactory = require('./jsonFactory');
const outputJsonPath = path.resolve(__dirname, './outputJson');
const outputDetailPath = path.resolve(__dirname, './raw/details');
const configs = require('./configs');

fs.ensureDir(outputJsonPath);
fs.ensureDir(outputDetailPath);

const writeJson = (filePath, fileName, data) => {
    fs.writeFileSync(path.resolve(filePath, fileName), JSON.stringify(data, null, 4), {encoding: 'utf8'});
}

const buildJSON = async () => {
    try {
        await fs.emptyDir(outputJsonPath);
        console.log('/outputJsonPath cleared');
        const ruleSetData = excelToJson({
            sourceFile: normalizedFilePath,
            header: {
                rows: 1
            },
            sheets: [
                {
                    name: 'norm_bultin_rule_map',
                    columnToKey: jsonFactory.columnMap.normalizedMap['ruleSet']
                },
                {
                    name: 'norm_cert_rule_map',
                    columnToKey: jsonFactory.columnMap.normalizedMap['ruleSet']
                },
                {
                    name: 'path message',
                    columnToKey: jsonFactory.columnMap.normalizedMap['pathMsg']
                },
            ]
        });
        // console.log(ruleSetData['norm_bultin_rule_map'].filter(item => item.master_id))
        // console.log(ruleSetData['norm_cert_rule_map'].filter(item => item.master_id))
        // console.log(ruleSetData['path message'])
        const masterData = excelToJson({
            sourceFile: masterFilePath,
            header: {
                rows: 1
            },
            sheets: [
                {
                    name: 'Rule Master',
                    columnToKey: jsonFactory.columnMap.masterMap['master']
                },
                {
                    name: 'OWASP',
                    columnToKey: jsonFactory.columnMap.masterMap['standard']
                },
                {
                    name: 'CWE',
                    columnToKey: jsonFactory.columnMap.masterMap['standard']
                },
                {
                    name: 'P3C-SEC',
                    columnToKey: jsonFactory.columnMap.masterMap['standard']
                },
                {
                    name: 'CERT',
                    columnToKey: jsonFactory.columnMap.masterMap['standard']
                },
            ]
        });

        //dealing normalized file
        const bltInJson = jsonFactory.transformRuleSetJson(ruleSetData['norm_bultin_rule_map'].filter(item => item.master_id));
        const certJson = jsonFactory.transformRuleSetJson(ruleSetData['norm_cert_rule_map'].filter(item => item.master_id));
        const pathJson = jsonFactory.transformPathMsgJson(ruleSetData['path message'].filter(item => item.id), 'en');
        const pathJsonCn = jsonFactory.transformPathMsgJson(ruleSetData['path message'].filter(item => item.id), 'cn');

        writeJson(outputJsonPath, 'blt.json', bltInJson);
        writeJson(outputJsonPath, 'cert.json', certJson);
        writeJson(outputJsonPath, 'pathmsg.json', pathJson);
        writeJson(outputJsonPath, 'pathmsg_cn.json', pathJsonCn);

        //dealing master file
        const masterJson = jsonFactory.transformMasterRuleJson(masterData['Rule Master'], 'en');
        const masterJson_cn = jsonFactory.transformMasterRuleJson(masterData['Rule Master'], 'cn');
        const owaspJson = jsonFactory.transformStandardJson(masterData['OWASP'], 'en');
        const owaspJson_cn = jsonFactory.transformStandardJson(masterData['OWASP'], 'cn');
        const cweJson = jsonFactory.transformStandardJson(masterData['CWE'], 'en');
        const cweJson_cn = jsonFactory.transformStandardJson(masterData['CWE'], 'cn');
        const p3csecJson = jsonFactory.transformStandardJson(masterData['P3C-SEC'], 'en');
        const p3csecJson_cn = jsonFactory.transformStandardJson(masterData['P3C-SEC'], 'cn');
        const certInfoJson = jsonFactory.transformStandardJson(masterData['CERT'], 'en');
        const certInfoJson_cn = jsonFactory.transformStandardJson(masterData['CERT'], 'cn');

        writeJson(outputJsonPath, 'master.json', masterJson);
        writeJson(outputJsonPath, 'master_cn.json', masterJson_cn);
        writeJson(outputJsonPath, 'owasp.json', owaspJson);
        writeJson(outputJsonPath, 'owasp_cn.json', owaspJson_cn);
        writeJson(outputJsonPath, 'cwe.json', cweJson);
        writeJson(outputJsonPath, 'cwe_cn.json', cweJson_cn);
        writeJson(outputJsonPath, 'p3c-sec.json', p3csecJson);
        writeJson(outputJsonPath, 'p3c-sec_cn.json', p3csecJson_cn);
        writeJson(outputJsonPath, 'cert-info.json', certInfoJson);
        writeJson(outputJsonPath, 'cert-info_cn.json', certInfoJson_cn);

        return Promise.resolve(1);
    } catch (e) {
        console.error(e);
        return Promise.reject({error: e});
    }
}

//todo, get rid of rule master table. extract rule names/descriptions to file
const injectDetailData = async (masterJsonPath, locale) => {
    console.log('start injecting details for ', masterJsonPath);
    const masterDataList = fs.readJsonSync(masterJsonPath);
    try {
        if (Array.isArray(masterDataList)) {
            const detailInjectedData = masterDataList.map(rule => {
                //inject details
                if (!fs.pathExistsSync(path.resolve(outputDetailPath, rule.code))) {
                    console.log(`No detail data found for ${rule.code} in ${path.resolve(outputDetailPath, rule.code)}`);
                    return rule;
                }
                const detailFileExists = fs.pathExistsSync(path.resolve(outputDetailPath, rule.code, `details_${locale}.md`));
                if (detailFileExists) {
                    rule.details = fs.readFileSync(path.resolve(outputDetailPath, rule.code, `details_${locale}.md`), 'utf8');
                }

                //inject example
                const fileList = fs.readdirSync(path.resolve(outputDetailPath, rule.code));
                let examples = {
                    good: {},
                    bad: {},
                };
                fileList.forEach(fileName => {
                    const fileObj = path.parse(fileName);
                    const extension = fileObj.ext.replace('\.', '');
                    if (!Object.keys(configs.supportedProgrammingFileExt).includes(extension)) {
                        console.error(`Skip file [${fileName}], as the extension "${extension}" is not in support list [${Object.keys(configs.supportedProgrammingFileExt)}]`);
                        return;
                    }
                    const lang = configs.supportedProgrammingFileExt[extension];
                    const content = fs.readFileSync(path.resolve(outputDetailPath, rule.code, fileObj.base), 'utf8');

                    let target;
                    if (/example_good(_\d)*/.test(fileObj.name)) {
                        target = 'good';
                    }
                    if (/example_bad(_\d)*/.test(fileObj.name)) {
                        target = 'bad';
                    }
                    if (!examples[target] || !content) {
                        return;
                    }
                    if (examples[target].hasOwnProperty(lang)) {
                        examples[target][lang].push(content);
                    } else {
                        examples[target][lang] = [content];
                    }
                });
                rule.examples = examples;
                return rule;
            });
            fs.writeFileSync(masterJsonPath, JSON.stringify(detailInjectedData, null, 4));
            console.log('Inject detail data successfully for ', masterJsonPath);
        } else {
            throw new Error('Input master data is not a list');
        }

    } catch (e) {
        console.log('Inject detail data failure for ', masterJsonPath);
        console.error(e);
    }
}

const genData = async () => {
    try {
        await buildJSON();

        const masterJsonCn = path.resolve(outputJsonPath, 'master_cn.json');
        const masterJsonEn = path.resolve(outputJsonPath, 'master.json');
        await injectDetailData(masterJsonCn, 'cn');
        await injectDetailData(masterJsonEn, 'en');
        console.log('Transform all json success!');
    } catch (e) {
        console.error('build data failure', e);
    } finally {
        console.error('build data finished');
    }
    return (await require('./validation').validateOnce()).allValid;
}

// extractDetailsToFile() //careful! will override current!

module.exports = genData;
