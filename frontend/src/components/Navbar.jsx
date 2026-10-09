import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import companyService from '../services/companyService';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = companyService.isAuthenticated();
  const company = companyService.getStoredCompany();

  const handleLogout = () => {
    companyService.clearAuth();
    navigate('/company/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold" to="/">
          <span className="badge bg-light text-primary me-2 px-2 py-1 fs-6">PMS</span>
          Placement Management System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <span className="nav-link text-white-50">
                <span className="badge bg-warning text-dark me-1">BAT-33</span> Company Module
              </span>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item me-2">
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active fw-bold text-white' : 'text-white-50'}`
                    }
                    to="/company/jobs"
                  >
                    💼 My Jobs
                  </NavLink>
                </li>
                <li className="nav-item me-2">
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active fw-bold text-white' : 'text-white-50'}`
                    }
                    to="/company/profile"
                  >
                    🏢 Company Profile
                  </NavLink>
                </li>
                <li className="nav-item me-2">
                  <NavLink
                    className={({ isActive }) =>
                      `btn btn-warning btn-sm fw-semibold px-3 ${isActive ? 'active shadow-sm' : ''}`
                    }
                    to="/company/jobs/create"
                  >
                    ➕ Post Job
                  </NavLink>
                </li>
                <li className="nav-item me-3 text-white">
                  <span className="badge bg-light text-dark px-2 py-1">
                    👤 {company?.company_name || 'Company Portal'}
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light btn-sm px-3"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <NavLink
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active fw-bold text-white' : 'text-white-50'}`
                    }
                    to="/company/login"
                  >
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="btn btn-light text-primary fw-semibold btn-sm px-3"
                    to="/company/register"
                  >
                    Register Company
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
