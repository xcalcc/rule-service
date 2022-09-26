const position = 'utils/asyncWrapper.js';
const logger = require('./logger');
const responseController = require('../controller/responseController');
module.exports = fn => {
    if (typeof fn !== 'function') {
        throw new Error('fn should be a function');
    }
    return async (req, res, next) => {
        if(req.query['locale']=='zh-CN') {
            req.query['locale'] = 'cn';
        }
        try {
            return await fn.apply(this, [req, res, next]);
        } catch(e) {
            const correlationId = req.id;
            logger.error(e.message, {
                file: position,
                correlationId,
                method: fn.name || 'asyncWrapper()'
            });
            return responseController.errorCallBack(res, {
                error: e.message || 'server error',
            });
        }
    }
};