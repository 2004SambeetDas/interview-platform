const express = require("express");
const router = express.Router();

const {
  createInterview,
  getInterviewById
} = require("../store/interview.store");

// CREATE INTERVIEW
router.post("/", (req, res) => {
  const interview = createInterview(req.body);

  res.status(201).json({
    message: "Interview created successfully",
    interview
  });
});

// GET INTERVIEW BY ID (optional but useful)
router.get("/:id", (req, res) => {
  const interviewId = Number(req.params.id);
  const interview = getInterviewById(interviewId);

  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }

  res.json(interview);
});

module.exports = router;
