const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

function runInDocker({ image, files, command, input }) {
  return new Promise((resolve, reject) => {
    const runId = uuid();
    const workdir = path.join("/tmp", runId);

    fs.mkdirSync(workdir, { recursive: true });

    for (const filename in files) {
      fs.writeFileSync(path.join(workdir, filename), files[filename]);
    }

    const dockerArgs = [
      "run",
      "--rm",
      "--network=none",
      "--memory=256m",
      "--cpus=0.5",
      "-v", `${workdir}:/app`,
      "-w", "/app",
      image,
      ...command
    ];

    const docker = spawn("docker", dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    docker.stdout.on("data", d => stdout += d.toString());
    docker.stderr.on("data", d => stderr += d.toString());

    docker.on("error", reject);

    docker.on("close", (code) => {
      fs.rmSync(workdir, { recursive: true, force: true });
      resolve({ exitCode: code, stdout, stderr });
    });

    if (input) {
      docker.stdin.write(input);
    }
    docker.stdin.end();
  });
}

module.exports = { runInDocker };

