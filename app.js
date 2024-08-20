const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const processedCanvas = document.getElementById("processedCanvas");
const processedCtx = processedCanvas.getContext("2d");

let painting = false;
let lastPos = { x: 0, y: 0 };
const blockSize = 50;

let processedData = [];

function startPosition(e) {
  painting = true;
  lastPos = getMousePos(canvas, e);
  draw(e);
}

function endPosition() {
  painting = false;
  ctx.beginPath();
}

function addGridPaintCanvas(blockSize) {
  console.log("Adding grid");
  ctx.beginPath();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;

  for (let x = 0; x < canvas.width; x += blockSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += blockSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
}

function addGridProcessedCanvas(blockSize) {
  console.log("Adding grid");
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

function draw(e) {
  if (!painting) return;

  const mousePos = getMousePos(canvas, e);
  ctx.lineWidth = 15;
  ctx.lineCap = "round";

  const dist = distanceBetween(lastPos, mousePos);
  const angle = angleBetween(lastPos, mousePos);

  for (let i = 0; i < dist; i++) {
    const x = lastPos.x + Math.sin(angle) * i;
    const y = lastPos.y + Math.cos(angle) * i;
    ctx.globalAlpha = 0.7;

    const offsetX = Math.random() * 10 - 5;
    const offsetY = Math.random() * 10 - 5;

    ctx.beginPath();
    ctx.moveTo(x + offsetX, y + offsetY);
    ctx.lineTo(x + offsetX, y + offsetY);
    ctx.stroke();
  }

  lastPos = mousePos;
}

function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

function distanceBetween(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

function angleBetween(point1, point2) {
  return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}

canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);

function resetPaintCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  addGridPaintCanvas(blockSize);
  resetProcessedCanvas();
}

function resetProcessedCanvas() {
  processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
  addGridProcessedCanvas(blockSize);
}

function processImage() {
  processedData = [];
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processedImageData = processedCtx.createImageData(
    processedCanvas.width,
    processedCanvas.height
  );
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let total = 0;
      let totalAlpha = 0;
      let count = 0;

      const innerBlockSize = blockSize - 2; // Adjust as needed (e.g., 2 pixels border)
      const startX = x + 1;
      const startY = y + 1;

      for (let dy = 0; dy < innerBlockSize; dy++) {
        for (let dx = 0; dx < innerBlockSize; dx++) {
          const pixelX = startX + dx;
          const pixelY = startY + dy;
          if (pixelX < width && pixelY < height) {
            const index = (pixelY * width + pixelX) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const a = imageData.data[index + 3];

            // Calculate the brightness of the pixel (0 to 255)
            const brightness = (r + g + b) / 3;
            total += brightness;
            totalAlpha += a;
            count++;
          }
        }
      }

      // Calculate the average brightness in the block (normalized between 0 and 1)
      const averageBrightness = total / count;
      const averageAlpha = totalAlpha / count;
      const grayValue = Math.floor(averageBrightness);

      processedData.push((255 - averageAlpha) / 255);

      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const pixelX = x + dx;
          const pixelY = y + dy;
          if (
            pixelX < processedImageData.width &&
            pixelY < processedImageData.height
          ) {
            const index = (pixelY * processedImageData.width + pixelX) * 4;
            processedImageData.data[index] = grayValue;
            processedImageData.data[index + 1] = grayValue;
            processedImageData.data[index + 2] = grayValue;
            processedImageData.data[index + 3] = averageAlpha;
          }
        }
      }
    }
  }

  processedCtx.putImageData(processedImageData, 0, 0);
  addGridProcessedCanvas(blockSize);
  console.log("Processed Data:", processedData);
}

window.onload = () => {
  addGridPaintCanvas(blockSize);
  addGridProcessedCanvas(blockSize);
};

document.getElementById("processImage").addEventListener("click", processImage);
document
  .getElementById("resetImage")
  .addEventListener("click", resetPaintCanvas);
