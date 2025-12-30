// interview.store.js
// This module holds the single source of truth for interviews in memory

let interviews = [];
let interviewIdCounter = 1;

const createInterview = (data) => {
  const newInterview = {
    id: interviewIdCounter++,
    ...data,
    code: "", // latest code state
    participants: {
      recruiter: null,
      candidate: null
    }
  };



  interviews.push(newInterview);
  return newInterview;
};

const updateInterviewCode = (id, content) => {
  const interview = interviews.find((i) => i.id === id);
  if (!interview) return null;

  interview.code = content;
  return interview;
};
