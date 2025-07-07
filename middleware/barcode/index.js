/*
 * barcode generator
 */

const fs = require('fs')

module.exports = function (moduleName, options) {
    options.data = options.data || '';
    options.barcolor = options.barcolor || '#000';
    options.bgcolor = options.bgcolor || '#FFF';
    options.w = options.width*5===0?1:options.width*5 || 0;
    options.h = options.height*5===0?1:options.height*5 || 0;
    options.type = (options.type) ? options.type.toUpperCase().trim() : 'PNG';

    return new Barcode(moduleName, options);
}

function Barcode(moduleName, options) {
    this.barcode = require('./lib/' + moduleName.toLowerCase());
    this.options = options;
}

Barcode.prototype.getStream = function (showNumber,ean,callback) {
    this.barcode.createCode(this.options,showNumber,ean, function (err, stream) {
        callback(err, stream);
    });
}

Barcode.prototype.saveImage = function (outfile,showNumber,ean, callback) {
    this.getStream(showNumber,ean,function (err, stream) {
        if (err) return callback(err, '');
        fs.writeFile(outfile, stream, function (err) {
            if (err) {
                console.log(err)
                callback(err)
            } else callback(outfile)
        })


    });
}
