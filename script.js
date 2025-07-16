const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let color = 'black';
let drawing = false;

// Color picker logic
const colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("input", (e) => {
  color = e.target.value;
});

// WebSocket setup
let protocol = window.location.protocol === "https:" ? "wss" : "ws";
let socket = new WebSocket(`${protocol}://${window.location.host}`);

socket.onopen = () => console.log("✅ WebSocket connected");
socket.onerror = err => console.error("❌ WebSocket error:", err);
socket.onclose = () => console.log("🔌 WebSocket disconnected");

socket.onmessage = function(event) {
  event.data.text().then((message) => {
    const data = JSON.parse(message);
    draw(data.x0, data.y0, data.x1, data.y1, data.color, false);
  }).catch(err => console.error("Error reading message:", err));
};

function draw(x0, y0, x1, y1, color = 'black', emit = true) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  if (!emit) return;
  const data = { x0, y0, x1, y1, color };
  console.log("Sending:", data);
  socket.send(JSON.stringify(data));
}

let last = {};
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  last = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("mouseup", () => {
  drawing = false;
});
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  draw(last.x, last.y, e.clientX, e.clientY, color, true);
  last = { x: e.clientX, y: e.clientY };
});
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Save function
function saveImage() {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL("image/png");
  link.target = "_blank";
  link.click();
}
