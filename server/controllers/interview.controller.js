// In-memory storage
let interviews = [];
let interviewIdCounter = 1;

const createInterview = (req, res) => {
  const { role, mode, duration } = req.body;

  const newInterview = {
    id: interviewIdCounter++,
    role,
    mode,
    duration,
    participants: {
      recruiter: null,
      candidate: null
    }
  };

  interviews.push(newInterview);

  res.status(201).json({
    message: "Interview created successfully",
    interview: newInterview
  });
};

const getInterviewById = (req, res) => {
  const interviewId = parseInt(req.params.id);

  const interview = interviews.find(
    (item) => item.id === interviewId
  );

  if (!interview) {
    return res.status(404).json({
      message: "Interview not found"
    });
  }

  res.json({
    message: "Interview fetched successfully",
    interview
  });
};

const joinInterview = (req, res) => {
  const interviewId = parseInt(req.params.id);
  const { participantRole, name } = req.body;

  if (!["recruiter", "candidate"].includes(participantRole)) {
    return res.status(400).json({
      message: "Invalid participant role"
    });
  }

  const interview = interviews.find(
    (item) => item.id === interviewId
  );

  if (!interview) {
    return res.status(404).json({
      message: "Interview not found"
    });
  }

  if (interview.participants[participantRole]) {
    return res.status(400).json({
      message: `${participantRole} already joined`
    });
  }

  interview.participants[participantRole] = {
    name,
    joinedAt: new Date()
  };

  res.json({
    message: `${participantRole} joined interview`,
    interview
  });
};

module.exports = {
  createInterview,
  getInterviewById,
  joinInterview
};
