
# AutoPrintX Backend

Backend service for AutoPrintX: a modular solution for automatic PDF document generation from graphical definitions in JSON (Fabric.js) and HTML content.

## 📦 Description

AutoPrintX Backend is a Node.js service built with Express, designed to:
- Receive graphic configurations (objects, images, text) from a web visual editor.
- Generate high-quality, customizable PDF documents using PDFKit and Puppeteer.
- Support multiple workflows: PDF generation from canvas (Fabric.js) or directly from HTML.
- Handle batch processing asynchronously using Bull and Redis job queues.
- Enable download, status checking, and removal of generated PDF files.

## 🚀 Main Features

- **/printPDF**: Accepts layouts in JSON (Fabric.js) and generates PDFs automatically.
- **/printHTMLPDF**: Converts modern HTML/CSS directly to PDF using Puppeteer.
- **/printHTMLPDF/status/:jobId**: Allows checking the status of queued jobs.
- **/downloadPDFFile**: Provides downloads of generated PDF files.
- **/deletePDF**: Deletes obsolete or unwanted PDF files.
- Bull + Redis integration for parallel, scalable job processing.

## ⚙️ Technology Stack

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [PDFKit](https://pdfkit.org/)
- [Puppeteer](https://pptr.dev/)
- [Bull](https://github.com/OptimalBits/bull) (Job Queue)
- [Redis](https://redis.io/)
- [Fabric.js](https://fabricjs.com/) (for compatibility with the frontend)
- [Docker](https://www.docker.com/) *(optional, for deployment)*

## 🏁 Running Locally

1. **Prerequisites**:
   - Node.js (v16+)
   - Redis running (using Docker or local installation)

2. **Installation**:
   ```bash
   git clone https://github.com/<your-username>/autoprintx-backend.git
   cd autoprintx-backend
   npm install

Configuration:

Edit the config.json file to adjust output paths, ports, and Redis credentials as needed.

Start the server:

node auto_print_x.js

Start the queue worker:

node ./middleware/routes/jobs/htmlPdfWorker.js

Testing endpoints:
Use tools like Postman, Insomnia, or the AutoPrintX frontend to test endpoints.



