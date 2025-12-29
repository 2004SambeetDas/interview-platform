const express = require("express");

const interviewRoutes = require("./routes/interview.routes");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Interview Platform Server is running");
});

app.use("/interview", interviewRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
