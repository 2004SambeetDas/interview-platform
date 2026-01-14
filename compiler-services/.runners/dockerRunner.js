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
      "-i",
      "--network=none",
      "-m", "256m",
      "--cpus", "0.5",
      "-v", `${workdir}:/app`,
      "-w", "/app",
      image,
      ...command
    ];

    const docker = spawn("docker", dockerArgs);

    let stdout = "";
    let stderr = "";

    if (input) {
      docker.stdin.write(input);
    }
    docker.stdin.end();

    docker.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    docker.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    docker.on("close", (code) => {
      fs.rmSync(workdir, { recursive: true, force: true });

      resolve({
        exitCode: code,
        stdout,
        stderr
      });
    });

    docker.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = {
  runInDocker
};
