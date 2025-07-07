const app = require("express").Router();
const config = require("../../config.json");
const _MODULE = "Print-Routes";
const _MAINLOG = "MIDDLEWARE";
const fs = require("fs");
const path = require("path");
let parser = require("../modules/fabric2pdfKit");
const axios = require("axios");
const PDFDocument = require("../modules/pdfkit-table/index");
const { logger } = require("../../log/log_toolbox");
const QRCode = require("qrcode");
const barcode = require("../barcode/index");
const { createCanvas } = require("canvas");
const PDF417 = require("pdf417-generator");
const util = require("util");
const stream = require("stream");
const pipeline = util.promisify(stream.pipeline);
const fsPromisses = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const puppeteer = require("puppeteer");
const htmlPdfQueue = require('./jobs/htmlPdfQueue');


app.post("/downloadPDFFile", function(req, res) {
  try {
    let file_name = req.body.FILE_NAME;

    logger.Topic(
      _MODULE,
      _MAINLOG,
      "Downloading request for file :" + file_name
    );
    res.download(config.print_out + file_name);
  } catch (e) {
    res.sendStatus(400);
    logger.Error(
      _MODULE,
      _MAINLOG,
      "[END] Bad Request  with error [ " + e + "]"
    );
  }
});

app.post("/printPDF", async function(req, res) {
  let objects = req.body.objects;
  let file_list = {};

  logger.Info(_MODULE, _MAINLOG, "Starting PDF Printing process...");

  if (
    objects === undefined ||
    objects === null ||
    objects[0] === undefined ||
    objects[0] === null ||
    req.body.printingTemplateConfig.length === 0
  ) {
    const doc = new PDFDocument({ size: "A4" });
    let stream = doc.pipe(fs.createWriteStream("error"));
    doc.end();
    stream.on("finish", () => {
      if (req.body.printingTemplateConfig.length === 0) {
        logger.Error(
          _MODULE,
          _MAINLOG,
          "######################################################################"
        );
        logger.Error(
          _MODULE,
          _MAINLOG,
          "ERROR : No Configuration Template."
        );
        logger.Error(
          _MODULE,
          _MAINLOG,
          "######################################################################"
        );
      }
      logger.Error(
        _MODULE,
        _MAINLOG,
        "PDF " + "error" + ": generation failed !"
      );
      let data = fs.readFileSync("error");
      res.contentType("application/pdf");
      res.setHeader("FILE_NAME", "error");
      res.send(data);
    });
    return;
  }

  let configurationTemplates = JSON.parse(
    JSON.stringify(req.body.printingTemplateConfig)
  );

  const download_image = async (url, image_path) => {
    try {
      const request = await axios.get(url, {
        responseType: "stream"
      });
      await pipeline(request.data, fs.createWriteStream(image_path));
    } catch (error) {
      logger.Error(
        _MODULE,
        _MAINLOG,
        "Download Image Pipeline Failed: " + error
      );

      const fallbackImagePath = config.images + "image_error.png";

      try {
        fs.copyFileSync(fallbackImagePath, image_path);
        logger.Info(_MODULE, _MAINLOG, "Fallback image used successfully.");
      } catch (copyError) {
        logger.Error(
          _MODULE,
          _MAINLOG,
          "Failed to use fallback image: " + copyError
        );
      }
    }
  };

  
  const generateQrCode = async (completedPathName, string) => {
    try {
      return await QRCode.toFile(completedPathName, string, {
        color: {
          dark: "#000000", // black dots
          light: "#0000" // Transparent background
        }
      });
    } catch (err) {
      logger.Error(_MODULE, _MAINLOG, "Generate Qr Code Failed: " + error);
    }
  };

  const generateBarCode = async (outfile, shape) => {
    return new Promise(function(resolve, reject) {
      try {
        let ean13 = barcode("ean13", {
          data: Number(shape.attributesData) + "",
          width: Number(shape.width) * Number(shape.scaleX),
          height: Number(shape.height) * Number(shape.scaleY)
        });

        ean13.saveImage(
          outfile,
          false,
          Number(shape.attributesData) + "",
          function(val) {
            if (typeof val == "object") {
              reject();
              throw Error(
                "Something went wrong while generating barcode, please check your parameters and data"
              );
            } else {
              resolve();
            }
          }
        );
      } catch (err) {
        logger.Error(_MODULE, _MAINLOG, "Generate Bar Code Failed: " + error);
        reject();
      }
    });
  };


  let listToDelete = [];

  try {
    let objects_ = req.body.objects;
    for (let obj of objects_) {
      let idx = objects_.indexOf(obj);
      for (let shape of obj.shapes) {
        if (shape.shapeContentType === "IMAGE") {
          const url = shape.attributesData;
          const fileName = shape.attributesData
            .substring(shape.attributesData.lastIndexOf("/") + 1)
            .split(".")
            .slice(0, -1)
            .join(".");
          const pathname = config.img_out + fileName + ".png";

          if (fs.existsSync(pathname)) {
            shape.src = pathname;
          } else {
            await download_image(url, pathname);
            shape.src = pathname;
            listToDelete.push(shape.src);
          }
        }
        if (shape.shapeContentType === "QR_CODE") {
          let string = shape.attributesData;
          let pathname = uuidv4() + idx + ".jpeg";
          let completedPathName = config.img_out + pathname;

          await generateQrCode(completedPathName, string);
          shape.src = config.img_out + pathname;
          listToDelete.push(shape.src);
        }
        if (shape.shapeContentType === "BAR_CODE") {
          let outfile = config.img_out + "bar_code" + uuidv4() + ".png";
          await generateBarCode(outfile, shape);
          shape.src = outfile;
          listToDelete.push(outfile);
        }
      }
      if (obj.fileName in file_list) {
        obj.fileName = obj.fileName ? obj.fileName : Date.now() + "_" + idx;
        file_list[obj.fileName].push(obj);
      } else {
        obj.fileName = obj.fileName ? obj.fileName : Date.now() + "_" + idx;
        file_list[obj.fileName] = [];
        file_list[obj.fileName].push(obj);
      }
    }
  } catch (err) {
    logger.Error(
      _MODULE,
      _MAINLOG,
      "Error during processing images " + err
    );
    res.status(500);
    res.send(err);
  }

  try {
    let result = [];
    let arg = file_list;
    let idx = 0;

    for (const key in arg) {
      let docs = arg[key];
      const pathname = key + ".pdf";

      const currentTemplateConfig = configurationTemplates.find(
        conf =>
          conf.sizeKey == docs[0].sizeKey
      );

      if (!currentTemplateConfig) {
        const doc = new PDFDocument({ size: "A4" });
        let stream = doc.pipe(fs.createWriteStream("error"));
        doc.end();
        stream.on("finish", () => {
          if (req.body.printingTemplateConfig.length === 0) {
            logger.Error(
              _MODULE,
              _MAINLOG,
              "######################################################################"
            );
            logger.Error(
              _MODULE,
              _MAINLOG,
              "ERROR : No Configuration found."
            );
            logger.Error(
              _MODULE,
              _MAINLOG,
              "######################################################################"
            );
          }
          logger.Error(
            _MODULE,
            _MAINLOG,
            "PDF " + "error" + ": generation failed !"
          );
          let data = fs.readFileSync("error");
          res.contentType("application/pdf");
          res.setHeader("FILE_NAME", "error");
          res.send(data);
        });
        return;
      }

      let pageSize = [
        Number(currentTemplateConfig.pageSizeWidth),
        Number(currentTemplateConfig.pageSizeHeight)
      ];

      let numTickets = 0;
      let lastPage = 0;

      //Create document
      const doc = new PDFDocument({ size: pageSize });
      const fullPath = path.join(config.print_out, pathname);
      const directoryPath = path.dirname(fullPath);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      let stream = doc.pipe(fs.createWriteStream(fullPath));

      let marginX = Number(currentTemplateConfig.leftBorder);
      let marginY = Number(currentTemplateConfig.topBorder);
      let spaceX = Number(currentTemplateConfig.ticketsHorizontalSpacing);
      let spaceY = Number(currentTemplateConfig.ticketsVerticalSpacing);

      let xCur = marginX;
      let yCur = marginY;
      let counter = 0;

      let page_counter = 0;

      for (const document of docs) {
        const ind = docs.indexOf(document);
        let globalCounter = 0;

        let ticketsPerRow = Number(currentTemplateConfig.ticketsPerRow);
        let ticketsPerPage = Number(currentTemplateConfig.ticketsPerPage);

        let objHeight = Number(document.height) * 2.8346456693;
        let objWidth = Number(document.width) * 2.8346456693;
        let borderLine = document.borderLine;

        let numCopies =
          document.numCopies === null ? ticketsPerPage : document.numCopies;

        numTickets += numCopies;
        for (let i = 0; i < Number(numCopies); i++) {
          document.shapes.forEach(shape => {
            if (
              shape.shapeContentType === "IMAGE" ||
              shape.shapeContentType === "QR_CODE"
            ) {
              parser.IMAGE(doc, shape, shape.src, xCur, yCur);
            } else {
              parser[shape.shapeContentType](doc, shape, xCur, yCur);
            }
          });

          if (borderLine === "Y") {
            doc
              .dash(5, { space: 5 })
              .rect(xCur, yCur, objWidth, objHeight)
              .stroke();
          }

          page_counter++; 
          counter++;
          globalCounter++; 
          xCur = xCur + objWidth + spaceX + spaceX;
          if (counter === ticketsPerRow) {
            counter = 0;
            xCur = Number(marginX);
            yCur = yCur + objHeight + spaceY;
          }

          if (
            page_counter === ticketsPerPage &&
            numCopies - globalCounter > 0
          ) {
            page_counter = 0;
            lastPage++;
            doc.addPage();
            xCur = Number(marginX);
            yCur = Number(marginY);
          } else if (page_counter === ticketsPerPage && docs.length - ind > 1) {
            page_counter = 0;
            lastPage++;
            doc.addPage();
            xCur = Number(marginX);
            yCur = Number(marginY);
          }
        }
        if (ind === docs.length - 1 && docs.length - ind > 1) {
          lastPage++;
          await doc.addPage();
          doc.switchToPage(lastPage);
        }
      }

      //End document
      doc.end();
      stream.on("finish", () => {
        logger.Info(
          _MODULE,
          _MAINLOG,
          "PDF " + pathname + " has been generated succesfully!"
        );
        let stats = fs.statSync(config.print_out + pathname);
        result.push({
          fileName: pathname,
          sizePdf: Math.round((stats.size * 100) / 1024) / 100,
          numTickets: numTickets,
          printJobId: docs[0].printJobId
        });
        idx++;
        if (idx === Object.keys(arg).length) {
          listToDelete.forEach(path => {
            fs.access(path, fs.constants.F_OK, err => {
              if (err) {
                logger.Info(
                  _MODULE,
                  _MAINLOG,
                  "File does not exist, skipping delete: " + path
                );
              } else {
                fs.unlink(path, err => {
                  if (err) {
                    logger.Error(
                      _MODULE,
                      _MAINLOG,
                      "Error while trying to delete file: " +
                        path +
                        " Error: " +
                        err
                    );
                  }
                });
              }
            });
          });
          res.send(result);
        }
      });
    }
  } catch (err) {
    logger.Error(_MODULE, _MAINLOG, "Error processing document: " + err);
    res.status(500);
    res.send(err);
  }
});

