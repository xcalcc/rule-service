const fs = require('fs-extra');
const path = require('path');
const uploadedFilePath = path.resolve(__dirname, '../files/excels');
const parsedFilePath = path.resolve(__dirname, '../files/parsed');

const dummyDataPath =  '../data/dummy/';

const readJsonContent = async filePath => await fs.readJson(filePath);

module.exports = {
    listUploadedFiles: async () => {
        try {
            return  await fs.readdir(uploadedFilePath);
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    listParsedFiles: async () => {
        try {
            return  await fs.readdir(parsedFilePath);
        } catch (e) {
            throw e;
        }
    },
}