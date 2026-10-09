const express = require("express");

const {
  recordInterviewResult,
} = require("../controllers/resultController");

const router = express.Router();

router.post("/", recordInterviewResult);

module.exports = router;