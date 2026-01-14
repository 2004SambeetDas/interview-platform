const express = require("express");
const { runInDocker } = require("./runners/dockerRunner");
const python = require("./languages/python");
const c = require("./languages/c");
const cpp = require("./languages/cpp");

const app = express();
app.use(express.json());

app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: "language and code required" });
  }

  let config;

if (language === "python") {
  config = python;
} else if (language === "c") {
  config = c;
} else if (language === "cpp") {
  config = cpp;
} else {
  return res.status(400).json({ message: "Unsupported language" });
}


  try {
    const result = await runInDocker({
      image: config.image,
      files: {
        [config.filename]: code
      },
      command: config.command,
      input
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(7000, () => {
  console.log("Compiler service running on http://localhost:7000");
});
