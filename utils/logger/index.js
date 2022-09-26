const serviceMeta = require('../../package.json');
const Logger = require('xcallogger-node');
const logger = new Logger({
    serviceName: serviceMeta.name,
    serviceVersion: serviceMeta.version,
    disableConsole: process.env.DISABLE_VERBOSE==='true',
    // jaegerConfig: {
    //     collectorUrl: process.env.JAEGER_URL,
    //     sampleRate: 0.01,
    //     sampleType: 'probabilistic' //const, probabilistic, ratelimiting, remote
    // },
    // logstashConfig: {
    //     applicationName: serviceMeta.name,
    //     pid: process.pid,
    //     label: serviceMeta.name,
    //     mode: process.env.LOGGING_LOGSTASH_TRANSPORT || 'udp',
    //     host: process.env.LOGGING_LOGSTASH_URL,
    //     port: process.env.LOGGING_LOGSTASH_PORT,
    // },
    // elasticsearchConfig: {
    //     level: 'info',
    //     host: process.env.ELASTICSEARCH_URL,
    // },
    fileConfigs: [
        {
            level: 'info',
            rotation: true,
            dirname: `${process.env.LOG_FILE_PATH || './logs'}/info`
        },
        {
            level: 'error',
            rotation: true,
            dirname: `${process.env.LOG_FILE_PATH || './logs'}/error`
        },
    ],
})
module.exports = logger;