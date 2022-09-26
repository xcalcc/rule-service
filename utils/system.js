const os = require('os-utils');
const fs = require('fs-extra');
const moment = require('moment');
const path = require('path');
const sysLogPath = process.env.sysLog ? path.resolve(__dirname, process.env.sysLog) : path.resolve(__dirname, './');
const sysLogFileName = 'sys-log.log';
const interval = 5 * 60 * 1000;
const filePath = path.resolve(sysLogPath, sysLogFileName);

const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const writeToFile = sysInfo => {
    fs.ensureFileSync(filePath);
    fs.appendFileSync(filePath, `----- ${moment().format('YYYY-MM-DD HH:mm:ss')} -----\n`);
    fs.appendFileSync(filePath, `CPU usage: ${(sysInfo.cpuUsage * 100).toFixed(2)}%\n`);
    fs.appendFileSync(filePath, `CPU free: ${(sysInfo.cpuFree * 100).toFixed(2)}%\n`);
    fs.appendFileSync(filePath, `Free ram: ${(sysInfo.freememPercentage * 100).toFixed(2)}%\n`);
    fs.appendFileSync(filePath, `Process up time: ${Math.ceil(sysInfo.processUptime)}s\n\n`);
}

const sysLog = async () => {
    console.log(`----- ${moment().format('YYYY-MM-DD HH:mm:ss')} -----`);

    let cpuUsage;
    let cpuFree;
    os.cpuUsage(v => cpuUsage = v);
    os.cpuFree(v => cpuFree = v);
    await sleep(1000);
    const processUptime = os.processUptime();
    const freememPercentage = os.freememPercentage();

    return Promise.resolve({
        cpuUsage,
        cpuFree,
        processUptime,
        freememPercentage,
    });
}
const doLogging = async () => {
    const sysInfo = await sysLog();
    console.log(sysInfo);
    writeToFile(sysInfo);
}

fs.writeFileSync(filePath, '');
const startSysResourceMonitor = async () => {
    await doLogging();
    await sleep(interval); //interval
    await startSysResourceMonitor();
}

module.exports = {
    startSysResourceMonitor,
};