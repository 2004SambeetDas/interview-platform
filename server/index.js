const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { connectRedis } = require("./infra/redis");


const interviewRoutes = require("./routes/interview.routes");
const interviewTelemetryRoutes = require("./routes/interviewTelemetry.routes");

const {
  getInterviewById,
  updateInterviewCode,
  addSignal
} = require("../repository/interview.repository");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Interview Platform Server is running");
});

// --------------------
// REST ROUTES
// --------------------
app.use("/interview", interviewRoutes);
app.use("/interview", interviewTelemetryRoutes);

// --------------------
// HTTP + SOCKET.IO SETUP
// --------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// --------------------
// SOCKET.IO LOGIC
// --------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ================================
  // SECURE INTERVIEW JOIN
  // ================================
  socket.on("interview:join", ({ interviewId, role, name, token }) => {
    const interview = getInterviewById(interviewId);

    // Interview must exist and be active
    if (!interview || interview.ended) {
      socket.emit("join:error", { message: "Interview not available" });
      return;
    }

    // Role must be valid
    if (!["recruiter", "candidate"].includes(role)) {
      socket.emit("join:error", { message: "Invalid role" });
      return;
    }

    // 🔐 TOKEN VALIDATION (STEP 14 CORE)
    if (
      (role === "recruiter" && token !== interview.recruiterToken) ||
      (role === "candidate" && token !== interview.candidateToken)
    ) {
      socket.emit("join:error", { message: "Unauthorized access" });
      return;
    }

    // Role must not already be taken
    if (interview.participants[role]) {
      socket.emit("join:error", { message: `${role} already joined` });
      return;
    }

    // Bind identity to socket (authoritative)
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

  // ================================
  // LIVE CODE UPDATE + ANTI-CHEAT
  // ================================
  socket.on("code:update", ({ interviewId, content }) => {
    const interview = getInterviewById(interviewId);
    if (!interview || interview.ended) return;

    // Only candidate can send code
    if (socket.role !== "candidate") return;

    const now = Date.now();
    const lastTime = interview.codeMeta.lastUpdatedAt;
    const lastLength = interview.codeMeta.lastLength;

    // --- Signal 1: Unnatural typing speed ---
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

    // --- Signal 2: Idle then large output ---
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

    // Recruiter disconnects → interview ends
    if (role === "recruiter") {
      interview.ended = true;

      io.to(String(interviewId)).emit("interview:ended", {
        reason: "Recruiter disconnected"
      });
      return;
    }

    // Candidate disconnects → notify recruiter
    if (role === "candidate") {
      interview.participants.candidate = null;

      io.to(String(interviewId)).emit("participant:left", { role, name });
    }
  });
});


// START SERVER

const startServer = async () => {
  try {
    await connectRedis();
    console.log("Redis connected");
  } catch (err) {
    console.warn("Redis not available, continuing without it");
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();

