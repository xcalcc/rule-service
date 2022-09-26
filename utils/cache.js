const NodeCache = require( "node-cache");
const md5 = require('md5');
const cacheConfig = {
    stdTTL: 0,
    checkperiod: 120,
};
class Cache extends NodeCache{

    constructor(opt) {
        super(opt);
    }
    genCacheKey(req) {
        const originalUrl = req.originalUrl;
        return md5(originalUrl);
    }
}

module.exports = new Cache(cacheConfig);
