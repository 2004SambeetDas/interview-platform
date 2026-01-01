const express = require("express");
const router = express.Router();

const {
  getInterviewTelemetry
} = require("../controllers/interviewTelemetry.controller");

router.get("/:id/telemetry", getInterviewTelemetry);

module.exports = router;
