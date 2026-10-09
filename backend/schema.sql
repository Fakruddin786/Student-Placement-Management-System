-- ==============================================================
-- Placement Management System - Database Schema (BAT-33)
-- Company and Job Management Module
-- ==============================================================

CREATE DATABASE IF NOT EXISTS placement_management_db;
USE placement_management_db;

-- 1. Companies Table (Account & Credentials)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Company Profiles Table (Detailed Company Information)
CREATE TABLE IF NOT EXISTS company_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    industry VARCHAR(100) NOT NULL,
    website VARCHAR(255) NOT NULL,
    official_email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_profiles_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Job Postings Table (BAT-34: Company and Job Posting Data Model)
CREATE TABLE IF NOT EXISTS job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    employment_type ENUM('Full-time', 'Part-time', 'Internship', 'Contract') NOT NULL DEFAULT 'Full-time',
    salary_min DECIMAL(12, 2) DEFAULT NULL,
    salary_max DECIMAL(12, 2) DEFAULT NULL,
    application_deadline DATE NOT NULL,
    status ENUM('Draft', 'Active', 'Closed', 'Archived') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_postings_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Job Skills Table (BAT-36: Required Skills per Job Posting)
CREATE TABLE IF NOT EXISTS job_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_posting_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_skills_job_posting_id 
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_job_skill UNIQUE (job_posting_id, skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Job Eligibility Table (BAT-36: Qualification & Eligibility Criteria)
CREATE TABLE IF NOT EXISTS job_eligibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_posting_id INT NOT NULL UNIQUE,
    minimum_qualification VARCHAR(255) DEFAULT NULL,
    minimum_cgpa DECIMAL(3, 2) DEFAULT NULL,
    minimum_percentage DECIMAL(5, 2) DEFAULT NULL,
    graduation_year INT DEFAULT NULL,
    experience_required VARCHAR(100) DEFAULT NULL,
    eligible_branches VARCHAR(255) DEFAULT NULL,
    additional_requirements TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_eligibility_job_posting_id 
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extension Points for Future Jira Subtasks:
-- BAT-37: Company profile view/edit enhancements
-- BAT-38: Centralized validation rules
-- BAT-39: Company job posting dashboard & applicant listing
-- BAT-40: Automated test suite

