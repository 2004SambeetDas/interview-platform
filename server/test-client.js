const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected as:", socket.id);

  socket.emit("interview:join", {
    interviewId: 1,
    role: "recruiter",
    name: "Recruiter A"
  });
});

socket.on("participant:joined", (data) => {
  console.log("Participant joined:", data);
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
