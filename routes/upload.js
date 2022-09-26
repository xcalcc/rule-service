const currentFile = 'routes/upload.js';
const express = require('express');
const router = express.Router();
const uploadController = require('../controller/uploadController');
const fileController = require('../controller/fileController');

router.get('/uploaded-files', async (req, res) => {
    const fileList = await fileController.listUploadedFiles();
    res.json({
        count: fileList.length,
        list: fileList,
    });
});
router.get('/parsed-files', async (req, res) => {
    const fileList = await fileController.listParsedFiles();
    res.json({
        count: fileList.length,
        list: fileList,
    });
});

router.post('/upload', (req, res) => {
    uploadController.proxy(req, res, 'file', parsedJson => {
        res.json(parsedJson);
    });
});

router.get('/file/:name', (req, res) => {

});

module.exports = router;