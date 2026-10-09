# Placement Management System (PMS)
## Module: Company and Job Management

This project is a modular full-stack placement management system designed for campus recruitment, corporate relations, and job drive management.

---

### Jira Subtasks Tracking
- [x] **BAT-33** – Implement Company Registration and Profile Creation
- [x] **BAT-34** – Set up the Company and Job Posting Data Models and Database Fields
- [x] **BAT-35** – Create Job Posting Create and Edit Workflows
- [x] **BAT-36** – Required skills and eligibility criteria
- [x] **BAT-37** – Company profile view/edit enhancements
- [x] **BAT-38** – Validation rules
- [x] **BAT-39** – Company job postings management
- [x] **BAT-40** – Testing suite expansion (Company profile and job management workflows)

---

## 1. Technology Stack

- **Frontend**: React.js (Vite), Bootstrap 5, React Router DOM, Axios
- **Backend**: Node.js, Express.js (MVC Architecture)
- **Database**: MySQL 8.0 (with `mysql2/promise` connection pooling & transactions)
- **Security / Auth**: JSON Web Tokens (JWT), bcrypt password hashing, Company Ownership Verification

---

## 2. Project Architecture

```
Devops LAB/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection pool (dateStrings enabled)
│   ├── controllers/
│   │   ├── companyController.js # Handles registration, auth, profile
│   │   └── jobController.js     # Job create, get, update, list, delete with skills & eligibility (BAT-35, BAT-36, BAT-39)
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT authorization guard (derives req.company.id)
│   ├── models/
│   │   ├── companyModel.js      # Company data access & 1-to-many relationship helpers
│   │   └── jobPostingModel.js   # JobPosting, JobSkills, JobEligibility models & transactions
│   ├── routes/
│   │   ├── companyRoutes.js     # Express routes for company endpoints
│   │   └── jobRoutes.js         # Express routes for job management endpoints (BAT-35, BAT-39)
│   ├── scripts/
│   │   ├── initDb.js            # Automated MySQL database & schema runner
│   │   └── seedData.js          # Minimal seed script (Company + 2 Jobs)
│   ├── utils/
│   │   └── validation.js        # Input validation logic (Registration, Profile, Jobs, Skills, Eligibility - BAT-38)
│   ├── schema.sql               # Full MySQL table definitions
│   ├── server.js                # Express app entry point
│   ├── test_bat33.js            # Automated integration tests for BAT-33
│   ├── test_bat34.js            # Automated model & constraint tests for BAT-34
│   ├── test_bat35.js            # Automated create & edit integration tests for BAT-35
│   ├── test_bat36.js            # Automated skills & eligibility tests for BAT-36 (24 tests)
│   ├── test_bat37.js            # Automated profile view & edit tests for BAT-37 (21 tests)
│   ├── test_bat38.js            # Automated centralized validation tests for BAT-38 (31 tests)
│   ├── test_bat39.js            # Automated job postings management tests for BAT-39 (22 tests)
│   ├── test_bat40.js            # Automated company profile & job management workflow tests for BAT-40 (40 tests)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable Navbar, FormInput
│   │   ├── pages/               # Home, CompanyRegister, CompanyLogin, CompanyProfile, JobCreate, JobEdit, CompanyJobList, JobDetails
│   │   ├── services/            # companyService.js, jobService.js API clients
│   │   ├── App.jsx              # React Router route registry
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 3. Database Schema

### `companies` Table
Stores primary account credentials and authentication records.
- `id` (INT, PK, Auto Increment)
- `company_name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `contact_number` (VARCHAR(20), NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `company_profiles` Table
Stores detailed company information.
- `id` (INT, PK, Auto Increment)
- `company_id` (INT, UNIQUE, NOT NULL, FK → `companies.id` ON DELETE CASCADE)
- `company_name` (VARCHAR(255), NOT NULL)
- `description` (TEXT, NOT NULL)
- `industry` (VARCHAR(100), NOT NULL)
- `website` (VARCHAR(255), NOT NULL)
- `official_email` (VARCHAR(255), NOT NULL)
- `contact_number` (VARCHAR(20), NOT NULL)
- `address` (VARCHAR(255), NOT NULL)
- `city` (VARCHAR(100), NOT NULL)
- `state` (VARCHAR(100), NOT NULL)
- `pincode` (VARCHAR(20), NOT NULL)
- `logo_url` (VARCHAR(500), DEFAULT NULL)

### `job_postings` Table (BAT-34 & BAT-35)
Stores campus job postings and internships.
- `id` (INT, PK, Auto Increment)
- `company_id` (INT, NOT NULL, FK → `companies.id` ON DELETE CASCADE)
- `job_title` (VARCHAR(255), NOT NULL)
- `description` (TEXT, NOT NULL)
- `location` (VARCHAR(255), NOT NULL)
- `employment_type` (ENUM('Full-time', 'Part-time', 'Internship', 'Contract'), DEFAULT 'Full-time')
- `salary_min` (DECIMAL(12, 2), DEFAULT NULL)
- `salary_max` (DECIMAL(12, 2), DEFAULT NULL)
- `application_deadline` (DATE, NOT NULL)
- `status` (ENUM('Draft', 'Active', 'Closed', 'Archived'), DEFAULT 'Active')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `job_skills` Table (BAT-36)
Normalized 1-to-many relationship from `job_postings`.
- `id` (INT, PK, Auto Increment)
- `job_posting_id` (INT, NOT NULL, FK → `job_postings.id` ON DELETE CASCADE)
- `skill_name` (VARCHAR(100), NOT NULL)
- `created_at` (TIMESTAMP)
- `UNIQUE (job_posting_id, skill_name)` to prevent duplicate skills per job

### `job_eligibility` Table (BAT-36)
1-to-1 eligibility criteria associated with `job_postings`.
- `id` (INT, PK, Auto Increment)
- `job_posting_id` (INT, UNIQUE, NOT NULL, FK → `job_postings.id` ON DELETE CASCADE)
- `minimum_qualification` (VARCHAR(255), DEFAULT NULL)
- `minimum_cgpa` (DECIMAL(3, 2), DEFAULT NULL)
- `minimum_percentage` (DECIMAL(5, 2), DEFAULT NULL)
- `graduation_year` (INT, DEFAULT NULL)
- `experience_required` (VARCHAR(100), DEFAULT NULL)
- `eligible_branches` (VARCHAR(255), DEFAULT NULL)
- `additional_requirements` (TEXT, DEFAULT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## 4. API Endpoints (BAT-33, BAT-35, BAT-36, BAT-37)

### Company & Profile Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/companies/register` | Public | Register a new company account |
| `POST` | `/api/companies/login` | Public | Login and obtain JWT bearer token |
| `GET` | `/api/companies/profile` | Authenticated Company | View authenticated company profile and base account details (BAT-37) |
| `POST` | `/api/companies/profile` | Authenticated Company | Create or save company profile |
| `PUT` | `/api/companies/profile` | Authenticated Company | Update company profile with full validation and sync to companies table (BAT-37) |

### Job Management Endpoints (BAT-35, BAT-36, BAT-39)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs` | Authenticated Company | Create a job posting with optional `skills: []` and `eligibility: {}` (Transactional) |
| `GET` | `/api/jobs/my-jobs` | Authenticated Company | Fetch all job postings for logged-in company with optional `?status=` and `?search=` filters (BAT-39) |
| `GET` | `/api/jobs/:id` | Authenticated Owner | Fetch complete details of a single job posting joined with its skills and eligibility criteria (BAT-39) |
| `GET` | `/api/jobs/my-jobs/:id` | Authenticated Owner | Company alias to retrieve job details with skills and eligibility criteria (BAT-39) |
| `PUT` | `/api/jobs/:id` | Authenticated Owner | Update existing job posting, skills, and eligibility (Ownership enforced & Transactional) |
| `DELETE` | `/api/jobs/:id` | Authenticated Owner | Delete an existing job posting (Ownership enforced & Cascade Cleanup) (BAT-39) |

---

## 5. Setup and Execution Instructions

### A. Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=placement_management_db
   DB_PORT=3306
   JWT_SECRET=super_secret_placement_jwt_key_2026_devops_lab
   JWT_EXPIRES_IN=24h
   ```
3. Initialize the database schema:
   ```bash
   npm run init-db
   ```
4. Start backend server:
   ```bash
   npm start
   # Server runs at http://localhost:5000
   ```

### B. Frontend Setup
1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   # App runs at http://localhost:5173
   ```

---

## 6. Testing Instructions

### Run All Test Suites
```bash
cd backend

# BAT-33 Company Registration & Profile Tests (10 tests)
npm test

# BAT-34 Data Models & Constraint Tests (10 tests)
npm run test:bat34

# BAT-35 Job Posting Create & Edit Integration Tests (16 tests)
npm run test:bat35

# BAT-36 Required Skills & Eligibility Integration Tests (24 tests)
npm run test:bat36

# BAT-37 Company Profile View & Edit Integration Tests (21 tests)
npm run test:bat37

# BAT-38 Centralized Validation Tests (31 tests)
npm run test:bat38

# BAT-39 Job Postings Management List & Details Tests (22 tests)
npm run test:bat39

# BAT-40 Company Profile & Job Management Workflow Tests (40 tests)
npm run test:bat40
```
