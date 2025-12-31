const express = require("express");

const interviewRoutes = require("./routes/interview.routes");

const { getInterviewById, updateInterviewCode } = require("./store/interview.store");


const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Interview Platform Server is running");
});

app.use("/interview", interviewRoutes);

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
 
io.on("connection", (socket) => {
    console.log("Auser connected: ", socket.id);
    
    socket.on("code:update", ({ interviewId, content }) => {
  const interview = getInterviewById(interviewId);

  // Interview must exist
  if (!interview || interview.ended) {
    return;
  }

  // Only candidate is allowed to send code
  if (socket.role !== "candidate") {
    return;
  }

    // === Anti-cheat signal #1: large sudden jump ===
  const previousLength = interview.code.length;
  const newLength = content.length;

  const delta = Math.abs(newLength - previousLength);

  if (delta > 500) {
    io.to(String(interviewId)).emit("cheat:signal", {
      type: "LARGE_CODE_JUMP",
      delta,
      at: Date.now()
    });
  }

  // Persist latest code snapshot
  updateInterviewCode(interviewId, content);
  
  // Broadcast code update to everyone in the room
  io.to(String(interviewId)).emit("code:sync", {
    content,
    updatedBy: socket.name,
    timestamp: Date.now()
  });
});

});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

socket.on("interview:join", (payload) => {
  console.log("Join request received:", payload);
});

