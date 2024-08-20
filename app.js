const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const processedCanvas = document.getElementById("processedCanvas");
const processedCtx = processedCanvas.getContext("2d");

///////////////////
// Bind canvas to listeners
canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mousemove", mouseMove, false);
canvas.addEventListener("mouseup", mouseUp, false);

const lineWidth = 20;


ctx.lineWidth = lineWidth;
ctx.lineJoin = "round";
ctx.lineCap = "round";

var started = false;
var lastx = 0;
var lasty = 0;

// create an in-memory canvas
var memCanvas = document.createElement("canvas");
memCanvas.width = 300;
memCanvas.height = 300;
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
    ctx.clearRect(0, 0, 300, 300);
    // put back the saved content
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
    // When the pen is done, save the resulting context
    // to the in-memory canvas
    memCtx.clearRect(0, 0, 300, 300);
    memCtx.drawImage(canvas, 0, 0);
    points = [];
  }
}

// clear both canvases!
function clear() {
  context.clearRect(0, 0, 300, 300);
  memCtx.clearRect(0, 0, 300, 300);
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

// Creates an object with x and y defined,
// set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky,
// we have to worry about padding and borders
// takes an event and a reference to the canvas
function getMouse(e, canvas) {
  var element = canvas,
    offsetX = 0,
    offsetY = 0,
    mx,
    my;

  // Compute the total offset. It's possible to cache this if you want
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  // We return a simple javascript object with x and y defined
  return {
    x: mx,
    y: my,
  };
}

///////////////////

const blockSize = 30;

function addGridPaintCanvas(blockSize) {
  console.log("Adding grid");

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
  let processedData = [];
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

            if (x === 0 && y === 0)
              console.log("R:", r, "G:", g, "B:", b, "A:", a);

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

      processedData.push(averageAlpha / 255);

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

  console.log("Processed Data:", processedData);
  drawProcessedData(processedImageData);
  console.log("Normalized Data:", processedData);
}

const drawProcessedData = (_processedImageData) => {
  processedCtx.putImageData(_processedImageData, 0, 0);
  addGridProcessedCanvas(blockSize);
};

window.onload = () => {
  addGridPaintCanvas(blockSize);
  addGridProcessedCanvas(blockSize);
};

document.getElementById("processImage").addEventListener("click", processImage);
document
  .getElementById("resetImage")
  .addEventListener("click", resetPaintCanvas);
