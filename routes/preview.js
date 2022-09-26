const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const ruleDetailsPath = path.resolve(__dirname, '../data/raw/details');
const version = fs.readJsonSync(path.resolve(__dirname, '../data/output/masterver.json'));
const configs = require('../data/configs');

const md = require('jstransformer')(require('jstransformer-markdown-it'));
const highlight = require('jstransformer')(require('jstransformer-highlight'));

const ruleDetailDetailFolderList = fs.readdirSync(ruleDetailsPath).filter(file => fs.statSync(ruleDetailsPath + '/' + file).isDirectory());
const rules = ruleDetailDetailFolderList.map(ruleCode => {
    try {
        const ruleDetailPathRoot = path.resolve(ruleDetailsPath, ruleCode.trim());
        const fileList = fs.readdirSync(ruleDetailPathRoot);
        let detailsCn = '', detailsEn = '';
        const detailCnPath = path.resolve(ruleDetailPathRoot, 'details_cn.md');
        const detailEnPath = path.resolve(ruleDetailPathRoot, 'details_en.md');
        if (fs.pathExistsSync(detailCnPath)) {
            detailsCn = fs.readFileSync(detailCnPath, {encoding: 'utf8'});
        }
        if (fs.pathExistsSync(detailEnPath)) {
            detailsEn = fs.readFileSync(detailEnPath, {encoding: 'utf8'});
        }
        let examples = {
            good: {},
            bad: {},
        };
        fileList.forEach(fileName => {
            const fileObj = path.parse(fileName);
            const lang = configs.supportedProgrammingFileExt[fileObj.ext.replace('\.', '')];
            let content = '';
            const contentPath = path.resolve(ruleDetailPathRoot, fileObj.base);
            if (fs.pathExistsSync(contentPath)) {
                content = fs.readFileSync(contentPath, {encoding: 'utf8'});
            }
            let target;
            if (/example_good(_\d)*/.test(fileObj.name)) {
                target = 'good';
            }
            if (/example_bad(_\d)*/.test(fileObj.name)) {
                target = 'bad';
            }
            if (!examples[target]) {
                return;
            }
            if (examples[target].hasOwnProperty(lang)) {
                examples[target][lang].push(content);
            } else {
                examples[target][lang] = [content];
            }
        });

        return {
            text: ruleCode,
            href: `#${ruleCode}`,
            detailsCn: detailsCn || '',
            detailsEn: detailsEn || '',
            examples,
        }
    } catch (e) {
        console.error(`Error! ${e}`);
        return {
            text: ruleCode,
            href: `#${ruleCode}`,
            e,
        }
    }
});

router.get('/preview-rule-details', (req, res) => {
    res.render("preview-rule-details", {
        markdown: mdTxt => mdTxt && md.render(mdTxt).body || '',
        highlight: (code, lang) => {
            if (!code) {
                return '';
            }
            let langMap;
            switch (lang) {
                case 'general':
                    langMap = 'AutoIt';
                    break;
                default:
                    langMap = lang;
                    break;
            }
            return highlight.render(code, {lang: langMap}).body;
        },
        ver: version,
        rules,
    });
});

router.get('/preview-error-list', () => {

});


module.exports = router;