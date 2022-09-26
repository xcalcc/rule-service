const express = require('express');
const router = express.Router();
const wrapper = require('../utils/asyncWrapper');
const logger = require('../utils/logger');
const responseController = require('../controller/responseController');

router.get('/list', wrapper((req, res) => {

}));

module.exports = router;