app.post("/printHTMLPDF2", async function(req, res) {
  let objects = req.body.objects;
  let file_list = {};

  logger.Info(_MODULE, _MAINLOG, "Starting HTML->PDF Printing process...");

  if (!objects || !objects.length || !req.body.printingTemplateConfig.length) {
    res.status(400).send("Missing objects or printingTemplateConfig");
    return;
  }

  let configurationTemplates = JSON.parse(
    JSON.stringify(req.body.printingTemplateConfig)
  );

  let result = [];
  let idx = 0;

  try {
    for (const obj of objects) {
      const key = obj.fileName ? obj.fileName : `html_pdf_${Date.now()}_${idx}`;
      const pathname = key + ".pdf";
      const fullPath = path.join(config.print_out, pathname);
      const directoryPath = path.dirname(fullPath);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }


      const templateConfig = configurationTemplates.find(
        conf => conf.sizeKey == obj.sizeKey
      );
      if (!templateConfig) {
        res.status(400).send("No configuration template found for this object.");
        return;
      }


      const widthPx = Math.round(Number(obj.width) * 3.78);
      const heightPx = Math.round(Number(obj.height) * 3.78);

  
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();

   
      let htmlContent = obj.htmlContent || "<h1>Sem Conteúdo HTML</h1>";
      if (!/<meta\s+charset=["']?utf-8/i.test(htmlContent)) {
        htmlContent = htmlContent.replace(
          /<head>/i,
          '<head><meta charset="UTF-8">'
        );
      }

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });


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

      logger.Info(
        _MODULE,
        _MAINLOG,
        `HTML PDF ${pathname} generated successfully!`
      );

      const stats = fs.statSync(fullPath);
      result.push({
        fileName: pathname,
        sizePdf: Math.round((stats.size * 100) / 1024) / 100,
        numCopies: obj.numCopies || 1
      });
      idx++;
    }

    res.send(result);
  } catch (err) {
    logger.Error(_MODULE, _MAINLOG, "Error processing HTML to PDF: " + err);
    res.status(500).send("Failed to generate PDF from HTML.");
  }
});

