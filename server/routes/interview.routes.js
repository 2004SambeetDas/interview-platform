const express = require("express");
const router = express.Router();

const {
  getInterview,
  createInterview
} = require("../controllers/interview.controller");

router.get("/", getInterview);
router.post("/", createInterview);

module.exports = router;
