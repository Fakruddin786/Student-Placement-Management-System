const Placement = require("../models/Placement");

// Create placement record
const createPlacement = async (req, res) => {
  try {
    const {
      studentId,
      companyId,
      interviewId,
      jobRole,
      package: salaryPackage,
      placementDate,
      status,
    } = req.body;

    // Required field validation
    if (
      !studentId ||
      !companyId ||
      !interviewId ||
      !jobRole ||
      salaryPackage === undefined
    ) {
      return res.status(400).json({
        message: "Required placement fields are missing",
      });
    }

    // Validate package
    if (Number(salaryPackage) < 0 || isNaN(Number(salaryPackage))) {
      return res.status(400).json({
        message: "Package must be a valid positive number",
      });
    }

    // Validate status
    const validStatuses = ["Selected", "Placed", "Rejected"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid placement status",
      });
    }

    // Create placement
    const placement = await Placement.create({
      studentId,
      companyId,
      interviewId,
      jobRole,
      package: Number(salaryPackage),
      placementDate: placementDate || new Date(),
      status: status || "Selected",
    });

    res.status(201).json({
      message: "Student placement details saved successfully",
      placement,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save placement details",
      error: error.message,
    });
  }
};


// Get placement history for a student
const getStudentPlacementHistory = async (req, res) => {
  try {
    const placements = await Placement.find({
      studentId: req.params.studentId,
    })
      .sort({
        placementDate: -1,
      })
      
      .populate("interviewId");

    res.status(200).json({
      message: "Student placement history fetched successfully",
      placements,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch student placement history",
      error: error.message,
    });
  }
};


module.exports = {
  createPlacement,
  getStudentPlacementHistory,
};