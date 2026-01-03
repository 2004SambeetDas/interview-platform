const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "interviews.snapshot.json");

const saveSnapshot = (interviews) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(interviews, null, 2));
};

const loadSnapshot = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
};

module.exports = {
  saveSnapshot,
  loadSnapshot
};
