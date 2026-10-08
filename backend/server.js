const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const resultRoutes = require("./routes/resultRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const placementRoutes = require("./routes/placementRoutes");

app.use("/api/interview-results", resultRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/placements", placementRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Interview Management System API is running",
  });
});

// MongoDB connection + server start
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully");

      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
    });
}

module.exports = app;