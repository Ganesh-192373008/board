const canvas = document.getElementById('board');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket   = new WebSocket(`${protocol}://${window.location.host}`);

let drawing = false;
let last    = {};

function draw(x0, y0, x1, y1, color = 'black', emit = true) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth   = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    socket.send(JSON.stringify({ x0, y0, x1, y1, color }));
  }
}

socket.onmessage = e => {
  try {
    const { x0, y0, x1, y1, color } = JSON.parse(e.data);
    draw(x0, y0, x1, y1, color, false);
  } catch (err) {
    console.error('Malformed WS message:', err);
  }
};

canvas.onmousedown = e => {
  drawing = true;
  last = { x: e.clientX, y: e.clientY };
};

canvas.onmouseup = () => (drawing = false);

canvas.onmousemove = e => {
  if (!drawing) return;
  draw(last.x, last.y, e.clientX, e.clientY, 'black', true);
  last = { x: e.clientX, y: e.clientY };
};
