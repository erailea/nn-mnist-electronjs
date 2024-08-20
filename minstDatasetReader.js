var fs = require("fs");

var dataFileBuffer = fs.readFileSync(__dirname + "/train-images.idx3-ubyte");
var labelFileBuffer = fs.readFileSync(__dirname + "/train-labels.idx1-ubyte");
var pixelValues = [];

const getTrainData = () => {
  for (var image = 0; image <= 59999; image++) {
    var pixels = [];

    for (var x = 0; x <= 27; x++) {
      for (var y = 0; y <= 27; y++) {
        pixels.push(dataFileBuffer[image * 28 * 28 + (x + y * 28) + 15]);
      }
    }

    var imageData = {};
    imageData[JSON.stringify(labelFileBuffer[image + 8])] = pixels;

    pixelValues.push(imageData);
  }

  return pixelValues.map((x) => {
    const binaryArray = Array(10).fill(0);
    const digit = Object.keys(x)[0];
    binaryArray[parseInt(digit)] = 1;

    return {
      input: Object.values(x)[0],
      output: binaryArray,
      result: digit,
    };
  });
};

module.exports = {
  getTrainData,
};
