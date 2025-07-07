const Queue = require('bull');
const config = require('../../../config.json');
const { logger } = require('../../../log/log_toolbox');
const _MODULE = "HTML_PDF_QUEUE";
const _MAINLOG = "QUEUE";

// Log when queue module is loaded
logger.Topic(_MODULE, _MAINLOG, 'HTML-PDF Queue module loaded and awaiting jobs...');

// Create a Bull queue for HTML-to-PDF jobs
const htmlPdfQueue = new Queue('html-pdf-queue', {
  redis: {
    host: config.redisHost || '127.0.0.1',
    port: config.redisPort || 6379,
  },
});

// Log when Redis connection is established successfully
htmlPdfQueue.on('ready', () => {
  logger.Info(_MODULE, _MAINLOG, 'Successfully connected to Redis (Queue).');
});

// Log Redis connection errors
htmlPdfQueue.on('error', (err) => {
  logger.Error(_MODULE, _MAINLOG, 'Error connecting to Redis (Queue): ' + err);
});

module.exports = htmlPdfQueue;
