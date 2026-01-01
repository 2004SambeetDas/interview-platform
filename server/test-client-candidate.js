const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected as:", socket.id);

  socket.emit("interview:join", {
    interviewId: 1,
    role: "candidate",
    name: "Candidate X"
  });

  // Send normal code after 2 seconds
  setTimeout(() => {
    socket.emit("code:update", {
      interviewId: 1,
      content: "function sum(a, b) {\n  return a + b;\n}"
    });
  }, 2000);

  // Trigger paste-like behavior after 5 seconds
  setTimeout(() => {
    socket.emit("code:update", {
      interviewId: 1,
      content: "A".repeat(1000)
    });
  }, 5000);
});

socket.on("code:sync", (data) => {
  console.log("Code synced:", data);
});

socket.on("cheat:signal", (data) => {
  console.log("CHEAT SIGNAL:", data);
});

socket.on("interview:ended", (data) => {
  console.log("INTERVIEW ENDED:", data);
});
