module.exports = {
  image: "openjdk:21",
  files: (code) => ({
    "Main.java": code
  }),
  command: [
    "sh",
    "-c",
    "javac Main.java && java Main"
  ]
};
