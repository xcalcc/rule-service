const {compile} = require('nexe');
const {version} = require('../package.json');
const path = require('path');
const {spawn} = require('child_process');
const fs = require('fs-extra');
const genData = require('../data/transformer');
const logger = require('../utils/logger');
const logMeta = {
    version: `${version}`,
};

//cp .env.default .env
spawn('cp .env.default .env', null, {shell: true});
const outputPath = path.resolve(__dirname, '../dist/nexe/');
fs.ensureDirSync(outputPath);

require('dotenv').config({path: '.env'});

const compileOptions = {
    input: './service.js',
    build: false, //required to use patches
    target: ['linux-x64'],
    name: 'rule-service',
    // clean: true,
    output: path.resolve(outputPath, './rule-service'),
    // icon: './build/icon.ico',
    configure: ['--dest-cpu=x64'],
    resources: [
        'node_modules',
        'views',
        'data/output',
        'data/directServe',
        '.env',
        './version.json'
    ],
    enableNodeCli: true,
    loglevel: 'error',
    patches: [
        async (compiler, next) => {
            //hack node source
            compiler.nodeSrcBinPath = path.resolve(__dirname, './static-node/node-14.17.6-stripped');
            await compiler.setFileContentsAsync(
                'lib/new-native-module.js',
                'module.exports = 42'
            )
            return next()
        },
    ]
};

if (process.env.ENVIRONMENT === 'dev') {
    compileOptions.resources.push('data/raw/details');
    compileOptions.resources.push('views');
}

const compileService = () => {
    compile(compileOptions).then(() => {
        console.log('nexe bundled linux success')
    });
}

const skipGenData = true;

genData(skipGenData).then(result => {
    if (!result.validationResult.allValid) {
        throw new Error('Data validation failure, check the log');
    }
    compileService();
}).catch(e => {
    logger.error(`Generate data failure, ${e}`, logMeta);
    logger.info('No new build will be generated.')
});
