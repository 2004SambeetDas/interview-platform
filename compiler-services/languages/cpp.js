module.exports = {
  image: "gcc:13",
  filename: "main.cpp",
  command: [
    "bash",
    "-lc",
    "g++ main.cpp -O2 -std=c++17 -o main && ./main"
  ]
};
