import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CompanyRegister from './pages/CompanyRegister';
import CompanyLogin from './pages/CompanyLogin';
import CompanyProfile from './pages/CompanyProfile';
import JobCreate from './pages/JobCreate';
import JobEdit from './pages/JobEdit';
import CompanyJobList from './pages/CompanyJobList';
import JobDetails from './pages/JobDetails';

function App() {
  return (
    <Router>
      <div className="min-vh-100 d-flex flex-column bg-light">
        <Navbar />

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/company/register" element={<CompanyRegister />} />
            <Route path="/company/login" element={<CompanyLogin />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/company/profile/edit" element={<CompanyProfile initialEditMode={true} />} />
            <Route path="/company/jobs" element={<CompanyJobList />} />
            <Route path="/company/jobs/create" element={<JobCreate />} />
            <Route path="/company/jobs/:id" element={<JobDetails />} />
            <Route path="/company/jobs/:id/edit" element={<JobEdit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-top py-4 text-center text-muted small mt-auto">
          <div className="container">
            <p className="mb-1">
              <strong>Placement Management System</strong> &bull; Company & Job Management Module
            </p>
            <p className="mb-0 text-secondary">
              Jira Subtasks: <span className="badge bg-secondary">BAT-33</span> <span className="badge bg-secondary">BAT-34</span> <span className="badge bg-secondary">BAT-35</span> <span className="badge bg-secondary">BAT-36</span> <span className="badge bg-secondary">BAT-37</span> <span className="badge bg-secondary">BAT-38</span> <span className="badge bg-primary">BAT-39</span> &bull; Full Stack College Project (React &bull; Express &bull; MySQL)
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
