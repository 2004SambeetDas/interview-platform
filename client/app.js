const socket = io("http://localhost:3000");

const log = document.getElementById("log");
const editor = document.getElementById("editor");

const logEvent = (msg) => {
  log.textContent += msg + "\n";
};

document.getElementById("joinBtn").onclick = () => {
  const interviewId = Number(document.getElementById("interviewId").value);
  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value;
  const token = document.getElementById("token").value;

  socket.emit("interview:join", {
    interviewId,
    role,
    name,
    token
  });
};

editor.addEventListener("input", () => {
  socket.emit("code:update", {
    interviewId: Number(document.getElementById("interviewId").value),
    content: editor.value
  });
});

socket.on("participant:joined", (data) => {
  logEvent(`Joined: ${data.role} (${data.name})`);
});

socket.on("code:sync", (data) => {
  editor.value = data.content;
  logEvent(`Code updated by ${data.updatedBy}`);
});

socket.on("cheat:signal", (data) => {
  logEvent(`CHEAT SIGNAL: ${data.type}`);
});

socket.on("interview:ended", (data) => {
  logEvent(`Interview ended: ${data.reason}`);
});

socket.on("join:error", (data) => {
  logEvent(`Join error: ${data.message}`);
});
