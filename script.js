const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const colorPicker = document.getElementById('colorPicker');
const brushSize   = document.getElementById('brushSize');
const clearBtn    = document.getElementById('clearBtn');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket   = new WebSocket(`${protocol}://${window.location.host}`);

let drawing = false;
let last = {};

function draw(x0, y0, x1, y1, color = 'black', size = 2, emit = true) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    socket.send(JSON.stringify({ type: 'draw', x0, y0, x1, y1, color, size }));
  }
}

// ✅ Clear canvas and optionally emit to others
function clearCanvas(emit = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (emit) {
    socket.send(JSON.stringify({ type: 'clear' }));
  }
}

socket.onmessage = e => {
  try {
    const data = JSON.parse(e.data);
    if (data.type === 'draw') {
      const { x0, y0, x1, y1, color, size } = data;
      draw(x0, y0, x1, y1, color, size, false);
    } else if (data.type === 'clear') {
      clearCanvas(false);
    }
  } catch (err) {
    console.error('Invalid message:', err);
  }
};

canvas.onmousedown = e => {
  drawing = true;
  last = { x: e.clientX, y: e.clientY };
};

canvas.onmouseup = () => (drawing = false);

canvas.onmousemove = e => {
  if (!drawing) return;
  const color = colorPicker.value;
  const size  = parseInt(brushSize.value);
  draw(last.x, last.y, e.clientX, e.clientY, color, size, true);
  last = { x: e.clientX, y: e.clientY };
};

// ✅ Clear button logic
clearBtn.onclick = () => {
  clearCanvas(true);
};
