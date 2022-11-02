const path = require('path');
const fs = require('fs');
const moment = require('moment');
const genMasterData = require('./transformer');
const genExtraData = require('./buildExtra');
const versionFilePath = path.resolve(__dirname, '../version.json');

let versionData = {};

module.exports = async () => {
    console.log('building master rules (builtin/cert)...');
    const masterSummary = await genMasterData();
    console.log(`Building extra rules...`);
    const extraSummary = await genExtraData();
    versionData.version = moment().format('YYYY-MM-DD HH:mm:ss');
    versionData.summary = {
        extra: extraSummary,
        xcal: masterSummary,
    };
    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 4));
};
