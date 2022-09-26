const path = require('path');
const dataPath = './output';
//reverse mapping, ext => language
const supportedProgrammingFileExt = {
    'c': 'c',
    'cpp': 'cpp',
    'java': 'java',
    'txt': 'general',
    // 'js': 'javascript',
};

const ruleSets = [
    {
        id: 'S',
        code: 'CERT',
        displayName: 'CERT',
        dataPath: path.resolve(__dirname, dataPath, 'cert.json')
    },
    {
        id: 'X',
        code: 'BUILTIN',
        displayName: 'XCALIBYTE',
        dataPath: path.resolve(__dirname, dataPath, 'blt.json')
    },
    {
        id: 'M',
        code: 'M',
        displayName: 'MISRA',
        // dataPath: path.resolve(__dirname, dataPath, 'misra.json')
    },
    {
        id: 'A',
        code: 'A',
        displayName: 'Autosar',
    }
];

const supportedStandards = [
    {
        key: 'owasp',
        display: 'OWASP',
        table: 'OWASP',
        colMapInNormalizedTable: 'K',
    },
    {
        key: 'cwe',
        display: 'CWE',
        table: 'CWE',
        colMapInNormalizedTable: 'L',
    },
    {
        key: 'p3c-sec',
        display: 'P3C-SEC',
        table: 'P3C-SEC',
        colMapInNormalizedTable: 'M',
    },
    {
        key: 'cert',
        display: 'CERT',
        table: 'CERT',
        colMapInNormalizedTable: 'J',
    },
];

//2/3 bits
const errorCodeFactorWho = {
    general: 0,
    internal: 1,
    external: 2,
    user: 3,
};
//3/5 bits
const errorCodeFactorWhere = {
    installation: 0,
    prjSetup: 1,
    scanPreparation: 2,
    scan: 3,
    report: 4,
    offlineMode: 5,
    notUsed: 6,
    general: 7,
};
//3/8 bits
const errorCodeFactorWhich = {
    user: 0,
    external: 1,
    notUsed: 2,
    xcalInternal: 3,
};
//10/15 bits
const getErrorCodeFactorWhatValue = list => list.length;

const errorCodeDescriptionColConfig = {
    popular: 'A',
    module: 'B',
    errCodeName: 'C',
    errCodeKey: 'D',
    createdBy: 'G',
    byWho: 'H',
    byWhere: 'I',
    byWhich: 'J',
    byWhat: 'K',
    userVisible: 'L',
    errCode: 'M',
    whoFix: 'N',
    whereUserProcess: 'O',
    producer: 'P',
    errMsgEn: 'Q',
    errMsgCn: 'R',
    recipients: 'S',
    troubleShoot: 'T',
    recommendedSolutions: 'U',
    firstOwner: 'V',
    secondOwner: 'W',
    remark: 'X',
}

module.exports = {
    supportedProgrammingFileExt,
    ruleSets,
    supportedStandards,

    errorDescription: {
        errorCodeFactorWho,
        errorCodeFactorWhere,
        errorCodeFactorWhich,
        getErrorCodeFactorWhatValue,
        errorCodeDescriptionColConfig,
    },
};
