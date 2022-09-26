const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const wrapper = require('../utils/asyncWrapper');
const logger = require('../utils/logger');
const responseController = require('../controller/responseController');
const ruleController = require('../controller/ruleController');

const PathMsg = require('../data/class/PathMsg');
const RuleSet = require('../data/class/RuleSet');
const RuleList = require('../data/class/Rule');
const OwaspList = require('../data/class/Owasp');
const CweList = require('../data/class/Cwe');
const P3cSecList = require('../data/class/P3c-sec');
const CertInfoList = require('../data/class/Cert-info');
// const Autosar = require('../data/class/Autosar');
const ruleSet = new RuleSet();
const pathMsg = new PathMsg();
const ruleList = new RuleList();
const owaspList = new OwaspList();
const cweList = new CweList();
const p3cSecList = new P3cSecList();
const certInfoList = new CertInfoList();
// const autosarList = new Autosar();

const cache = require('../utils/cache');

const writeToFile = (fileName, data) => {
    const outputPath = path.resolve(__dirname, '../data/directServe', fileName);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), {encoding: 'utf8'})
}

const useCache = (req, res, next) => {
    req.span = logger.createTracerSpan(`${req.path} try to get from cache`);
    // logger.info(`trying to get result from cache for ${req.path}`);
    const cacheKey = cache.genCacheKey(req);
    if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        req.span.finish();
        // logger.info(`Cached data found for ${req.path}, serving directly`);
        responseController.successCallBack(res, cachedData);
        return;
    }
    req.span.finish();
    next();
}

router.get('/rule_list', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('rule_list by rule set request');
    logger.info(`Called for ${req.path}`);
    const locale = req.query['locale'] || 'en';
    const rule_set_id = req.query['rule_set_id'];
    const rule_set_code = req.query['rule_set_code'];
    const fieldsStr = req.query['fields'];
    const use_csv_key_map = req.query['use_csv_key_map'];
    const filterFields = !!fieldsStr ? fieldsStr.split(',') : [];

    const standard_name = req.query['standard_name'];
    let ruleListData = [];
    let callback = {
        dataVersion: ruleSet.ver,
    };

    if (rule_set_id) {
        const ruleSetData = ruleSet.getData(locale)[rule_set_id];
        const rules = ruleSetData.rules;
        ruleListData = rules.map(rule => ruleList.getData(locale)[(rule.master_id - 1)]);
        callback = {
            ...callback,
            ...{
                rules: ruleListData || [],
                csvCodeMap: ruleList.csvCodeMap,
                ruleSet: {
                    id: ruleSetData.id,
                    displayName: ruleSetData.displayName,
                    code: ruleSetData.code,
                }
            }
        };
    } else {
        ruleListData = ruleList.getData(locale) || [];
    }
    if (standard_name) {
        ruleListData = ruleController.extractRulesFromStandard(standard_name, ruleListData);
    }
    ruleListData = ruleListData.filter(rule => !rule.status || rule.status !== 'pending' );

    if (rule_set_code) {
        ruleListData = ruleListData
            .filter(rule => rule.hasOwnProperty('ruleSet'))
            .filter(rule => rule.hasOwnProperty('csv_string'))
            .filter(rule => {
                return rule.ruleSet.id === rule_set_code;
            });
    }
    if (filterFields.length) {
        ruleListData = ruleListData.map(rule => {
            let withSelectedKeys = {
                csv_string: rule.csv_string,
                code: rule.code
            };
            filterFields.forEach(field => {
                if(rule.hasOwnProperty(field)) {
                    withSelectedKeys[field] = rule[field];
                }
            });
            return withSelectedKeys;
        });
    }

    if(use_csv_key_map) {
        let csv_map = {};
        ruleListData.forEach(rule => {
            rule.csv_string && rule.csv_string.length && rule.csv_string.forEach(csvCode => {
                csv_map[csvCode] = rule;
                delete csv_map[csvCode].csv_string;
            });
        })
        callback = {
            ...callback,
            csv_map,
        };
    } else {
        callback = {
            ...callback,
            counts: ruleListData.length,
            rules: ruleListData,
            csvCodeMap: ruleList.csvCodeMap,
        };
    }


    req.span.finish();
    const cacheKey = cache.genCacheKey(req);
    cache.set(cacheKey, callback);
    responseController.successCallBack(res, callback);
}));

router.get('/rule_info/:csv_code', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('get rule by csv code');
    const locale = req.query['locale'] || 'en';
    const csv_code = req.params['csv_code'];
    const ruleData = ruleSet.indexedByCsvCode[csv_code.toLowerCase()];
    let ruleInfo = ruleList.getData(locale)[ruleData.masterId - 1];
    if (!csv_code || !ruleData || !ruleInfo) {
        responseController.errorCallBack(res, {
            error: 'Rule info cannot be found, please check your csv rule code',
            index: ruleSet.indexedByCsvCode
        }, 404);
        return;
    }

    req.span.finish();
    ruleInfo.ruleSet = ruleData.ruleSet;
    const callback = {
        dataVersion: ruleSet.ver,
        data: ruleInfo,
    };
    const cacheKey = cache.genCacheKey(req);
    cache.set(cacheKey, callback);
    responseController.successCallBack(res, callback);
}));


