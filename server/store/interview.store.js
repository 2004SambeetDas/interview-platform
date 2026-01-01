// interview.store.js
// This module holds the single source of truth for interviews in memory

let interviews = [];
let interviewIdCounter = 1;

const createInterview = (data) => {
  const newInterview = {
    id: interviewIdCounter++,
    ...data,
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
