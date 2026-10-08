import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import companyService from '../services/companyService';
import jobService from '../services/jobService';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    // 1. Authenticate guard
    if (!companyService.isAuthenticated()) {
      navigate('/company/login');
      return;
    }

    fetchJobDetails();
  }, [id, navigate]);

  const fetchJobDetails = async () => {
    setLoading(true);
    setError('');
    setErrorCode(null);

    try {
      const response = await jobService.getJobById(id);
      if (response.success && response.job) {
        setJob(response.job);
      } else {
        setError('Job details could not be retrieved.');
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      const status = err.response?.status;
      setErrorCode(status);

      if (status === 404) {
        setError('Job posting not found. It may have been deleted or does not exist.');
      } else if (status === 403) {
        setError('Access denied: You do not have permission to view this job posting.');
      } else if (status === 401) {
        companyService.clearAuth();
        navigate('/company/login');
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to load job details. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="badge bg-success fs-6 px-3 py-2">Active</span>;
      case 'Draft':
        return <span className="badge bg-warning text-dark fs-6 px-3 py-2">Draft</span>;
      case 'Closed':
        return <span className="badge bg-danger fs-6 px-3 py-2">Closed</span>;
      case 'Archived':
        return <span className="badge bg-secondary fs-6 px-3 py-2">Archived</span>;
      default:
        return <span className="badge bg-light text-dark fs-6 px-3 py-2">{status}</span>;
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not disclosed';
    if (min && !max) return `₹${Number(min).toLocaleString()} / year`;
    if (!min && max) return `Up to ₹${Number(max).toLocaleString()} / year`;
    return `₹${Number(min).toLocaleString()} - ₹${Number(max).toLocaleString()} / year`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading job details...</span>
        </div>
        <p className="mt-3 text-muted fw-semibold">Loading job posting information...</p>
      </div>
    );
  }

  // ERROR STATE
  if (error || !job) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <div className="fs-1 mb-3 text-danger">
                {errorCode === 403 ? '🔒' : errorCode === 404 ? '🔍' : '⚠️'}
              </div>
              <h4 className="fw-bold text-dark mb-2">
                {errorCode === 403
                  ? 'Access Denied'
                  : errorCode === 404
                  ? 'Job Not Found'
                  : 'Error Loading Job'}
              </h4>
              <p className="text-muted mb-4">{error}</p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/company/jobs" className="btn btn-outline-secondary px-4 fw-semibold">
                  ← Back to Job Postings
                </Link>
                {errorCode !== 403 && errorCode !== 404 && (
                  <button onClick={fetchJobDetails} className="btn btn-primary px-4 fw-semibold">
                    🔄 Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Navigation Breadcrumb / Back button */}
      <div className="mb-4">
        <Link to="/company/jobs" className="btn btn-link text-decoration-none text-muted ps-0 fw-semibold">
          ← Back to Job Postings
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 fs-6">
                💼 {job.employment_type}
              </span>
              {getStatusBadge(job.status)}
              <span className="badge bg-light text-muted border px-3 py-1">
                Jira Task <strong className="text-dark">BAT-39</strong>
              </span>
            </div>

            <h2 className="fw-bold text-dark mb-1">{job.job_title}</h2>
            <p className="text-muted mb-0">
              🏢 {job.company_name} &bull; 📍 {job.location}
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Link
              to={`/company/jobs/${job.id}/edit`}
              className="btn btn-primary px-4 fw-semibold shadow-sm"
            >
              ✏️ Edit Job
            </Link>
            <Link
              to="/company/jobs"
              className="btn btn-outline-secondary px-3 fw-semibold"
            >
              All Postings
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Job Description, Skills & Eligibility */}
        <div className="col-12 col-lg-8">
          {/* Card: Job Overview & Description */}
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
            <h4 className="fw-bold text-dark mb-3">📄 Job Description</h4>
            <div className="text-secondary lh-lg mb-4" style={{ whiteSpace: 'pre-line' }}>
              {job.description}
            </div>

            <hr className="my-4 text-muted opacity-25" />

            <h5 className="fw-bold text-dark mb-3">📌 Key Position Details</h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small d-block">Work Location:</span>
                <span className="fw-semibold text-dark fs-6">📍 {job.location}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Employment Type:</span>
                <span className="fw-semibold text-dark fs-6">💼 {job.employment_type}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Salary Range:</span>
                <span className="fw-semibold text-dark fs-6">💰 {formatSalary(job.salary_min, job.salary_max)}</span>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Application Deadline:</span>
                <span className="fw-semibold text-dark fs-6">📅 {formatDate(job.application_deadline)}</span>
              </div>
            </div>
          </div>

          {/* Card: Required Skills (BAT-36) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-dark mb-0">🛠️ Required Skills</h4>
              <span className="badge bg-secondary-subtle text-secondary px-3 py-1">
                BAT-36 Feature
              </span>
            </div>
            <p className="text-muted small mb-3">
              Technical proficiencies, frameworks, and competencies required for candidates applying to this role.
            </p>

            {job.skills && Array.isArray(job.skills) && job.skills.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-6 rounded-pill"
                  >
                    ⚡ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-light rounded-3 p-3 text-muted small">
                ℹ️ No specific skill requirements specified for this job posting.
              </div>
            )}
          </div>

          {/* Card: Eligibility Criteria (BAT-36) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-dark mb-0">🎓 Eligibility Criteria</h4>
              <span className="badge bg-secondary-subtle text-secondary px-3 py-1">
                BAT-36 Feature
              </span>
            </div>
            <p className="text-muted small mb-4">
              Academic thresholds and candidate prerequisites required to qualify for this campus recruitment opening.
            </p>

            {job.eligibility ? (
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Minimum Qualification:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.minimum_qualification || 'Any Degree / Not specified'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Minimum CGPA:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.minimum_cgpa !== null && job.eligibility.minimum_cgpa !== undefined
                        ? `${Number(job.eligibility.minimum_cgpa).toFixed(2)} / 10.0`
                        : 'No minimum CGPA requirement'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Minimum Percentage:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.minimum_percentage !== null && job.eligibility.minimum_percentage !== undefined
                        ? `${Number(job.eligibility.minimum_percentage).toFixed(1)}%`
                        : 'No minimum percentage requirement'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Graduation Batch / Year:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.graduation_year || 'Any Batch'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Experience Level:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.experience_required || 'Fresher'}
                    </span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block">Eligible Branches / Specializations:</span>
                    <span className="fw-bold text-dark fs-6">
                      {job.eligibility.eligible_branches || 'All Branches'}
                    </span>
                  </div>
                </div>

                {job.eligibility.additional_requirements && (
                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted small d-block">Additional Prerequisites / Remarks:</span>
                      <p className="fw-semibold text-dark mb-0 mt-1" style={{ whiteSpace: 'pre-line' }}>
                        {job.eligibility.additional_requirements}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-light rounded-3 p-3 text-muted small">
                ℹ️ No specific academic eligibility criteria specified for this job posting.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Posting Metadata & Actions */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-3">⚙️ Posting Status</h5>

            <ul className="list-group list-group-flush mb-3">
              <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Drive Status:</span>
                <span>{getStatusBadge(job.status)}</span>
              </li>
              <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Posting ID:</span>
                <span className="fw-semibold text-dark">#{job.id}</span>
              </li>
              <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Created Date:</span>
                <span className="fw-semibold text-dark">{formatDate(job.created_at)}</span>
              </li>
              <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                <span className="text-muted small">Last Modified:</span>
                <span className="fw-semibold text-dark">{formatDate(job.updated_at)}</span>
              </li>
            </ul>

            <div className="d-grid gap-2">
              <Link
                to={`/company/jobs/${job.id}/edit`}
                className="btn btn-primary fw-semibold py-2 shadow-sm"
              >
                ✏️ Edit Posting (BAT-35)
              </Link>
              <Link
                to="/company/jobs"
                className="btn btn-outline-secondary fw-semibold py-2"
              >
                ← Back to List (BAT-39)
              </Link>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white">
            <h6 className="fw-bold text-white-50 text-uppercase small">Placement Guide</h6>
            <h5 className="fw-bold mb-2">Need to adjust criteria?</h5>
            <p className="text-white-50 small mb-3">
              You can update the job description, required skills, and graduation eligibility criteria anytime before the deadline.
            </p>
            <div>
              <Link
                to={`/company/jobs/${job.id}/edit`}
                className="btn btn-light text-primary btn-sm fw-semibold px-3"
              >
                Modify Opening
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