app.get("/test", async (req, res) => {
  res.json({ message: "pass!" });
});

app.delete("/deletePDF", async (req, res) => {
  const directoryPath = config.print_out;

  try {
    for (const item of req.body.deleteList) {
      const filePath = path.join(directoryPath, item);
      try {
        await fsPromisses.unlink(filePath);
      } catch (err) {
        console.error(`Error deleting ${filePath}: ${err.message}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error attempting to delete files: ", error.message);
    res.status(500).send("Error attempting to delete files");
  }
});

// Endpoint to check the status of a job by jobId
app.get("/printHTMLPDF/status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  try {
    // Try to fetch the job from the Bull queue
    const job = await htmlPdfQueue.getJob(jobId);

    if (!job) {
      // Log and respond if job not found
      logger.Error("PRINT_HTML_PDF_STATUS", "ENDPOINT", `Job not found: ${jobId}`);
      res.status(404).send("Job not found");
      return;
    }

    // Get job state (queued, active, completed, failed, etc)
    const state = await job.getState();

    // Try to get result only if job is completed
    let result = null;
    if (state === 'completed') {
      // .returnvalue is not always immediately available, use finished() as fallback
      try {
        result = await job.finished();
      } catch (e) {
        logger.Error("PRINT_HTML_PDF_STATUS", "ENDPOINT", `Error retrieving job result for job ${jobId}: ${e}`);
      }
    }

    logger.Info("PRINT_HTML_PDF_STATUS", "ENDPOINT", `Status for job ${jobId}: ${state}`);
    res.json({ state, result });
  } catch (err) {
    logger.Error("PRINT_HTML_PDF_STATUS", "ENDPOINT", `Error checking job status: ${err}`);
    res.status(500).send("Error checking job status.");
  }
});

// Endpoint to queue HTML-to-PDF jobs using Bull/Redis queue
app.post("/printHTMLPDF", async function(req, res) {
  // Extracting objects and template configuration from the request payload
  let objects = req.body.objects;
  let configurationTemplates = req.body.printingTemplateConfig;
  let result = [];
  let idx = 0;

  // Input validation: Check if objects and configurationTemplates exist
  if (!objects || !objects.length || !configurationTemplates.length) {
    logger.Error("PRINT_HTML_PDF", "ENDPOINT", "Missing objects or printingTemplateConfig");
    res.status(400).send("Missing objects or printingTemplateConfig");
    return;
  }

  try {
    for (const obj of objects) {
      // Find the template config that matches the object's sizeKey
      const templateConfig = configurationTemplates.find(conf => conf.sizeKey == obj.sizeKey);

      if (!templateConfig) {
        logger.Error(
          "PRINT_HTML_PDF",
          "ENDPOINT",
          `No configuration template found for object with sizeKey: ${obj.sizeKey}`
        );
        res.status(400).send("No configuration template found for this object.");
        return;
      }

      // Logging job addition
      logger.Info(
        "PRINT_HTML_PDF",
        "ENDPOINT",
        `Adding job to queue for object: ${obj.fileName || idx}`
      );

      // Generate file name for output PDF
      const key = obj.fileName ? obj.fileName : `html_pdf_${Date.now()}_${idx}`;
      const pathname = key + ".pdf";

      // Add the job to the Bull queue
      const job = await htmlPdfQueue.add(
        {
          obj,
          templateConfig
        }
      );

      // Log job successfully queued
      logger.Info(
        "PRINT_HTML_PDF",
        "ENDPOINT",
        `Job added to queue with ID: ${job.id}`
      );

      // Return job id, status, and output file name to client
      result.push({ jobId: job.id, status: 'queued', fileName: pathname });
      idx++;
    }

    // Log total number of jobs sent in this request
    logger.Info(
      "PRINT_HTML_PDF",
      "ENDPOINT",
      `Total jobs queued: ${result.length}`
    );
    res.json(result);

  } catch (err) {
    logger.Error(
      "PRINT_HTML_PDF",
      "ENDPOINT",
      "Error adding job to queue: " + err
    );
    res.status(500).send("Failed to enqueue job.");
  }
});


module.exports = app;
