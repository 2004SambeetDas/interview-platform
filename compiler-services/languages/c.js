module.exports = {
  image: "gcc:13",
  filename: "main.c",
  command: [
    "bash",
    "-lc",
    "gcc main.c -O2 -o main && ./main"
  ]
};
