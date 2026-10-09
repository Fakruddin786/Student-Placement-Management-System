const InterviewResult = require("../models/InterviewResult");

const recordInterviewResult = async (req, res) => {
  try {
    const {
      interviewId,
      studentId,
      technicalScore,
      communicationScore,
      hrScore,
      decision,
      remarks,
    } = req.body;

    // Basic validation
    if (
      !interviewId ||
      !studentId ||
      technicalScore === undefined ||
      communicationScore === undefined ||
      hrScore === undefined ||
      !decision
    ) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    // Validate scores
    const scores = [
      technicalScore,
      communicationScore,
      hrScore,
    ];

    if (
      scores.some(
        (score) =>
          Number(score) < 0 ||
          Number(score) > 100 ||
          isNaN(Number(score))
      )
    ) {
      return res.status(400).json({
        message: "Scores must be between 0 and 100",
      });
    }

    // Validate decision
    const validDecisions = [
      "Selected",
      "Rejected",
      "On Hold",
    ];

    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        message: "Invalid decision",
      });
    }

    // Calculate overall score
    const overallScore = Number(
      (
        (Number(technicalScore) +
          Number(communicationScore) +
          Number(hrScore)) /
        3
      ).toFixed(2)
    );

    // Save result
    const result = await InterviewResult.create({
      interviewId,
      studentId,
      technicalScore,
      communicationScore,
      hrScore,
      overallScore,
      decision,
      remarks,
    });

    res.status(201).json({
      message: "Interview result recorded successfully",
      result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to record interview result",
      error: error.message,
    });
  }
};

module.exports = {
  recordInterviewResult,
};