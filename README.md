# Student Profile Management System

## Project Overview
This project is a beginner-friendly Django application for managing a student's profile, skills, certifications, projects, internships, and resume documents.

## Problem Statement
Students often need a centralized place to store academic and professional details. This system helps them maintain a clean profile, upload resumes, and manage their experience data securely and privately.

## Features
- Student profile creation and editing
- Resume upload with validation
- Skills management
- Certifications management
- Project tracking
- Internship tracking
- Login/logout support
- Secure profile isolation per user
- REST API endpoints for profile data and related records
- Automated Django tests

## Technology Stack
- Python
- Django
- Django REST Framework
- SQLite
- HTML, CSS, JavaScript

## Project Structure
- config/
- profiles/
- media/
- db.sqlite3
- manage.py
- requirements.txt
- README.md

## Installation Instructions
1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # Linux/macOS
   venv\Scripts\activate      # Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
4. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```
5. Run the server:
   ```bash
   python manage.py runserver
   ```

## Virtual Environment Setup
```bash
python -m venv venv
source venv/bin/activate
```

## Dependency Installation
```bash
pip install Django djangorestframework
pip freeze > requirements.txt
```

## Database Migration Commands
```bash
python manage.py makemigrations
python manage.py migrate
```

## Superuser Creation
```bash
python manage.py createsuperuser
```

## Running the Development Server
```bash
python manage.py runserver
```

## Frontend URLs
- / -> root redirect to login or profile
- /login/
- /profile/
- /profile/view/
- /admin/

## API Endpoints
- /api/profile/
- /api/students/ (authenticated alias for the current user's student profile)
- /api/users/ (staff-only account CRUD; passwords are write-only and hashed)
- /api/skills/
- /api/certifications/
- /api/projects/
- /api/internships/
- /api/companies/
- /api/jobs/
- /api/placement-drives/
- /api/applications/
- /api/interviews/
- /api/results/
- /api/notifications/
- /api/resumes/

The student placement workflow is available at `/placements/`. It loads open
jobs and job/company details from the REST API, submits applications, and shows
the signed-in student's application statuses. The page uses the existing
profile stylesheet and requires a student profile to submit an application.

### Placement API and database
The `placements` app adds the placement domain while reusing Django's configured
`auth.User` and the existing `profiles.StudentProfile`; it does not create a
second users or students table. Companies can own jobs and placement drives,
drives can include multiple jobs, applications link a student to a job and
optionally a drive, interviews and results belong to applications, notifications
belong to recipients, and uploaded placement resumes belong to student profiles.

All placement endpoints require authentication. Students can see and manage
their own applications, notifications, and placement resumes. Company owners
can manage their company, jobs, drives, and related application outcomes;
students can list active jobs and drives. Django staff users can administer all
placement records and manage accounts through `/api/users/`. Company ownership
is attached to the current built-in user because the active project does not
configure separate account roles; consequently, any authenticated user can
register a company, but can only manage companies they own.

The endpoints support DRF's standard list/retrieve/create/update/partial-update/
delete actions as allowed by ownership. Postman can send JSON to the API routes;
use Basic Auth with a Django username/password or authenticate with the existing
Django session. Resume upload uses `multipart/form-data` with a `file` field
(PDF, DOC, or DOCX, up to 5 MB). The existing server-rendered profile screens
continue to use their current Django views and database models; placement
management is exposed through the API and DRF's browsable API.

## Authentication Information
- Login is required to access protected pages.
- API access requires authentication.
- Users can only access their own resources.

## Resume Upload Rules
- Allowed types: PDF, DOC, DOCX
- Maximum file size: 5 MB
- Uploaded files are stored in media/resumes/

## Running Automated Tests
```bash
python manage.py test
```

## Jira Task Mapping
- BAT-24: Student profile data model and admin configuration
- BAT-25: Student profile form and creation/editing flow
- BAT-26: Resume upload validation and storage
- BAT-27: Server-side validation rules
- BAT-28: Student detail dashboard
- BAT-29: Skills, certifications, projects, and internships CRUD
- BAT-30: DRF API implementation and security
- BAT-31: Automated tests and verification
