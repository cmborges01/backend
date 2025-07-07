const config = require("../../config.json");
const fs = require("fs");
module.exports = {
  BACKGROUND: function(doc, fillColour, width, height) {
    doc.rect(0, 0, width, height);

    doc.fill(fillColour);
    doc.stroke();
  },
  NORMAL_TEXT: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX;
    let shapeRelPositionY;

    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    } else {
      shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
      shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    }

    function stringToBoolean(string) {
      if (string === undefined || string === null) {
        return false;
      }
      return string.toLowerCase() === "true";
    }

    const _width = Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const _height = Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const data =
      fabricJSON.attributesData === null
        ? "TEXT NULL"
        : fabricJSON.attributesData;
    let fontSize = Number(fabricJSON.fontSize) * Number(fabricJSON.scaleX);
    let fontType;

    if (fabricJSON.fontWeight === "bold") {
      fontType = config.fonts_bold + fabricJSON.fontFamily + ".ttf";
    } else if (fabricJSON.fontStyle === "italic") {
      fontType = config.fonts_italic + fabricJSON.fontFamily + ".ttf";
    } else {
      fontType = config.fonts + fabricJSON.fontFamily + ".ttf";
    }
    const _underline = fabricJSON.underline === "true";
    const _strike = fabricJSON.linethrough === "true";
    const _overline = fabricJSON.overline === "true";
    const fontColour = fabricJSON.fill;
    const _align = fabricJSON.textAlign;
    const _characterSpacing = Number(fabricJSON.charSpacing);
    const opacity = fabricJSON.opacity;
    const _oblique = fabricJSON.fontStyle == "italic";
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);

    function splitTextByWidth(doc, text, width, font, size) {
      let words = text.split(" ");
      let lines = [];
      let currentLine = words[0];

      doc.font(font).fontSize(size);

      for (let i = 1; i < words.length; i++) {
        let word = words[i];
        if (doc.widthOfString(currentLine + " " + word) <= width) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      return lines;
    }

    function willTextFit(doc, text, width, height, font, size) {
      let lines = splitTextByWidth(doc, text, width, font, size);

      let lineHeightMultiplier = 1.2;
      const totalTextHeight = lines.length * size * lineHeightMultiplier;

      return totalTextHeight <= height;
    }

    let verticalOffset = 0;

    if (fabricJSON.verticalTextPosition) {
      switch (fabricJSON.verticalTextPosition) {
        case "middle":
          let lines = splitTextByWidth(doc, data, _width, fontType, fontSize);
          let totalTextHeight = lines.length * fontSize * 1.2;
          verticalOffset = (_height - totalTextHeight) / 2;
          break;
        case "bottom":
          let linesForBottom = splitTextByWidth(
            doc,
            data,
            _width,
            fontType,
            fontSize
          );
          let totalTextHeightForBottom = linesForBottom.length * fontSize * 1.2;
          verticalOffset = _height - totalTextHeightForBottom;
          break;
        default:
          break;
      }
    }

    function adjustFontSizeToFit(
      doc,
      text,
      width,
      height,
      font,
      initialSize,
      minSize
    ) {
      let currentSize = initialSize;

      while (currentSize > minSize) {
        if (willTextFit(doc, text, width, height, font, currentSize)) {
          return currentSize;
        }
        currentSize -= 0.1;
      }

      return minSize;
    }

    if (
      stringToBoolean(fabricJSON.shrink) &&
      fontSize > (Number(fabricJSON.shrinkUntil) ?? 1)
    ) {
      fontSize = adjustFontSizeToFit(
        doc,
        data,
        _width,
        _height,
        fontType,
        fontSize,
        fabricJSON.shrinkUntil
      );
    }

    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .font(fontType, Number(fontSize))
      .fillOpacity(opacity)
      .fillColor(fontColour)
      .text(data, shapeRelPositionX, shapeRelPositionY + verticalOffset, {
        width: _width,
        height: _height,
        align: _align,
        underline: _underline,
        strike: _strike,
        oblique: _oblique,
        characterSpacing: _characterSpacing
      });
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });

    if (_overline === true) {
      let w = doc.widthOfString(data);

      doc
        .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
        .lineWidth(fontSize / 10)
        .lineCap("butt")
        .stroke(fontColour)
        .moveTo(shapeRelPositionX, shapeRelPositionY - fontSize / 10)
        .lineTo(shapeRelPositionX + w, shapeRelPositionY - fontSize / 10);

      //Draw
      doc
        .stroke()
        .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    }
    doc.fillOpacity(1);
  },
  FREE_TEXT: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }

    function stringToBoolean(string) {
      if (string === undefined || string === null) {
        return false;
      }
      return string.toLowerCase() === "true";
    }

    const _width = Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const _height = Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const data = fabricJSON.text === null ? "TEXT NULL" : fabricJSON.text;
    let fontSize = Number(fabricJSON.fontSize) * Number(fabricJSON.scaleX);
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    let fontType;
    if (fabricJSON.fontWeight === "bold") {
      fontType = config.fonts_bold + fabricJSON.fontFamily + ".ttf";
    } else if (fabricJSON.fontStyle === "italic") {
      fontType = config.fonts_italic + fabricJSON.fontFamily + ".ttf";
    } else {
      fontType = config.fonts + fabricJSON.fontFamily + ".ttf";
    }
    const fontColour = fabricJSON.fill;
    const _align = fabricJSON.textAlign;
    const _characterSpacing = Number(fabricJSON.charSpacing);
    const opacity = fabricJSON.opacity;
    const _underline = fabricJSON.underline === "true";
    const _strike = fabricJSON.linethrough === "true";
    const _overline = fabricJSON.overline === "true";
    const _oblique = fabricJSON.fontStyle == "italic";

    function splitTextByWidth(doc, text, width, font, size) {
      let words = text.split(" ");
      let lines = [];
      let currentLine = words[0];

      doc.font(font).fontSize(size);

      for (let i = 1; i < words.length; i++) {
        let word = words[i];
        if (doc.widthOfString(currentLine + " " + word) <= width) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      return lines;
    }

    function willTextFit(doc, text, width, height, font, size) {
      let lines = splitTextByWidth(doc, text, width, font, size);

      let lineHeightMultiplier = 1.2;
      const totalTextHeight = lines.length * size * lineHeightMultiplier;

      return totalTextHeight <= height;
    }

    let verticalOffset = 0;

    if (fabricJSON.verticalTextPosition) {
      switch (fabricJSON.verticalTextPosition) {
        case "middle":
          let lines = splitTextByWidth(doc, data, _width, fontType, fontSize);
          let totalTextHeight = lines.length * fontSize * 1.2;
          verticalOffset = (_height - totalTextHeight) / 2;
          break;
        case "bottom":
          let linesForBottom = splitTextByWidth(
            doc,
            data,
            _width,
            fontType,
            fontSize
          );
          let totalTextHeightForBottom = linesForBottom.length * fontSize * 1.2;
          verticalOffset = _height - totalTextHeightForBottom;
          break;
        default:
          break;
      }
    }

    function adjustFontSizeToFit(
      doc,
      text,
      width,
      height,
      font,
      initialSize,
      minSize
    ) {
      let currentSize = initialSize;

      while (currentSize > minSize) {
        if (willTextFit(doc, text, width, height, font, currentSize)) {
          return currentSize;
        }
        currentSize -= 0.1;
      }

      return minSize;
    }

    if (
      stringToBoolean(fabricJSON.shrink) &&
      fontSize > (Number(fabricJSON.shrinkUntil) ?? 1)
    ) {
      fontSize = adjustFontSizeToFit(
        doc,
        data,
        _width,
        _height,
        fontType,
        fontSize,
        fabricJSON.shrinkUntil
      );
    }

    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .font(fontType, Number(fontSize))
      .fillOpacity(opacity)
      .fillColor(fontColour)
      .text(data, shapeRelPositionX, shapeRelPositionY + verticalOffset, {
        width: _width,
        height: _height,
        align: _align,
        underline: _underline,
        strike: _strike,
        oblique: _oblique,
        characterSpacing: _characterSpacing
      });
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    if (_overline === true) {
      let w = doc.widthOfString(data);

      doc
        .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
        .lineWidth(Number(fontSize) / 10)
        .lineCap("butt")
        .stroke(fontColour)
        .moveTo(shapeRelPositionX, shapeRelPositionY - Number(fontSize) / 10)
        .lineTo(
          shapeRelPositionX + w,
          shapeRelPositionY - Number(fontSize) / 10
        );

      //Draw
      doc
        .stroke()
        .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    }
    doc.fillOpacity(1);
  },
  RECTANGLE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const shapeHorizontalLength =
      Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const shapeVerticalLength =
      Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const fillColour = fabricJSON.fill;
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .rect(
        shapeRelPositionX,
        shapeRelPositionY,
        shapeHorizontalLength,
        shapeVerticalLength
      );

    doc.fillOpacity(opacity).fill(fillColour);
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  SQUARE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const shapeHorizontalLength =
      Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const shapeVerticalLength =
      Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const fillColour = fabricJSON.fill;
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .rect(
        shapeRelPositionX,
        shapeRelPositionY,
        shapeHorizontalLength,
        shapeVerticalLength
      );

    doc.fillOpacity(opacity).fill(fillColour);
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  CIRCLE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const radius = Number(fabricJSON.radius) * Number(fabricJSON.scaleX);
    const centerX = shapeRelPositionX + radius;
    const centerY = shapeRelPositionY + radius;
    const fillColour = fabricJSON.fill;
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .circle(centerX, centerY, radius);

    doc.fillOpacity(opacity).fill(fillColour);
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  TRIANGLE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const shapeHorizontalLength =
      Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const shapeVerticalLength =
      Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const fillColour = fabricJSON.fill;
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .polygon(
        [shapeRelPositionX + shapeHorizontalLength / 2, shapeRelPositionY],
        [shapeRelPositionX, shapeVerticalLength + shapeRelPositionY],
        [
          shapeRelPositionX + shapeHorizontalLength,
          shapeVerticalLength + shapeRelPositionY
        ]
      );

    doc.fillOpacity(opacity).fill(fillColour);
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  IMAGE: function(doc, fabricJSON, src, xx_cursor, yy_cursor) {
    const width_img = Number(fabricJSON.width);
    const height_img = Number(fabricJSON.height);
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc.fillOpacity(opacity);
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .image(src, shapeRelPositionX, shapeRelPositionY, {
        width: width_img * fabricJSON.scaleX,
        height: height_img * fabricJSON.scaleY
      });
    doc.fillOpacity(1);
    doc.rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
  },
  BAR_CODE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    //Insert image
    const width_img = Number(fabricJSON.width);
    const height_img = Number(fabricJSON.height);
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const angle = fabricJSON.angle === null ? 0 : Number(fabricJSON.angle);
    const opacity = fabricJSON.opacity;
    doc.fillOpacity(opacity);
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .image(fabricJSON.src, shapeRelPositionX, shapeRelPositionY, {
        width: width_img * fabricJSON.scaleX
      });
    doc.fillOpacity(1);
    doc.rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    const data = Number(fabricJSON.attributesData);
    const fontSize = (width_img * Number(fabricJSON.scaleX)) / 12;
    const fontType = config.fonts + "TTNorms-Bold.ttf";
    const fontColour = "#000000";
    const _align = "center";
    const _characterSpacing =
      fabricJSON.charSpacing === undefined ? 1 : Number(fabricJSON.charSpacing);
    doc
      .rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .font(fontType, fontSize)
      .fillOpacity(opacity)
      .fillColor(fontColour)
      .text(
        data,
        shapeRelPositionX,
        shapeRelPositionY + height_img * fabricJSON.scaleY,
        {
          width: width_img * Number(fabricJSON.scaleX),
          height: height_img,
          lineBreak: false,
          align: _align,
          characterSpacing: _characterSpacing
        }
      );

    //Draw
    doc.stroke();
    doc.rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  BORDER: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const shapeHorizontalLength =
      Number(fabricJSON.width) * Number(fabricJSON.scaleX);
    const shapeVerticalLength =
      Number(fabricJSON.height) * Number(fabricJSON.scaleY);
    const strokeWidth = Number(fabricJSON.strokeWidth);
    const fillColour = fabricJSON.stroke;
    const angle = fabricJSON.angle;
    const opacity = fabricJSON.opacity;
    doc.rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.lineWidth(strokeWidth);
    doc
      .lineCap("butt")
      .stroke(fillColour)
      .moveTo(shapeRelPositionX, shapeRelPositionY)
      .lineTo(
        shapeRelPositionX + shapeHorizontalLength,
        shapeRelPositionY + shapeVerticalLength
      );

    doc.fillOpacity(opacity).fill(fillColour);
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.fillOpacity(1);
  },
  BORDER_LINE: function(doc, fabricJSON, xx_cursor, yy_cursor) {
    let shapeRelPositionX = Number(fabricJSON.left) + xx_cursor;
    let shapeRelPositionY = Number(fabricJSON.top) + yy_cursor;
    if (fabricJSON.groupKey !== null && fabricJSON.groupKey !== undefined) {
      shapeRelPositionX =
        Number(fabricJSON.groupLeft) +
        Number(fabricJSON.left) +
        Number(fabricJSON.groupWidth) / 2 +
        xx_cursor;
      shapeRelPositionY =
        Number(fabricJSON.groupTop) +
        Number(fabricJSON.top) +
        Number(fabricJSON.groupHeight) / 2 +
        yy_cursor;
    }
    const shapeHorizontalLength = Number(fabricJSON.width);
    const shapeVerticalLength = Number(fabricJSON.height);
    const strokeWidth = Number(fabricJSON.strokeWidth);
    const fillColour = fabricJSON.stroke;
    const angle = fabricJSON.angle;
    const opacity = fabricJSON.opacity;
    doc.rotate(angle, { origin: [shapeRelPositionX, shapeRelPositionY] });
    doc.lineWidth(strokeWidth);
    doc
      .lineCap("butt")
      .fillOpacity(opacity)
      .fill(fillColour)
      .stroke(fillColour)
      .moveTo(shapeRelPositionX, shapeRelPositionY)
      .lineTo(
        shapeRelPositionX + shapeHorizontalLength,
        shapeRelPositionY + shapeVerticalLength
      );
    doc.dash(5, { space: 5 });
    //Draw
    doc
      .stroke()
      .rotate(-angle, { origin: [shapeRelPositionX, shapeRelPositionY] })
      .fillOpacity(1);
  }
};
