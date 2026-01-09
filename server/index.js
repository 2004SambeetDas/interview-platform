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
} = require("./repository/interview.repository");

const app = express();
const PORT = process.env.PORT || 4000;


app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Interview Platform Server is running");
});

app.use("/interview", interviewRoutes);
app.use("/interview", interviewTelemetryRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("interview:join", ({ interviewId, role, name, token }) => {
    const interview = getInterviewById(interviewId);

    if (!interview || interview.ended) {
      socket.emit("join:error", { message: "Interview not available" });
      return;
    }

    if (!["recruiter", "candidate"].includes(role)) {
      socket.emit("join:error", { message: "Invalid role" });
      return;
    }

    if (
      (role === "recruiter" && token !== interview.recruiterToken) ||
      (role === "candidate" && token !== interview.candidateToken)
    ) {
      socket.emit("join:error", { message: "Unauthorized" });
      return;
    }

    if (interview.participants[role]) {
      socket.emit("join:error", { message: `${role} already joined` });
      return;
    }

    socket.interviewId = interviewId;
    socket.role = role;
    socket.name = name;

    interview.participants[role] = { name };
    socket.join(String(interviewId));

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
    const { lastUpdatedAt, lastLength } = interview.codeMeta;

    if (lastUpdatedAt) {
      const timeDiff = now - lastUpdatedAt;
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

      if (timeDiff > 15000 && Math.abs(lengthDiff) > 200) {
        const signal = {
          type: "IDLE_THEN_LARGE_OUTPUT",
          idleMs: timeDiff,
          charsAdded: Math.abs(lengthDiff),
          at: now
        };
        addSignal(interviewId, signal);
        io.to(String(interviewId)).emit("cheat:signal", signal);
      }
    }

    updateInterviewCode(interviewId, content);

    io.to(String(interviewId)).emit("code:sync", {
      content,
      updatedBy: socket.name,
      timestamp: now
    });
  });

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

const startServer = async () => {
  try {
    await connectRedis();
    console.log("Redis connected");
  } catch {
    console.warn("Redis not available, continuing without it");
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
