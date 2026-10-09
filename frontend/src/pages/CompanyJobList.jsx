import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import companyService from '../services/companyService';
import jobService from '../services/jobService';

export default function CompanyJobList() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    // 1. Authenticate guard
    if (!companyService.isAuthenticated()) {
      navigate('/company/login');
      return;
    }

    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await jobService.getMyJobs();
      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        setError(data.message || 'Unable to load job postings.');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (err.response?.status === 401) {
        companyService.clearAuth();
        navigate('/company/login');
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to load job postings. Please check your network and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(jobId);
    setActionFeedback({ type: '', message: '' });

    try {
      const res = await jobService.deleteJob(jobId);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `Job posting "${jobTitle}" deleted successfully.`,
        });
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setActionFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete job posting.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter jobs by search query and status filter
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      statusFilter === 'All' || job.status?.toLowerCase() === statusFilter.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      job.job_title?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query) ||
      job.employment_type?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // Calculate summary metrics
  const totalCount = jobs.length;
  const activeCount = jobs.filter((j) => j.status === 'Active').length;
  const draftCount = jobs.filter((j) => j.status === 'Draft').length;
  const closedCount = jobs.filter((j) => j.status === 'Closed' || j.status === 'Archived').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="badge bg-success">Active</span>;
      case 'Draft':
        return <span className="badge bg-warning text-dark">Draft</span>;
      case 'Closed':
        return <span className="badge bg-danger">Closed</span>;
      case 'Archived':
        return <span className="badge bg-secondary">Archived</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not disclosed';
    if (min && !max) return `₹${Number(min).toLocaleString()} / yr`;
    if (!min && max) return `Up to ₹${Number(max).toLocaleString()} / yr`;
    return `₹${Number(min).toLocaleString()} - ₹${Number(max).toLocaleString()} / yr`;
  };

  return (
    <div className="container py-5">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">💼 My Job Postings</h2>
          <p className="text-muted mb-0">
            Jira Task <span className="badge bg-primary">BAT-39</span> &bull; Manage campus recruitment opportunities, review eligibility criteria, and track applications.
          </p>
        </div>
        <div>
          <Link to="/company/jobs/create" className="btn btn-primary fw-semibold px-4 shadow-sm">
            ➕ Post New Job
          </Link>
        </div>
      </div>

      {/* Action feedback alert */}
      {actionFeedback.message && (
        <div
          className={`alert alert-${actionFeedback.type} alert-dismissible fade show mb-4`}
          role="alert"
        >
          {actionFeedback.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionFeedback({ type: '', message: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 bg-white h-100">
            <span className="text-muted small fw-semibold text-uppercase">Total Postings</span>
            <h3 className="fw-bold text-dark mt-2 mb-0">{totalCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 bg-white h-100 border-start border-success border-4">
            <span className="text-success small fw-semibold text-uppercase">Active Drives</span>
            <h3 className="fw-bold text-success mt-2 mb-0">{activeCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 bg-white h-100 border-start border-warning border-4">
            <span className="text-warning small fw-semibold text-uppercase">Drafts</span>
            <h3 className="fw-bold text-warning mt-2 mb-0">{draftCount}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 bg-white h-100 border-start border-danger border-4">
            <span className="text-danger small fw-semibold text-uppercase">Closed / Archived</span>
            <h3 className="fw-bold text-danger mt-2 mb-0">{closedCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0 bg-light"
                placeholder="Search jobs by title, location, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-light border"
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-7">
            <div className="d-flex flex-wrap gap-2 justify-content-md-end align-items-center">
              <span className="text-muted small fw-semibold me-1">Status:</span>
              {['All', 'Active', 'Draft', 'Closed', 'Archived'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                    statusFilter === status
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading job postings...</span>
          </div>
          <p className="mt-3 text-muted fw-semibold">Loading your job postings...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-3">
          <div className="fs-1 mb-2 text-danger">⚠️</div>
          <h5 className="fw-bold text-danger mb-2">Unable to Load Jobs</h5>
          <p className="text-muted mb-4">{error}</p>
          <div>
            <button onClick={fetchJobs} className="btn btn-outline-primary px-4 fw-semibold">
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE - NO JOBS POSTED AT ALL */}
      {!loading && !error && jobs.length === 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-3">
          <div className="fs-1 mb-3">📄</div>
          <h4 className="fw-bold text-dark mb-2">No Job Postings Found</h4>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '500px' }}>
            You haven't posted any campus placement opportunities yet. Create your first opening to connect with qualified students and recruit talent.
          </p>
          <div>
            <Link to="/company/jobs/create" className="btn btn-primary px-4 py-2 fw-semibold shadow-sm">
              ➕ Create Your First Job
            </Link>
          </div>
        </div>
      )}

      {/* EMPTY STATE - NO JOBS MATCH SEARCH / FILTER */}
      {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-3">
          <div className="fs-2 mb-2 text-muted">🔍</div>
          <h5 className="fw-bold text-dark mb-2">No Matching Job Postings</h5>
          <p className="text-muted mb-3">
            No job postings match your search for "{searchQuery}" with status "{statusFilter}".
          </p>
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="btn btn-outline-secondary btn-sm px-4 fw-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* JOB LISTINGS */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card border-0 shadow-sm rounded-4 p-4 bg-white transition hover-shadow"
            >
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <h5 className="fw-bold mb-0 text-dark">
                      <Link
                        to={`/company/jobs/${job.id}`}
                        className="text-dark text-decoration-none hover-primary"
                      >
                        {job.job_title}
                      </Link>
                    </h5>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {job.employment_type}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <p className="text-muted small mb-2 line-clamp-2" style={{ maxHeight: '2.8rem', overflow: 'hidden' }}>
                    {job.description}
                  </p>

                  <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
                    <span>📍 {job.location}</span>
                    <span>💰 {formatSalary(job.salary_min, job.salary_max)}</span>
                    <span>
                      📅 Deadline:{' '}
                      <strong className="text-dark">
                        {job.application_deadline
                          ? new Date(job.application_deadline).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </strong>
                    </span>
                    <span className="text-muted">
                      🕒 Posted:{' '}
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Link
                    to={`/company/jobs/${job.id}`}
                    className="btn btn-outline-primary btn-sm px-3 fw-semibold"
                  >
                    👁️ View Details
                  </Link>
                  <Link
                    to={`/company/jobs/${job.id}/edit`}
                    className="btn btn-outline-secondary btn-sm px-3 fw-semibold"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(job.id, job.job_title)}
                    disabled={deletingId === job.id}
                    className="btn btn-outline-danger btn-sm px-2"
                    title="Delete Job Posting"
                  >
                    {deletingId === job.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
