const Interview = require("../models/Interview");

const {
  scheduleInterview,
  changeInterviewStatus,
} = require("../services/interviewService");


// Create / schedule interview
const createInterview = async (req, res) => {
  try {
    const {
      studentId,
      companyId,
      officerId,
      interviewDate,
      interviewTime,
      round,
      mode,
      venue,
    } = req.body;

    // Required field validation
    if (
      !studentId ||
      !interviewDate ||
      !interviewTime ||
      !round ||
      !mode
    ) {
      return res.status(400).json({
        message: "Required interview scheduling fields are missing",
      });
    }

    // Validate mode
    if (!["Online", "Offline"].includes(mode)) {
      return res.status(400).json({
        message: "Mode must be Online or Offline",
      });
    }

    // Offline interviews should have a venue
    if (mode === "Offline" && !venue) {
      return res.status(400).json({
        message: "Venue is required for offline interviews",
      });
    }

    // Validate interview date
    const date = new Date(interviewDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid interview date",
      });
    }

    // Schedule interview through service
    const interview = await scheduleInterview({
      studentId,
      companyId,
      officerId,
      interviewDate: date,
      interviewTime,
      round,
      mode,
      venue,
    });

    res.status(201).json({
      message: "Interview scheduled successfully",
      interview,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to schedule interview",
      error: error.message,
    });
  }
};


// Update interview status
const updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Scheduled",
      "In Progress",
      "Completed",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid interview status",
      });
    }

    // Update status through service
    const interview = await changeInterviewStatus(
      req.params.id,
      status
    );

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    res.status(200).json({
      message: "Interview status updated successfully",
      interview,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update interview status",
      error: error.message,
    });
  }
};


// Get interview schedule for a student
const getStudentInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      studentId: req.params.studentId,
    }).sort({
      interviewDate: 1,
    });

    res.status(200).json({
      message: "Student interview schedule fetched successfully",
      interviews,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch student interview schedule",
      error: error.message,
    });
  }
};


module.exports = {
  createInterview,
  updateInterviewStatus,
  getStudentInterviews,
};