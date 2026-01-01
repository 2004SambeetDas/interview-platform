const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const interviewRoutes = require("./routes/interview.routes");
const {
  getInterviewById,
  updateInterviewCode
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



  
  socket.on("interview:join", ({ interviewId, role, name }) => {
    const interview = getInterviewById(interviewId);

    // Interview must exist and not be ended
    if (!interview || interview.ended) {
      socket.emit("join:error", { message: "Interview not available" });
      return;
    }

    // Role must be valid
    if (!["recruiter", "candidate"].includes(role)) {
      socket.emit("join:error", { message: "Invalid role" });
      return;
    }

    // Role must not already be taken
    if (interview.participants[role]) {
      socket.emit("join:error", { message: `${role} already joined` });
      return;
    }
    
    socket.interviewId = interviewId;
    socket.role = role;
    socket.name = name;

    // Update interview state
    interview.participants[role] = { name };

    // Join socket.io room
    socket.join(String(interviewId));

    // 🔹 PART C — Sync existing code to late joiner
    if (interview.code && interview.code.length > 0) {
      socket.emit("code:sync", {
        content: interview.code,
        updatedBy: "server",
        timestamp: Date.now()
      });
    }

    // Notify others (FACT, not request)
    io.to(String(interviewId)).emit("participant:joined", {
      role,
      name
    });
  });

  socket.on("code:update", ({ interviewId, content }) => {
    const interview = getInterviewById(interviewId);

    // Interview must exist
    if (!interview || interview.ended) return;

    // Only candidate can send code
    if (socket.role !== "candidate") return;

    // Anti-cheat signal #1: large sudden jump
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

    // Persist authoritative snapshot
    updateInterviewCode(interviewId, content);

    // Broadcast authoritative update
    io.to(String(interviewId)).emit("code:sync", {
      content,
      updatedBy: socket.name,
      timestamp: Date.now()
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

      io.to(String(interviewId)).emit("participant:left", {
        role,
        name
      });
    }
  });
});

// ---- START SERVER ----
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
