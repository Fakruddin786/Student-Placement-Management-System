const express = require("express");

const {
  createInterview,
  updateInterviewStatus,
  getStudentInterviews,
} = require("../controllers/interviewController");

const router = express.Router();

// Create / schedule interview
router.post("/", createInterview);

// Get interview schedule for a student
router.get("/student/:studentId", getStudentInterviews);

// Update interview status
router.put("/:id/status", updateInterviewStatus);

module.exports = router;