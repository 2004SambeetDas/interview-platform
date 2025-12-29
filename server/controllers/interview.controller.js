// In-memory storage
let interviews = [];
let interviewIdCounter = 1;

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

const createInterview = (req, res) => {
  const interviewData = req.body;

  const newInterview = {
    id: interviewIdCounter++,
    ...interviewData
  };

  interviews.push(newInterview);

  res.status(201).json({
    message: "Interview created successfully",
    interview: newInterview
  });
};

module.exports = {
  getInterviewById,
  createInterview
};

