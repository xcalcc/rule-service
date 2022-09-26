const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const wrapper = require('../utils/asyncWrapper');
const errorDescriptionJsonPath = path.resolve(__dirname, '../data/output/errorDescription/errorDescription.json');
const logger = require('../utils/logger');
const responseController = require('../controller/responseController');
const cache = require('../utils/cache');

const useCache = (req, res, next) => {
    req.span = logger.createTracerSpan('Try to get from cache');
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

router.get('/list', useCache, wrapper((req, res, next) => {
    req.span = logger.createTracerSpan('get error list');
    logger.info(`Called for ${req.path}`);
    const errorDescriptionJson = fs.readJsonSync(errorDescriptionJsonPath, {encode: 'utf8'});

    req.span.finish();
    const cacheKey = cache.genCacheKey(req);
    cache.set(cacheKey, errorDescriptionJson);
    responseController.successCallBack(res, {
        data: errorDescriptionJson,
    });
}));


module.exports = router;
