const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const ruleRoute = require('./rule');
const errorRoute = require('./errorCodes');

router.use('/rule', ruleRoute);
router.use('/error', errorRoute);

// const previewRoute = require('./preview');
// router.use('/view', previewRoute);

router.use('/ver', async (req, res) => {
    let versionInfo = {};
    try {
        versionInfo = fs.readJsonSync(path.resolve(__dirname, '../version.json'), {encoding: 'utf8'});
        res.json(versionInfo);
    } catch(e) {
        res.send('Cannot get version info');
    }
});

router.use('/', async (req, res) => {
    res.send('Rule info service');
});

module.exports = router;