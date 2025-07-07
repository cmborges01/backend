const htmlPdfQueue = require('./htmlPdfQueue');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const config = require('../../../config.json');
const { logger } = require('../../../log/log_toolbox');

// Startup log
logger.Topic('HTML_PDF_WORKER', 'WORKER', 'HTML-PDF Worker started and ready to process jobs...');

// Log Redis connection events (for Bull queue)
if (htmlPdfQueue && htmlPdfQueue.client) {
  htmlPdfQueue.client.on('ready', () => {
    logger.Info('HTML_PDF_WORKER', 'WORKER', 'Connected to Redis successfully.');
  });
  htmlPdfQueue.client.on('error', (err) => {
    logger.Error('HTML_PDF_WORKER', 'WORKER', 'Redis connection error: ' + err);
  });
}

// Bull queue job lifecycle logs
htmlPdfQueue.on('active', (job) => {
  logger.Info('HTML_PDF_WORKER', 'WORKER', `Processing job ${job.id}`);
});
htmlPdfQueue.on('completed', (job, result) => {
  logger.Info('HTML_PDF_WORKER', 'WORKER', `Job ${job.id} completed: ${JSON.stringify(result)}`);
});
htmlPdfQueue.on('failed', (job, err) => {
  logger.Error('HTML_PDF_WORKER', 'WORKER', `Job ${job.id} failed: ${err}`);
});

// Main job processor for HTML-to-PDF conversion
htmlPdfQueue.process(async (job, done) => {
  try {
    logger.Info('HTML_PDF_WORKER', 'WORKER', 'Received job: ' + JSON.stringify(job.data));
    const obj = job.data.obj;
    const templateConfig = job.data.templateConfig;

    // Generate output file path
    const key = obj.fileName ? obj.fileName : `html_pdf_${Date.now()}`;
    const pathname = key + ".pdf";
    const fullPath = path.join(config.print_out, pathname);

    // Ensure output directory exists
    const directoryPath = path.dirname(fullPath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
      logger.Info('HTML_PDF_WORKER', 'WORKER', 'Output directory created: ' + directoryPath);
    }

    // Convert dimensions to pixels (assuming input in mm)
    const widthPx = Math.round(Number(obj.width) * 3.78);
    const heightPx = Math.round(Number(obj.height) * 3.78);

    logger.Info('HTML_PDF_WORKER', 'WORKER', `Launching headless browser...`);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Prepare HTML content (with UTF-8 meta tag)
    let htmlContent = obj.htmlContent || "<h1>No HTML Content</h1>";
    if (!/<meta\s+charset=["']?utf-8/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<head>/i, '<head><meta charset="UTF-8">');
    }

    logger.Info('HTML_PDF_WORKER', 'WORKER', 'Setting HTML content...');
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    logger.Info('HTML_PDF_WORKER', 'WORKER', `Generating PDF at: ${fullPath}`);
    await page.pdf({
      path: fullPath,
      width: widthPx + "px",
      height: heightPx + "px",
      printBackground: true,
      margin: {
        top: Number(templateConfig.topBorder) + "px",
        left: Number(templateConfig.leftBorder) + "px",
        right: "0px",
        bottom: "0px"
      }
    });

    await browser.close();

    // Get file stats and finish job
    const stats = fs.statSync(fullPath);
    done(null, {
      fileName: pathname,
      sizePdf: Math.round((stats.size * 100) / 1024) / 100,
      numCopies: obj.numCopies || 1
    });
    logger.Info('HTML_PDF_WORKER', 'WORKER', `Job ${job.id} processed successfully!`);
  } catch (err) {
    logger.Error('HTML_PDF_WORKER', 'WORKER', 'Error processing job: ' + err);
    done(err);
  }
});
