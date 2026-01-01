const { getInterviewById } = require("../store/interview.store");

const getInterviewTelemetry = (req, res) => {
  const interviewId = Number(req.params.id);
  const interview = getInterviewById(interviewId);

  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }

  const token = req.headers["x-interview-token"];

  if (!token || token !== interview.recruiterToken) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const summary = {
    totalSignals: interview.signals.length,
    byType: interview.signals.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {}),
    ended: interview.ended
  };

  res.json({
    interviewId,
    summary,
    signals: interview.signals
  });
};

module.exports = {
  getInterviewTelemetry
};
