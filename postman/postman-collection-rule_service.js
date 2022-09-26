const newman = require('newman'); // require newman in your project
const path = require('path');

// call newman.run to pass `options` object and wait for callback
newman.run({
    collection: require('./rule_service.postman_collection.json'),
    environment: require('./local.postman_environment.json'),
    reporters: ['htmlextra'],
    iterationCount: 10,
    reporter: {
        htmlextra: {
            export: path.resolve(__dirname, './report.html'),
            // template: './template.hbs'
            // logs: true,
            // showOnlyFails: true,
            // noSyntaxHighlighting: true,
            // testPaging: true,
            browserTitle: "Rule service Newman report",
            title: "Rule service Newman report",
            titleSize: 4,
            // omitHeaders: true,
            // skipHeaders: "Authorization",
            // hideRequestBody: ["Login"],
            // hideResponseBody: ["Auth Request"],
            showEnvironmentData: true,
            // skipEnvironmentVars: ["API_KEY"],
            showGlobalData: true,
            // skipGlobalVars: ["API_TOKEN"],
            skipSensitiveData: true,
            // showMarkdownLinks: true,
            showFolderDescription: true,
            timezone: "China/Beijing"
        }
    }
}, function (err) {
    if (err) { throw err; }
    console.log('collection run complete!');
});