/**
 * Utilize csvreader to convert master file/normalized file into .inc
 **/
const path = require('path');
const fs = require('fs-extra');
const {spawnSync} = require('child_process');
const masterFilePath = path.resolve(__dirname, './raw/RuleSetMaster.xlsx');
const normalizedFilePath = path.resolve(__dirname, './raw/normalized_rule_map.xlsx');
const ExcelJS = require('exceljs');
const csv_path = path.resolve(__dirname, './source/v2csv/src/gen_dir');
const outputJsonPath = path.resolve(__dirname, './output');
const outputDetailPath = path.resolve(__dirname, './raw/details');
const configs = require('./configs');

fs.ensureDir(csv_path);
fs.ensureDir(outputJsonPath);
fs.ensureDir(outputDetailPath);

const outputFuel = {
    pathMsg: path.join(csv_path, 'pathmsg.csv'),
    blt: path.join(csv_path, 'blt.csv'),
    cert: path.join(csv_path, 'cert.csv'),
    master: path.join(csv_path, 'master.csv'),
    owasp: path.join(csv_path, 'owasp.csv'),
    p3csec: path.join(csv_path, 'p3c-sec.csv'),
    // autosar: path.join(csv_path, 'autosar.csv'),
    cwe: path.join(csv_path, 'cwe.csv'),
    certInfo: path.join(csv_path, 'cert-info.csv'),
};

const extractCsvFromNormalizedSheet = async normalizedFilePath => {
    const normalizedRuleSetWorkbook = new ExcelJS.Workbook();
    await normalizedRuleSetWorkbook.xlsx.readFile(normalizedFilePath);

    await normalizedRuleSetWorkbook.csv.writeFile(outputFuel['blt'], {
        sheetName: 'norm_bultin_rule_map',
    });
    await normalizedRuleSetWorkbook.csv.writeFile(outputFuel['cert'], {
        sheetName: 'norm_cert_rule_map',
    });
    await normalizedRuleSetWorkbook.csv.writeFile(outputFuel['pathMsg'], {
        sheetName: 'path message',
    });
}
const extractCsvFromMasterSheet = async masterFilePath => {
    const masterWorkbook = new ExcelJS.Workbook();
    await masterWorkbook.xlsx.readFile(masterFilePath);
    await masterWorkbook.csv.writeFile(outputFuel['master'], {
        sheetName: 'Rule Master',
    });
    await masterWorkbook.csv.writeFile(outputFuel['owasp'], {
        sheetName: 'OWASP',
    });
    await masterWorkbook.csv.writeFile(outputFuel['p3csec'], {
        sheetName: 'P3C-SEC',
    });
    await masterWorkbook.csv.writeFile(outputFuel['cwe'], {
        sheetName: 'CWE',
    });
    await masterWorkbook.csv.writeFile(outputFuel['certInfo'], {
        sheetName: 'CERT',
    });
    // await masterWorkbook.csv.writeFile(outputFuel['autosar'], {
    //     sheetName: 'AUTOSAR',
    // });

}

const convertingJson = () => {
    console.log('Build csv success');
    console.log('Transforming json...');
    const csvs = {
        p: path.resolve(csv_path, 'pathmsg.csv'),
        b: path.resolve(csv_path, 'blt.csv'),
        c: path.resolve(csv_path, 'cert.csv'),
        m: path.resolve(csv_path, 'master.csv'),
        o: path.resolve(csv_path, 'owasp.csv'),
        w: path.resolve(csv_path, 'cwe.csv'),
        e: path.resolve(csv_path, 'p3c-sec.csv'),
        // s: path.resolve(csv_path, 'autosar.csv'),
        C: path.resolve(csv_path, 'cert-info.csv'),
    };
    const args = [
        ...(() => Object.keys(csvs).map(arg => `-${arg} ${csvs[arg]}`))(),
        ' -h 1',
        ' -d ","',
        ' -j',
    ];
    const command = `cd ${__dirname}/source/v2csv/src && ./csvreader`;
    console.log(`Going to execute: ${command}`, args.join(' '));
    return spawnSync(command, args, {shell: true});
}

const injectDetailData = async (masterJsonPath, locale) => {
    console.log('start injecting details for ', masterJsonPath);
    const filteredMasterDataList = fs.readJsonSync(masterJsonPath).filter(rule => rule.code !== 'reserved');
    try {
        const detailInjectedData = filteredMasterDataList.map(rule => {
            //inject details
            if (!fs.pathExistsSync(path.resolve(outputDetailPath, rule.code))) {
                console.log(`No detail data found for ${rule.code} in ${path.resolve(outputDetailPath, rule.code)}`);
                return rule;
            }
            const detailFileExists = fs.pathExistsSync(path.resolve(outputDetailPath, rule.code, `details_${locale}.md`));
            if (detailFileExists) {
                rule.details = fs.readFileSync(path.resolve(outputDetailPath, rule.code, `details_${locale}.md`), 'utf8');
            } else {
                fs.copySync(path.resolve(outputDetailPath, '__TEMPLATE', `details_${locale}.md`), path.resolve(outputDetailPath, rule.code, `details_${locale}.md`));
            }

            //inject example
            const fileList = fs.readdirSync(path.resolve(outputDetailPath, rule.code));
            let examples = {
                good: {},
                bad: {},
            };
            fileList.forEach(fileName => {
                const fileObj = path.parse(fileName);
                const lang = configs.supportedProgrammingFileExt[fileObj.ext.replace('\.', '')] || 'general';
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
    } catch (e) {
        console.log('Inject detail data failure for ', masterJsonPath);
        console.error(e);
    } finally {
        return {
            counts: filteredMasterDataList.length,
            codes: filteredMasterDataList.map(data => data.code),
        }
    }
}

const mvJsonToFolder = () => {
    const filesInCsvPath = fs.readdirSync(csv_path);
    filesInCsvPath.forEach(file => {
        if (path.extname(file) === '.json') {
            fs.moveSync(`${csv_path}/${file}`, `${outputJsonPath}/${file}`, {overwrite: true});
        }
    });
}

const genData = async skip => {
    if(skip) {
        console.log('Skip generating data');
        return {
            validationResult: {
                allValid: true
            },
        };
    }
    let enSummary, cnSummary;
    try {
        await fs.emptyDir(csv_path);
        console.log('gen_dir cleared');
        await extractCsvFromNormalizedSheet(normalizedFilePath);
        await extractCsvFromMasterSheet(masterFilePath);
        const result = convertingJson();
        const masterJsonCn = path.resolve(csv_path, 'master_cn.json');
        const masterJsonEn = path.resolve(csv_path, 'master.json');
        cnSummary = await injectDetailData(masterJsonCn, 'cn');
        enSummary = await injectDetailData(masterJsonEn, 'en');
        mvJsonToFolder();
        if (result.status === 0) {
            console.log('Transform all json success!');
            console.log(`Moving json files to ${outputJsonPath}`);
            mvJsonToFolder();
        } else {
            console.error(`converting json error... status: ${result.status}`);
        }
        if (result.stdout) {
            console.log(result.stdout.toString('utf8'));
        }
        if (result.stderr) {
            console.error(result.stderr.toString('utf8'));
        }
        if (result.error) {
            console.error(JSON.stringify(result.error));
        }
    } catch (e) {
        console.error('build csv failure', e);
    }
    const validationResult = await require('./validation').validateOnce();
    return {
        en: enSummary,
        cn: cnSummary,
        validationResult,
    };
}

module.exports = genData;
