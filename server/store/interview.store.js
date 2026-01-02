// interview.store.js
// Single source of truth for interviews (in-memory)

const crypto = require("crypto");

let interviews = [];
let interviewIdCounter = 1;

// -------------------------------------
// CREATE INTERVIEW
// -------------------------------------
const createInterview = (data) => {
  const newInterview = {
    id: interviewIdCounter++,
    ...data,

    // 🔐 Capability-based security tokens (STEP 14)
    recruiterToken: crypto.randomUUID(),
    candidateToken: crypto.randomUUID(),

    // 💻 Live code state
    code: "",
    codeMeta: {
      lastUpdatedAt: null,
      lastLength: 0
    },

    // 🚨 Anti-cheat telemetry
    signals: [],

    // 🔒 Interview lifecycle
    ended: false,

    // 👥 Logical participants
    participants: {
      recruiter: null,
      candidate: null
    },

    // 🔗 Active socket sessions (STEP 15)
    // Tracks which socket currently owns each role
    sessions: {
      recruiter: null, // { socketId, token, name }
      candidate: null  // { socketId, token, name }
    }
  };

  interviews.push(newInterview);
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

  return interview;
};

const addSignal = (id, signal) => {
  const interview = interviews.find((i) => i.id === id);
  if (!interview) return;

  interview.signals.push(signal);
};


module.exports = {
  createInterview,
  getInterviewById,
  updateInterviewCode,
  addSignal
};
