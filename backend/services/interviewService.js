const Interview = require("../models/Interview");

const scheduleInterview = async (interviewData) => {
  return await Interview.create({
    ...interviewData,
    status: "Scheduled",
  });
};

const changeInterviewStatus = async (interviewId, status) => {
  return await Interview.findByIdAndUpdate(
    interviewId,
    { status },
    {
      new: true,
      runValidators: true,
    }
  );
};

module.exports = {
  scheduleInterview,
  changeInterviewStatus,
};