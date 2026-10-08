const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },

    jobRole: {
      type: String,
      required: true,
      trim: true,
    },

    package: {
      type: Number,
      required: true,
      min: 0,
    },

    placementDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Selected", "Placed", "Rejected"],
      default: "Selected",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Placement", placementSchema);