import React from 'react';
import { Link } from 'react-router-dom';
import companyService from '../services/companyService';

export default function Home() {
  const isAuthenticated = companyService.isAuthenticated();

  return (
    <div className="container py-5">
      <div className="p-5 mb-4 bg-light rounded-4 shadow-sm border text-center">
        <div className="container-fluid py-4">
          <span className="badge bg-primary px-3 py-2 fs-6 mb-3">Placement Management System</span>
          <h1 className="display-5 fw-bold text-dark mb-3">Company & Job Management Module</h1>
          <p className="col-md-8 fs-5 text-muted mx-auto mb-4">
            Welcome to the recruitment portal for corporate partners and campus placement cells.
            Register your company, set up your organizational profile, and prepare for upcoming placement drives.
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {isAuthenticated ? (
              <Link to="/company/profile" className="btn btn-primary btn-lg px-4 fw-semibold shadow-sm">
                🏢 Go to Company Profile
              </Link>
            ) : (
              <>
                <Link to="/company/register" className="btn btn-primary btn-lg px-4 fw-semibold shadow-sm">
                  Register Company
                </Link>
                <Link to="/company/login" className="btn btn-outline-primary btn-lg px-4 fw-semibold">
                  Company Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="fs-1 mb-2">📋</div>
            <h5 className="fw-bold">1. Register Company</h5>
            <p className="text-muted small">
              Secure onboarding with official corporate email, phone, and hashed password credentials.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="fs-1 mb-2">🔐</div>
            <h5 className="fw-bold">2. JWT Authentication</h5>
            <p className="text-muted small">
              Stateless token-based authorization ensuring protected access to profile management APIs.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="fs-1 mb-2">🏢</div>
            <h5 className="fw-bold">3. Profile Creation</h5>
            <p className="text-muted small">
              Build a comprehensive company profile including domain, website, description, and location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
