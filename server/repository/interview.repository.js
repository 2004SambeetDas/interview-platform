// interview.repository.js
// Abstraction over interview storage (in-memory for now)

const {
  createInterview,
  getInterviewById,
  updateInterviewCode,
  addSignal
} = require("../store/interview.store");

module.exports = {
  createInterview,
  getInterviewById,
  updateInterviewCode,
  addSignal
};
