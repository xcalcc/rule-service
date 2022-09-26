require('dotenv').config({path: '.env'});
const {version, name} = require('./package.json');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const path = require('path');
const app = express();
const logMeta = {
    version: `${version}`,
};
// const system = require('./utils/system');
// system.startSysResourceMonitor();

const startService = () => {
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    const router = require('./routes');

    app.use(helmet());
    app.use(compression());
    app.use(cors());
    app.use(function(req, res, next) {
        res.setHeader("Content-Security-Policy", "img-src 'self' http://* https://picsum.photos");
        return next();
    });
    app.use('/view', express.static(path.resolve(__dirname, './views/dist')));
    app.use('/css', express.static(path.resolve(__dirname, './views/dist/css')));
    app.use('/js', express.static(path.resolve(__dirname, './views/dist/js')));
    app.use('/fonts', express.static(path.resolve(__dirname, './views/dist/fonts')));
    app.use('/', router);

    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'available',
            service: name,
            version,
        });
    });
    // app.use('/uploader', express.static(path.resolve(__dirname, 'ui/build')));
    // app.use('/static', express.static(path.resolve(__dirname, 'ui/build/static')));

    if (process.env.ENVIRONMENT === 'dev') {
        app.set("view engine", "pug");
        app.set("views", path.resolve(__dirname, "views"));
    }

    const port = process.env.PORT || 3003;
    app.listen(port, '0.0.0.0', () => {
        logger.info(`Application started at port:${port}`, logMeta);
    });
}

startService();
