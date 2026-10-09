const express = require("express");

const {
  createPlacement,
  getStudentPlacementHistory,
} = require("../controllers/placementController");

const router = express.Router();

// Create / store selected student placement details
router.post("/", createPlacement);

// Get placement history for a student
router.get("/student/:studentId", getStudentPlacementHistory);

module.exports = router;