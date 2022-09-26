/**
 * A utility to generate Standard -> Rule code mapping
 **/
const serviceConfig = require('../../package.json');
const ExcelJS = require('exceljs');
const path = require('path');
const moment = require('moment');
const dataConfigs = require('../configs');
const outputExcelPath = path.resolve(__dirname, './');
const normalizedFilePath = path.resolve(__dirname, '../raw/normalized_rule_map.xlsx');
const ruleMasterFilePath = path.resolve(__dirname, '../raw/RuleSetMaster.xlsx');

const outputStandardExcelFile = async standardDataList => {
    const outputWorkbook = new ExcelJS.Workbook();
    outputWorkbook.creator = serviceConfig.author;
    outputWorkbook.created = new Date();
    outputWorkbook.modified = new Date();

    Object.keys(standardDataList).forEach(tableName => {
        const worksheet = outputWorkbook.addWorksheet(tableName, {
            pageSetup:{fitToPage: true, fitToHeight: 5, fitToWidth: 1, widths: 'auto'}
        });
        worksheet.columns = [
            { header: tableName, key: 'standardId', font: {bold: true} },
            { header: 'Standard Name', key: 'standardNameEn' },
            { header: 'Standard Name Chinese', key: 'standardNameCn' },
            { header: 'Url', key: 'url' },
            { header: 'Rule code matching', key: 'ruleCodeMatching' },
            { header: 'Support C/C++', key: 'supportCcpp' },
            { header: 'Support Java', key: 'supportJava' },
            { header: 'NYI', key: 'nyi' },
        ];
        const tableData = standardDataList[tableName];

        Object.keys(tableData).forEach(id => {
            const data = tableData[id];
            worksheet.addRow({
                standardId: data.id,
                standardNameEn: data.nameEn,
                standardNameCn: data.nameCn,
                url: {
                    text: data.url,
                    hyperlink: data.url
                },
                ruleCodeMatching: data.ruleCodes.join(','),
                supportCcpp: data.supportCcpp,
                supportJava: data.supportJava,
                nyi: data.notYetImplemented.join(','),
            });
        });
        worksheet.columns.forEach(function(column){
            let dataMax = 0;
            column.eachCell({ includeEmpty: true }, function(cell){
                let columnLength = (cell && cell.value && cell.value.length) || 0;
                if(cell && cell.value && typeof cell.value === 'object' && cell.value.text) { //for url obj
                    columnLength = cell.value.text.length;
                }
                if (columnLength > dataMax) {
                    dataMax = columnLength;
                }
            })
            column.width = dataMax < 10 ? 10 : dataMax;
        });
        worksheet.getRow(1).eachCell(cellElm => {
            cellElm.font = {
                bold: true
            }
        });
    });

    await outputWorkbook.xlsx.writeFile(path.resolve(outputExcelPath, `standardsToRules_${moment().format('YYYY-MM-DD')}.xlsx`));
}

const extractStandardJson = (rowData, dataHolder) => {
    const id = rowData.getCell('A').value.toString();
    if (!!!id) return;
    dataHolder[id] = {
        id: rowData.getCell('A').value,
        nameEn: rowData.getCell('B').value,
        nameCn: rowData.getCell('C').value,
        supportCcpp: rowData.getCell('F').value,
        supportJava: rowData.getCell('G').value,
        url: rowData.getCell('D').value.hyperlink || rowData.getCell('D').value,
        ruleCodes: [],
        notYetImplemented: [],
    }
}

const readDataForReverseMapping = async () => {
    const normalizedTableWorkbook = new ExcelJS.Workbook();
    await normalizedTableWorkbook.xlsx.readFile(normalizedFilePath);
    const ruleMasterTableWorkbook = new ExcelJS.Workbook();
    await ruleMasterTableWorkbook.xlsx.readFile(ruleMasterFilePath);

    const masterTable = ruleMasterTableWorkbook.getWorksheet('Rule Master');
    const masterTableList = {};

    masterTable.eachRow((rowData, rowNum) => {
        if (rowNum <= 1) return;
        if (rowData.getCell('F').value === 'reserved') return;
        const ruleCode = rowData.getCell('F').value.toLowerCase();
        const langList = rowData.getCell('C').value.split(',');
        masterTableList[ruleCode] = {
            langList,
            supportCcpp: (langList.includes('c') || langList.includes('c++')) ? 'Y' : 'N',
            supportJava: langList.includes('Java') ? 'Y' : 'N',
        };
    });

    const supportedStandards = dataConfigs.supportedStandards;
    let standardCollectionList = {};

    supportedStandards.forEach(standardConfig => {
        const dataTable = ruleMasterTableWorkbook.getWorksheet(standardConfig.table);
        const standardData = {};
        dataTable.eachRow((rowData, rowNum) => {
            if (rowNum <= 1) return;
            extractStandardJson(rowData, standardData);
        });
        standardCollectionList[standardConfig.table] = standardData;
    });

    const bltinRulesTable = normalizedTableWorkbook.getWorksheet('norm_bultin_rule_map');
    const certRulesTable = normalizedTableWorkbook.getWorksheet('norm_cert_rule_map');

    const insertIntoStandardList = (rowData, rowNum) => {
        if (rowNum <= 1) return;
        // if (rowData.getCell('O').value === 'N') return; //filter not yet implemented

        const ruleCode = rowData.getCell('B').value;
        if (!!ruleCode) {
            Object.keys(standardCollectionList).forEach(standard => {
                const standardObj = dataConfigs.supportedStandards.find(item => item.table === standard);
                if(!!!standardObj) return;
                const colMapForStandard = standardObj.colMapInNormalizedTable;

                const map = rowData.getCell(colMapForStandard).value;
                if (!!map && standardCollectionList[standard].hasOwnProperty(map)) {
                    if (rowData.getCell('O').value === 'N') {
                        standardCollectionList[standard][map].notYetImplemented.push(ruleCode);
                    } else {
                        standardCollectionList[standard][map].ruleCodes.push(ruleCode);
                    }
                }
            });
        }
    };
    bltinRulesTable.eachRow(insertIntoStandardList);
    certRulesTable.eachRow(insertIntoStandardList);

    //dedup
    Object.keys(standardCollectionList).forEach(standard => {
        const standCollection = standardCollectionList[standard];
        Object.keys(standCollection).forEach(id => {
            const dedup = new Set(standCollection[id].ruleCodes);
            standCollection[id].ruleCodes = Array.from(dedup);
        });
    });
    return Promise.resolve(standardCollectionList);
}

readDataForReverseMapping()
    .then(async standardCollectionList => {
        await outputStandardExcelFile(standardCollectionList);
    })
    .catch(e => console.log(e));