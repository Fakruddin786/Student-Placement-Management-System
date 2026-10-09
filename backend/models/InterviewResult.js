const mongoose = require("mongoose");

const interviewResultSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    technicalScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    hrScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    decision: {
      type: String,
      enum: ["Selected", "Rejected", "On Hold"],
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    resultDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InterviewResult",
  interviewResultSchema
);