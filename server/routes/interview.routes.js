const express = require("express");
const router = express.Router();

const {
  createInterview,
  getInterviewById,
  joinInterview
} = require("../controllers/interview.controller");

router.post("/", createInterview);
router.get("/:id", getInterviewById);
router.post("/:id/join", joinInterview);

module.exports = router;
