const htmlPdfQueue = require('./jobs/htmlPdfQueue');
console.log(typeof htmlPdfQueue);        // Deve dar 'object'
console.log(typeof htmlPdfQueue.add);    // Deve dar 'function'
