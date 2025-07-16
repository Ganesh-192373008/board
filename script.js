const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let color = document.getElementById("colorPicker").value;
let lineWidth = document.getElementById("penSize").value;
let drawing = false;
let isEraser = false;
let history = [];
let redoStack = [];

document.getElementById("colorPicker").addEventListener("input", e => {
  color = e.target.value;
});

document.getElementById("penSize").addEventListener("input", e => {
  lineWidth = e.target.value;
});

function saveState() {
  history.push(canvas.toDataURL());
  if (history.length > 20) history.shift(); // limit history size
  redoStack = []; // clear redo stack
}

function undo() {
  if (history.length === 0) return;
  redoStack.push(canvas.toDataURL());
  let previous = history.pop();
  let img = new Image();
  img.src = previous;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function redo() {
  if (redoStack.length === 0) return;
  saveState();
  let next = redoStack.pop();
  let img = new Image();
  img.src = next;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function toggleEraser() {
  isEraser = !isEraser;
  document.getElementById("colorPicker").disabled = isEraser;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.send(JSON.stringify({ type: 'clear' }));
  saveState();
}

// WebSocket setup
let protocol = window.location.protocol === "https:" ? "wss" : "ws";
let socket = new WebSocket(`${protocol}://${window.location.host}`);

socket.onopen = () => console.log("✅ WebSocket connected");
socket.onerror = err => console.error("❌ WebSocket error:", err);
socket.onclose = () => console.log("🔌 WebSocket disconnected");

socket.onmessage = function(event) {
  event.data.text().then((message) => {
    const data = JSON.parse(message);
    if (data.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
  }).catch(err => console.error("Error reading message:", err));
};

function draw(x0, y0, x1, y1, color = 'black', size = 2, emit = true) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
  ctx.lineWidth = size;
  ctx.stroke();
  ctx.closePath();

  if (!emit) return;
  const data = {
    x0, y0, x1, y1,
    color: isEraser ? "#FFFFFF" : color,
    size: size,
    type: 'draw'
  };
  socket.send(JSON.stringify(data));
}

let last = {};
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  last = { x: e.clientX, y: e.clientY };
  saveState();
});
canvas.addEventListener("mouseup", () => {
  drawing = false;
});
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  draw(last.x, last.y, e.clientX, e.clientY, color, lineWidth, true);
  last = { x: e.clientX, y: e.clientY };
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Save to localStorage and download
function saveImage() {
  const dataURL = canvas.toDataURL("image/png");
  localStorage.setItem("savedWhiteboard", dataURL);
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = dataURL;
  link.click();
}

function viewImage() {
  const saved = localStorage.getItem("savedWhiteboard");
  if (saved) {
    window.open(saved, "_blank");
  } else {
    alert("No saved image found.");
  }
}
