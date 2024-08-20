const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');

let painting = false;
let lastPos = { x: 0, y: 0 };

function startPosition(e) {
  painting = true;
  lastPos = getMousePos(canvas, e);
  draw(e);
}

function endPosition() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting) return;

  const mousePos = getMousePos(canvas, e);
  ctx.lineWidth = 15; // Adjust brush size as needed
  ctx.lineCap = 'round';

  const dist = distanceBetween(lastPos, mousePos);
  const angle = angleBetween(lastPos, mousePos);

  for (let i = 0; i < dist; i++) {
    const x = lastPos.x + Math.sin(angle) * i;
    const y = lastPos.y + Math.cos(angle) * i;
    ctx.globalAlpha = 0.2; // Adjust opacity for the diffuser effect

    // Randomize the brush strokes slightly to create the diffuser effect
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
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

function angleBetween(point1, point2) {
  return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
