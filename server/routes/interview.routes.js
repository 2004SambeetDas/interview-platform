const express = require("express");
const router = express.Router();

const {
  getInterviewById,
  createInterview
} = require("../controllers/interview.controller");

router.post("/", createInterview);
router.get("/:id", getInterviewById);

module.exports = router;
