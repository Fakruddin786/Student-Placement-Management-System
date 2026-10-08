const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/database');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Placement Management System - Company Module',
    subtask: 'BAT-33, BAT-34, BAT-35, BAT-36, BAT-37',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes); // BAT-35 Job Posting Create/Edit Workflows

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & verify DB connection
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Placement Management Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📌 BAT-33 API: http://localhost:${PORT}/api/companies`);
  console.log(`====================================================`);
  await testConnection();
});

module.exports = app;
