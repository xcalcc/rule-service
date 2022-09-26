const genData = require('../../data/transformer');
const validator = require('../../data/validation');
const fs = require('fs-extra');
const path = require('path');
const outputSrcPath = path.resolve(__dirname, '../../data/output');
const outputDestPath = path.resolve(__dirname, 'mock/output');

const fileList = [
    'blt.json',
    'cert.json',
    'cwe.json',
    'cwe_cn.json',
    'master.json',
    'master_cn.json',
    'masterver.json',
    'owasp.json',
    'owasp_cn.json',
    'p3c-sec.json',
    'p3c-sec_cn.json',
    'pathmsg.json',
    'pathmsg_cn.json',
];
beforeAll(async () => {
    fs.emptyDirSync(outputDestPath);
    fileList.forEach(file => {
        //copy data to mock
        fs.copySync(`${outputSrcPath}/${file}`, `${outputDestPath}/${file}`);
    });

    await genData();
});

describe(`Data generation`, () => {
    fileList.forEach(file => {
        it(`it should have ${file} file in output folder`, () => {
            expect(fs.pathExistsSync(path.resolve(outputDestPath, file))).toBeTruthy();
        });
    });
});

describe(`Data Validation`, () => {
    it(`Validation files should be all success`, () => {
        const validationResult = validator.validateOnce();
        expect(validationResult.allValid).toBeTruthy();
    });
});

// describe