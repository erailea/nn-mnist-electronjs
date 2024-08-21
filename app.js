const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");
const { getTrainData } = require("./minstDatasetReader");

const CANVAS_SIZE = 280;
const LINE_WIDTH = 25;
const BLOCK_SIZE = 10;
const DEBUG = true;

let model = tf.sequential();
let chart;
let isDrawing = false;
let points = [];

const trainData = getTrainData();

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");
const processedCanvas = document.getElementById("processedCanvas");
const processedCtx = processedCanvas.getContext("2d");
const memCanvas = createMemoryCanvas(CANVAS_SIZE);

document.getElementById("processImage").addEventListener("click", processImage);
document
  .getElementById("resetImage")
  .addEventListener("click", resetPaintCanvas);
document.getElementById("saveModel").addEventListener("click", saveModel);
document.getElementById("trainModel").addEventListener("click", trainModel);
document
  .getElementById("testModelData")
  .addEventListener("click", testModelData);

canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mousemove", onMouseMove, false);
canvas.addEventListener("mouseup", onMouseUp, false);

window.onload = async () => {
  drawGridProcessed(CANVAS_SIZE, BLOCK_SIZE);
  drawGridPaint(CANVAS_SIZE, BLOCK_SIZE);
  
  let loadedModel = await loadModel();
  if (loadedModel) {
    model = loadedModel;
  } else {
    await trainModel();
  }

  initializeChart();
};

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

function onMouseDown(event) {
  const { x, y } = getMousePosition(event, canvas);
  points.push({ x, y });
  isDrawing = true;
}

function onMouseMove(event) {
  if (!isDrawing) return;

  const { x, y } = getMousePosition(event, canvas);
  points.push({ x, y });
  redrawCanvas();
}

function onMouseUp() {
  if (isDrawing) {
    isDrawing = false;
    saveDrawingToMemory();
    points = [];
  }
}

function saveDrawingToMemory() {
  const memCtx = memCanvas.getContext("2d");
  memCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  memCtx.drawImage(canvas, 0, 0);
}

function getMousePosition(event, canvas) {
  var element = canvas,
    offsetX = 0,
    offsetY = 0;

  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  return {
    x: event.pageX - offsetX,
    y: event.pageY - offsetY,
  };
}

function redrawCanvas() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.drawImage(memCanvas, 0, 0);
  drawLines(ctx, points);
}

function drawLines(ctx, points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGridPaint(CANVAS_SIZE, BLOCK_SIZE);
  if (points.length < 6) {
    var b = points[0];
    ctx.beginPath(),
      ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0),
      ctx.closePath(),
      ctx.fill();
    return;
  }
  ctx.beginPath(), ctx.moveTo(points[0].x, points[0].y);

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
  );
  ctx.stroke();
}

function processImage() {
  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const processedData = extractBlockAverages(
    imageData,
    CANVAS_SIZE,
    BLOCK_SIZE
  );

  if (DEBUG) console.log("Processed Data:", JSON.stringify(processedData));

  drawProcessedData(processedCtx, processedData, BLOCK_SIZE);
  predict(processedData);
}

function extractBlockAverages(imageData, canvasSize, blockSize) {
  const { width, height, data } = imageData;
  const processedData = [];

  for (let x = 0; x < width; x += blockSize) {
    for (let y = 0; y < height; y += blockSize) {
      const averageAlpha = calculateAverageAlpha(x, y, width, blockSize, data);
      processedData.push(averageAlpha);
    }
  }

  return processedData;
}

function calculateAverageAlpha(x, y, width, blockSize, data) {
  const innerBlockSize = blockSize - 2;
  const startX = x + 1;
  const startY = y + 1;
  let totalAlpha = 0;
  let count = 0;

  for (let dx = 0; dx < innerBlockSize; dx++) {
    for (let dy = 0; dy < innerBlockSize; dy++) {
      const pixelX = startX + dx;
      const pixelY = startY + dy;

      if (pixelX < width && pixelY < width) {
        const index = (pixelY * width + pixelX) * 4;
        totalAlpha += data[index + 3];
        count++;
      }
    }
  }

  return totalAlpha / count;
}

async function predict(processedData) {
  const inputTensor = tf.tensor2d([processedData]);
  const prediction = model.predict(inputTensor);
  const result = Array.from(prediction.dataSync()).map((x, i) => [
    i.toString(),
    x,
  ]);

  chart.data(result);
}

function drawProcessedData(ctx, processedData, blockSize) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  processedData.forEach((alpha, index) => {
    const x = (index % (CANVAS_SIZE / blockSize)) * blockSize;
    const y = Math.floor(index / (CANVAS_SIZE / blockSize)) * blockSize;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha / 255})`;
    ctx.fillRect(y, x, blockSize, blockSize);
  });

  drawGridProcessed(CANVAS_SIZE, BLOCK_SIZE);
}

function testModelData() {
  const digit = document.getElementById("trainModelDigit").value;
  const index = document.getElementById("trainModelIndex").value;
  const input = trainData.filter((x) => x.result == digit)[index].input;

  drawProcessedData(processedCtx, input, BLOCK_SIZE);
  predict(input);

  document.getElementById("trainModelIndex").value = parseInt(index) + 1;
}

async function saveModel() {
  const modelPath = path.join(__dirname, "models");

  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath);
  }

  const backupPath = path.join(modelPath, new Date().toISOString());

  if (fs.existsSync(backupPath)) {
    fs.rmdirSync(backupPath);
  }

  const saveResults = await model.save(`file://${modelPath}`);
  await model.save(`file://${backupPath}`);

  console.log("Model saved:", saveResults);
}

async function loadModel() {
  const modelPath = path.join(__dirname, "models", "model.json");

  if (fs.existsSync(modelPath)) {
    const loadedModel = await tf.loadLayersModel(`file://${modelPath}`);
    console.log("Model loaded:", loadedModel);
    return loadedModel;
  } else {
    console.log("Model not found.");
    return null;
  }
}

function initializeCanvas(ctx, size, blockSize) {
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawGridPaint(size, blockSize);
}

function drawGridPaint(size, blockSize) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.1;

  for (let x = 0; x < size; x += blockSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
  }

  for (let y = 0; y < size; y += blockSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
  }

  ctx.stroke();

  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;
}

function drawGridProcessed(size, blockSize) {
  processedCtx.beginPath();
  processedCtx.lineWidth = 1;
  processedCtx.globalAlpha = 0.1;

  for (let x = 0; x < size; x += blockSize) {
    processedCtx.moveTo(x, 0);
    processedCtx.lineTo(x, size);
  }

  for (let y = 0; y < size; y += blockSize) {
    processedCtx.moveTo(0, y);
    processedCtx.lineTo(size, y);
  }

  processedCtx.stroke();
  processedCtx.globalAlpha = 1;
}

function initializeChart() {
  chart = anychart.column([]);
  chart.container("chart");
  chart.draw();
}

function resetPaintCanvas() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  processedCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGridPaint(CANVAS_SIZE, BLOCK_SIZE);
  drawGridProcessed(CANVAS_SIZE, BLOCK_SIZE);
}

function createMemoryCanvas(size) {
  const memoryCanvas = document.createElement("canvas");
  memoryCanvas.width = size;
  memoryCanvas.height = size;
  return memoryCanvas;
}
