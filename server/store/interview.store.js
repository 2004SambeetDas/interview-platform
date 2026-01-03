const crypto = require("crypto");
const { saveSnapshot, loadSnapshot } = require("./persist");

let interviews = loadSnapshot();
let interviewIdCounter =
  interviews.length > 0
    ? Math.max(...interviews.map((i) => i.id)) + 1
    : 1;

const createInterview = (data) => {
  const newInterview = {
    id: interviewIdCounter++,
    ...data,

    recruiterToken: crypto.randomUUID(),
    candidateToken: crypto.randomUUID(),

    code: "",
    codeMeta: {
      lastUpdatedAt: null,
      lastLength: 0
    },

    signals: [],
    ended: false,

    participants: {
      recruiter: null,
      candidate: null
    },

    sessions: {
      recruiter: null,
      candidate: null
    }
  };

  interviews.push(newInterview);
  saveSnapshot(interviews);

  return newInterview;
};

const getInterviewById = (id) => {
  return interviews.find((i) => i.id === id);
};

const updateInterviewCode = (id, content) => {
  const interview = interviews.find((i) => i.id === id);
  if (!interview) return null;

  interview.code = content;
  interview.codeMeta.lastUpdatedAt = Date.now();
  interview.codeMeta.lastLength = content.length;

  saveSnapshot(interviews);

  return interview;
};

const addSignal = (id, signal) => {
  const interview = interviews.find((i) => i.id === id);
  if (!interview) return;

  interview.signals.push(signal);
  saveSnapshot(interviews);
};

module.exports = {
  createInterview,
  getInterviewById,
  updateInterviewCode,
  addSignal
};