//get all path msg
router.get('/path_msg', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('path_msg request');
    let locale = req.query['locale'] || 'en';

    if (pathMsg.getLocales().includes(locale)) {
        let pathMsgData = pathMsg.getData(locale);
        const callback = {
            dataVersion: pathMsg.ver,
            data: pathMsgData || null
        };
        const cacheKey = cache.genCacheKey(req);
        cache.set(cacheKey, callback);
        responseController.successCallBack(res, callback);
    } else {
        responseController.errorCallBack(res, {
            error: 'Locale not supported'
        }, 404);
    }
    req.span.finish();
}));

//get all rule sets
router.get('/rule_sets', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('rule_sets request');
    const locale = req.query['locale'] || 'en';
    let ruleSets = ruleSet.getData(locale);
    let ruleSetsArray = Object.keys(ruleSets).map(ruleSetCode => ruleSets[ruleSetCode]);
    req.span.finish();
    const callback = {
        dataVersion: ruleSet.ver,
        data: ruleSetsArray || null
    };
    const cacheKey = cache.genCacheKey(req);
    cache.set(cacheKey, callback);
    responseController.successCallBack(res, callback);
}));
//get standard mapping info
router.get('/standard/:standard_name', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('single standard request');
    const locale = req.query['locale'] || 'en';
    const standardName = req.params['standard_name'];

    let standardList = null;
    switch (standardName) {
        case 'owasp':
            standardList = owaspList;
            break;
        case 'cwe':
            standardList = cweList;
            break;
        case 'p3c-sec':
            standardList = p3cSecList;
            break;
        case 'cert':
            standardList = certInfoList;
            break;
        // case 'autosar':
        //     standardList = autosarList;
        //     break;
    }

    if (standardList && standardList.getLocales().includes(locale)) {
        let listData = standardList.getData(locale);
        const callback = {
            dataVersion: standardList.ver,
            data: listData || null
        };
        const cacheKey = cache.genCacheKey(req);
        cache.set(cacheKey, callback);
        responseController.successCallBack(res, callback);
    } else {
        responseController.errorCallBack(res, {
            error: 'Locale not supported'
        }, 404);
    }
    req.span.finish();
}));
router.get('/standards', wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('standards request');
    const locale = req.query['locale'] || 'en';
    const cweData = cweList.getData(locale);
    const p3cSecData = p3cSecList.getData(locale);
    const owaspData = owaspList.getData(locale);
    const certData = certInfoList.getData(locale);
    // const autosarData = autosarList.getData(locale);
    const callback = {
        dataVersion: cweData.ver,
        data: {
            cwe: cweData,
            'p3c-sec': p3cSecData,
            owasp: owaspData,
            cert: certData,
            // autosar: autosarData,
        }
    };
    responseController.successCallBack(res, callback);
    req.span.finish();
}));

//get all rule set by id
router.get('/rule_set/:id', useCache, wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('rule_set request');
    const locale = req.query['locale'] || 'en';
    const {id} = req.params;
    let ruleSets = ruleSet.getData(locale);
    const ruleSetData = ruleSets[id];
    req.span.finish();
    if (ruleSetData) {
        const callback = {
            dataVersion: ruleSetData && ruleSetData.ver,
            data: ruleSetData || null
        };
        const cacheKey = cache.genCacheKey(req);
        cache.set(cacheKey, callback);
        responseController.successCallBack(res, callback);
    } else {
        responseController.errorCallBack(res, {
            error: `Cannot find ruleset [${id}]`
        }, 404);
    }
}));

// router.get('/rule_standard/rule_standard_set/:rule_standard_name', (req, res) => {
//     const {rule_standard_name} = req.params;
//     res.send(`[WIP]/rule_standard/rule_standard_set/${rule_standard_name}`);
//
// });

router.post('/custom/:projectId?', wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('custom_rule update request');
    const body = req.body;
    const {projectId} = req.params;
    if (!projectId) {
        responseController.errorCallBack(res, {
            error: 'No project ID specified, cannot create custom rule'
        });
    }
    //validate fields
    const validateResult = ruleController.customRule.validate(body);
    if (validateResult.success) {
        await ruleController.customRule.writeToFile(projectId, body);
        responseController.successCallBack(res, {
            msg: `Rule saved success for project [${projectId}]`
        });
    } else {
        logger.error(`POST custom rule validation failed: ${JSON.stringify(validateResult.errors)}`)
        responseController.errorCallBack(res, {
            error: validateResult.errors.map(error => error.stack)
        });
    }

    req.span.finish();
}));

router.get('/custom/:projectId?', wrapper(async (req, res) => {
    req.span = logger.createTracerSpan('custom_rule fetch request');
    const {projectId} = req.params;
    if (!projectId) {
        responseController.errorCallBack(res, {
            error: 'No project ID specified, cannot get custom rule'
        });
    }
    const customRules = await ruleController.customRule.readCustomRuleByProjectId(projectId);
    responseController.successCallBack(res, {
        rules: {
            project: projectId,
            ruleCounts: customRules.rules && customRules.rules.length || 0,
            customRules,
        }
    });
}));

module.exports = router;
