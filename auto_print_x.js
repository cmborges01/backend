
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
require('dotenv').config()
let express = require('express');

const _MODULE = "Auto_Print_X";
const _MAINLOG = "MAIN";
const config = require("./config.json");
const path = require('path');


let app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(bodyParser.json());


const printRoutes = require('./middleware/routes/printRoutes');
const {logger} = require("./log/log_toolbox");
app.use(printRoutes);

function init_web_server() {
    logger.Topic(_MODULE, _MAINLOG, " ------------------------  ");
    logger.Topic(_MODULE, _MAINLOG, "[Start] Starting Auto Print X...");
    logger.Topic(_MODULE, _MAINLOG, "[Start] Starting Web Server...");
    let httpServer = http.createServer(app);
    httpServer.listen(config.port, '0.0.0.0');
    logger.Topic(_MODULE, _MAINLOG, "[Run] Http now accepting requests @port: " + config.port);

}

init_web_server();

process
    .on('SIGTERM', function () {
        logger.Info(_MODULE, _MAINLOG, "Server Terminating");
        process.exit(0);
    })
    .on('SIGINT', function () {
        logger.Info(_MODULE, _MAINLOG, "Server Terminating");
        process.exit(0);
    });

