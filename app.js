const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");
const { getTrainData } = require("./minstDatasetReader");

let model = tf.sequential();

const size = 280;

const lineWidth = 25;

const blockSize = 10;

const trainData = getTrainData();

const debug = true;

let chart;

async function trainModel() {
  model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [784],
      units: 128,
      activation: "sigmoid",
    })
  );

  model.add(
    tf.layers.dense({
      units: 10,
      activation: "softmax",
    })
  );

  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  const inputs = tf.tensor2d(trainData.map((data) => data.input));

  const targets = tf.tensor2d(trainData.map((data) => data.output));

  console.log("Model training started");
  await model.fit(inputs, targets, {
    epochs: 100,
    shuffle: true,
  });

  console.log("Model training complete");
}

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const processedCanvas = document.getElementById("processedCanvas");
const processedCtx = processedCanvas.getContext("2d");

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mousemove", mouseMove, false);
canvas.addEventListener("mouseup", mouseUp, false);

ctx.lineWidth = lineWidth;
ctx.lineJoin = "round";
ctx.lineCap = "round";

var started = false;

var memCanvas = document.createElement("canvas");
memCanvas.width = size;
memCanvas.height = size;
var memCtx = memCanvas.getContext("2d");
var points = [];

function mouseDown(e) {
  var m = getMouse(e, canvas);
  points.push({
    x: m.x,
    y: m.y,
  });
  started = true;
}

function mouseMove(e) {
  if (started) {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(memCanvas, 0, 0);
    var m = getMouse(e, canvas);
    points.push({
      x: m.x,
      y: m.y,
    });
    drawPoints(ctx, points);
  }
}

function mouseUp(e) {
  if (started) {
    started = false;
    memCtx.clearRect(0, 0, size, size);
    memCtx.drawImage(canvas, 0, 0);
    points = [];
  }
}

function clear() {
  context.clearRect(0, 0, size, size);
  memCtx.clearRect(0, 0, size, size);
}

function drawPoints(ctx, points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  addGridPaintCanvas(blockSize);
  // draw a basic circle instead
  if (points.length < 6) {
    var b = points[0];
    ctx.beginPath(),
      ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0),
      ctx.closePath(),
      ctx.fill();
    return;
  }
  ctx.beginPath(), ctx.moveTo(points[0].x, points[0].y);
  // draw a bunch of quadratics, using the average of two points as the control point
  for (i = 1; i < points.length - 2; i++) {
    var c = (points[i].x + points[i + 1].x) / 2,
      d = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);
  }
  ctx.quadraticCurveTo(
    points[i].x,
    points[i].y,
    points[i + 1].x,
    points[i + 1].y
  ),
    ctx.stroke();
}

function getMouse(e, canvas) {
  var element = canvas,
    offsetX = 0,
    offsetY = 0,
    mx,
    my;

  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  return {
    x: mx,
    y: my,
  };
}

function addGridPaintCanvas(blockSize) {
  ctx.beginPath();

  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let x = 0; x < canvas.width; x += blockSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += blockSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;
}

function addGridProcessedCanvas(blockSize) {
  processedCtx.beginPath();
  processedCtx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  processedCtx.lineWidth = 1;
  processedCtx.lineCap = "round";
  processedCtx.globalAlpha = 1;

  for (let x = 0; x < canvas.width; x += blockSize) {
    processedCtx.moveTo(x, 0);
    processedCtx.lineTo(x, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += blockSize) {
    processedCtx.moveTo(0, y);
    processedCtx.lineTo(canvas.width, y);
  }
  processedCtx.stroke();
}

function resetPaintCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  addGridPaintCanvas(blockSize);
  resetProcessedCanvas();
}

function resetProcessedCanvas() {
  processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
  addGridProcessedCanvas(blockSize);
}

const processImage = async () => {
  let processedData = [];
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const width = imageData.width;
  const height = imageData.height;

  for (let x = 0; x < height; x += blockSize) {
    for (let y = 0; y < width; y += blockSize) {
      let totalAlpha = 0;
      let count = 0;

      const innerBlockSize = blockSize - 2; // Adjust as needed (e.g., 2 pixels border)
      const startX = x + 1;
      const startY = y + 1;

      for (let dx = 0; dx < innerBlockSize; dx++) {
        for (let dy = 0; dy < innerBlockSize; dy++) {
          const pixelX = startX + dx;
          const pixelY = startY + dy;
          if (pixelX < width && pixelY < height) {
            const index = (pixelY * width + pixelX) * 4;
            const a = imageData.data[index + 3];
            totalAlpha += a;
            count++;
          }
        }
      }

      const averageAlpha = totalAlpha / count;

      processedData.push(averageAlpha);
    }
  }

  if (debug) console.log("Processed Data:", JSON.stringify(processedData));

  drawProcessedData(processedData);

  await predict(processedData);
};

const predict = async (_processedData) => {
  const testInput = tf.tensor2d([_processedData]);
  const prediction = model.predict(testInput);
  prediction.print();

  const result = Array.from(prediction.dataSync()).map((x, i) => [
    i.toString(),
    x,
  ]);

  chart.data(result);
};

const drawProcessedData = (_processedData) => {
  processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
  for (let x = 0; x < processedCanvas.height; x += blockSize) {
    for (let y = 0; y < processedCanvas.width; y += blockSize) {
      const index = (x / blockSize) * (size / blockSize) + y / blockSize;
      const a = _processedData[index];
      processedCtx.fillStyle = `rgba(0, 0, 0, ${a / 255})`;
      console.log(processedCtx.fillStyle);
      processedCtx.fillRect(x, y, blockSize, blockSize);
    }
  }
  addGridProcessedCanvas(blockSize);
};

const testModelData = async () => {
  const digit = document.getElementById("trainModelDigit").value;
  const index = document.getElementById("trainModelIndex").value;
  const input = trainData.filter((x) => x.result === digit)[index].input;
  drawProcessedData(input);
  predict(input);
  document.getElementById("trainModelIndex").value = parseInt(index) + 1;
};

const saveModel = async () => {
  const modelPath = path.join(__dirname, "models");

  // Ensure the directory exists
  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath);
  }

  const backupPath = path.join(__dirname, "models", new Date().toISOString());

  if (fs.existsSync(backupPath)) {
    fs.rmdirSync(backupPath);
  }

  const saveResults = await model.save(`file://${modelPath}`);
  await model.save(`file://${backupPath}`);
  console.log("Model saved:", saveResults);
};

const loadModel = async () => {
  const modelPath = path.join(__dirname, "models", "model.json");

  if (fs.existsSync(modelPath)) {
    const loadedModel = await tf.loadLayersModel(`file://${modelPath}`);
    console.log("Model loaded:", loadedModel);
    return loadedModel;
  } else {
    console.log("Model not found.");
    return null;
  }
};

window.onload = async () => {
  addGridPaintCanvas(blockSize);
  addGridProcessedCanvas(blockSize);
  //if exists load model if not train model
  let loadedModel = await loadModel();
  if (loadedModel) model = loadedModel;
  else await trainModel();

  chart = anychart.bar([]);
  chart.title("Results");
  chart.container("chart");
  chart.draw();
};

document.getElementById("processImage").addEventListener("click", processImage);
document
  .getElementById("resetImage")
  .addEventListener("click", resetPaintCanvas);
document.getElementById("saveModel").addEventListener("click", saveModel);
document.getElementById("trainModel").addEventListener("click", trainModel);
document
  .getElementById("testModelData")
  .addEventListener("click", testModelData);
