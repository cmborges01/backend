/* ------------------------------------------------------
-- auto_print_x
--------------------------------------------------------*/
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
require('dotenv').config()
let express = require('express');

const _MODULE = "auto_print_x";
const _MAINLOG = "MAIN";
const config = require("../../config.json");
const path = require('path');

let app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const printRoutes = require('../routes/printRoutes');
const {logger} = require("../../log/log_toolbox");
app.use(printRoutes);

module.exports = app

process
    .on('SIGTERM', function () {
        logger.Info(_MODULE, _MAINLOG, "Server Terminating");
        process.exit(0);
    })
    .on('SIGINT', function () {
        logger.Info(_MODULE, _MAINLOG, "Server Terminating");
        process.exit(0);
    });

