const multer = require('multer');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const excelParser = require('../utils/excelParser');
const logger = require('../utils/logger');
const cache = require('../utils/cache');


const excelPath = path.resolve(__dirname, '../files/excels');
const parsedPath = path.resolve(__dirname, '../files/parsed');
const codeNameMapDataPath = path.join(__dirname, '../rule_data');
fs.ensureDir(excelPath);
fs.ensureDir(parsedPath);
fs.ensureDir(codeNameMapDataPath);

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, excelPath)
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, file.fieldname + '-' + uniqueSuffix)
//     }
// });
//todo schema validator (headers whitelist)
const excelFilter = function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
        req.fileValidationError = 'Only excel files are allowed!';
        return cb(new Error('Only excel are allowed!'), false);
    }
    cb(null, true);
};
const storage = multer.memoryStorage();

const uploadController = {
    parseToJson: buffer => {
        return excelParser.parseBuffer(buffer);
    },
    saveToJsonFile: json => {

    },
    //todo promisefy
    proxy: (req, res, fieldName, cb) => {
        const upload = multer({
            dest: excelPath,
            limits: { fileSize: process.env.MAX_UPLOAD_FILE_LIMIT },
            storage,
            fileFilter: excelFilter
        }).single(fieldName);

        upload(req, res, err => {
            // req.file contains information of uploaded file
            // req.body contains information of text fields, if there were any

            if (req.fileValidationError) {
                return res.send(req.fileValidationError);
            }
            else if (!req.file) {
                return res.send('Please select an excel file to upload');
            }
            else if (err instanceof multer.MulterError) {
                return res.send(err);
            }
            else if (err) {
                return res.send(err);
            } else {
                const originalNameSplitByDot = req.file.originalname.split('.');
                const extension = originalNameSplitByDot.pop();
                const dateInfo = moment().format('YYYY-MM-DD-HH-mm-ss');
                const excelBuffer = req.file.buffer;
                const parsedJson = uploadController.parseToJson(excelBuffer);
                try {
                    const ruleList = parsedJson[Object.keys(parsedJson)[0]];
                    const mapToCode = excelParser.indexedByRuleCode(ruleList);
                    fs.writeJson(path.join(codeNameMapDataPath, 'rule_map.json'), mapToCode);
                    cache.set('rule-code-name-map', mapToCode);
                } catch (e) {
                    logger.error(e);
                }
                const jsonName = `${dateInfo}.json`;
                const fileName = `${originalNameSplitByDot}_${dateInfo}.${extension}`;

                fs.outputFile(path.join(excelPath, fileName), excelBuffer);
                fs.writeJson(path.join(parsedPath, jsonName), parsedJson);
                cb && cb(parsedJson);
            }
        });
    }
};

module.exports = uploadController;