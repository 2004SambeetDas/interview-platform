app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: "language and code required" });
  }

  let config;

  if (language === "python") config = python;
  else if (language === "c") config = c;
  else if (language === "cpp") config = cpp;
  else if (language === "java") config = java;
  else {
    return res.status(400).json({ message: "Unsupported language" });
  }

  // 🔑 THIS IS THE IMPORTANT PART
  const files =
    typeof config.files === "function"
      ? config.files(code)
      : { [config.filename]: code };

  try {
    const result = await runInDocker({
      image: config.image,
      files,
      command: config.command,
      input
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
