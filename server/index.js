const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const interviewRoutes = require("./routes/interview.routes");
const {
  getInterviewById,
  updateInterviewCode,
  addSignal
} = require("./store/interview.store");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Interview Platform Server is running");
});

app.use("/interview", interviewRoutes);

// ---- HTTP + SOCKET.IO SETUP ----
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ---- SOCKET.IO LOGIC ----
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ================================
  // INTERVIEW JOIN (AUTHORITATIVE)
  // ================================
  socket.on("interview:join", ({ interviewId, role, name }) => {
    const interview = getInterviewById(interviewId);

    if (!interview || interview.ended) {
      socket.emit("join:error", { message: "Interview not available" });
      return;
    }

    if (!["recruiter", "candidate"].includes(role)) {
      socket.emit("join:error", { message: "Invalid role" });
      return;
    }

    if (interview.participants[role]) {
      socket.emit("join:error", { message: `${role} already joined` });
      return;
    }

    // Bind identity to socket
    socket.interviewId = interviewId;
    socket.role = role;
    socket.name = name;

    interview.participants[role] = { name };
    socket.join(String(interviewId));

    // Sync existing code to late joiner
    if (interview.code.length > 0) {
      socket.emit("code:sync", {
        content: interview.code,
        updatedBy: "server",
        timestamp: Date.now()
      });
    }

    io.to(String(interviewId)).emit("participant:joined", { role, name });
  });

  socket.on("code:update", ({ interviewId, content }) => {
    const interview = getInterviewById(interviewId);
    if (!interview || interview.ended) return;
    if (socket.role !== "candidate") return;

    const now = Date.now();
    const lastTime = interview.codeMeta.lastUpdatedAt;
    const lastLength = interview.codeMeta.lastLength;

    // --- Behavioral Signal 1: Unnatural typing speed ---
    if (lastTime) {
      const timeDiff = now - lastTime;
      const lengthDiff = content.length - lastLength;

      if (timeDiff < 2000 && lengthDiff > 300) {
        const signal = {
          type: "UNNATURAL_TYPING_SPEED",
          charsAdded: lengthDiff,
          timeMs: timeDiff,
          at: now
        };

        addSignal(interviewId, signal);
        io.to(String(interviewId)).emit("cheat:signal", signal);
      }
    }

    // --- Behavioral Signal 2: Idle then large output ---
    if (lastTime) {
      const idleTime = now - lastTime;
      const outputJump = Math.abs(content.length - lastLength);

      if (idleTime > 15000 && outputJump > 200) {
        const signal = {
          type: "IDLE_THEN_LARGE_OUTPUT",
          idleMs: idleTime,
          charsAdded: outputJump,
          at: now
        };

        addSignal(interviewId, signal);
        io.to(String(interviewId)).emit("cheat:signal", signal);
      }
    }

    // Persist authoritative snapshot
    updateInterviewCode(interviewId, content);

    // Broadcast authoritative update
    io.to(String(interviewId)).emit("code:sync", {
      content,
      updatedBy: socket.name,
      timestamp: now
    });
  });

  // ================================
  // DISCONNECT HANDLING (SECURITY)
  // ================================
  socket.on("disconnect", () => {
    const { interviewId, role, name } = socket;
    if (!interviewId || !role) return;

    const interview = getInterviewById(interviewId);
    if (!interview) return;

    if (role === "recruiter") {
      interview.ended = true;

      io.to(String(interviewId)).emit("interview:ended", {
        reason: "Recruiter disconnected"
      });
      return;
    }

    if (role === "candidate") {
      interview.participants.candidate = null;

      io.to(String(interviewId)).emit("participant:left", { role, name });
    }
  });
});

// ---- START SERVER ----
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
