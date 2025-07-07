/*
 * Generic barcode drawing functions
 */

const {createCanvas} = require("canvas");
const MODE_BINARY = 0;
const MODE_BARWIDTH = 1;

// constructor
// with defaults
function Barcode1D() {
    this.mode = MODE_BARWIDTH;
    this.width = 0;
    this.height = 0;
    this.background = '#FFF';
    this.barcolor = '#000';
    this.type = 'PNG';
    this.offset = 0;
    this.modulewidth = 1;
}

Barcode1D.MODE_BINARY = MODE_BINARY;
Barcode1D.MODE_BARWIDTH = MODE_BARWIDTH;

/*
 * Convert binary to barwidth (static)
 * This is for compatiblity purposes,
 *
 * @param Sring|Array pattern - binary pattern [1,1,1,0,0,1,0]
 * @return Array - barwidth pattern [3,2,1,1]
 */
Barcode1D.convertToBarwidth = function (pattern) {
    if (!pattern.length) {
        return [];
    }

    var count = 0,
        current = pattern[0],
        ret = [];

    for (var i = 0; i < pattern.length; i++, count++) {
        if (current !== (current = pattern[i])) {
            ret.push(count);
            count = 0;
        }
    }

    ret.push(count);
    return ret;
}


/*
 * set the type for output
 * @param Int width - width of the image
 * @return Object (this)
 */
Barcode1D.prototype.setWidth = function (width) {
    this.width = width;
    return this;
};

/*
 * set the type for output
 * @param Int height - height of the image
 * @return Object (this)
 */
Barcode1D.prototype.setHeight = function (height) {
    this.height = height;
    return this;
};

/*
 * set the pixel width of a single barcode module
 * also calcualtes and sets the offset
 * @param Int basewidth - the width of barcode if the module width was 1px
 * @return Object (this)
 */
Barcode1D.prototype.setModuleWidth = function (basewidth) {
    // bit shift 0 is just a quick way to turn it into an integer
    this.modulewidth = this.width / basewidth >> 0;
    this.offset = this.width % basewidth / 2 >> 0;

    return this;
};

/*
 * Draw using 1d barwiths
 * @param Array pattern = Array of barwidths, alternating between black and white
 * @param function callback
 */
Barcode1D.prototype.draw = function (pattern, showNumber, number, callback) {

// Instantiate the canvas object
    const canvas = createCanvas(Number(this.width), Number(this.height) + (0.25 * Number(this.height)));
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    let pos = this.offset,
        draw = true,
        w;

    for (let i = 0; i < pattern.length; i++) {
        w = pattern[i] * this.modulewidth;
        if (draw) {
            ctx.fillRect(Number(pos), 0, Number(w), Number(this.height));
        }
        pos += w;
        draw ^= true;
    }
    if (showNumber) {
        ctx.textAlign = "center"
        ctx.font = 0.25 * Number(this.height) + "px"
        ctx.fillText(number+"", Number(this.width) / 2, Number(this.height) + (0.22 * Number(this.height)), Number(this.width))
    }
    //Write the image to file
    const buffer = canvas.toBuffer("image/png");
    callback(null, buffer)

};

module.exports = Barcode1D;
