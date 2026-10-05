const storageKey = 'placementModuleState';

const defaultState = {
  drives: [
    {
      id: 1,
      name: 'Infosys Campus Drive',
      company: 'Infosys',
      mode: 'On campus',
      eligibility: 'CGPA >= 7.5, CSE/ECE/EEE',
      startDate: '2026-10-12',
      endDate: '2026-10-14'
    },
    {
      id: 2,
      name: 'TCS CodeVita Connect',
      company: 'TCS',
      mode: 'Virtual',
      eligibility: 'CGPA >= 6.8, all eligible branches',
      startDate: '2026-10-20',
      endDate: '2026-10-22'
    },
    {
      id: 3,
      name: 'Accenture Hiring Day',
      company: 'Accenture',
      mode: 'Hybrid',
      eligibility: 'CGPA >= 7.0, B.Tech final year',
      startDate: '2026-10-28',
      endDate: '2026-10-30'
    }
  ],
  applications: [
    {
      id: 1,
      student: 'Aarav Sharma',
      drive: 'Infosys Campus Drive',
      cgpa: 8.9,
      status: 'shortlisted',
      summary: 'Strong aptitude score and final-round interview ready.'
    },
    {
      id: 2,
      student: 'Meera Nair',
      drive: 'TCS CodeVita Connect',
      cgpa: 8.2,
      status: 'review',
      summary: 'Awaiting technical screening review.'
    },
    {
      id: 3,
      student: 'Karan Verma',
      drive: 'Accenture Hiring Day',
      cgpa: 7.6,
      status: 'pending',
      summary: 'Application received and eligibility checked.'
    },
    {
      id: 4,
      student: 'Pooja Reddy',
      drive: 'Infosys Campus Drive',
      cgpa: 8.5,
      status: 'rejected',
      summary: 'Profile does not match role requirement.'
    }
  ]
};

const state = loadState();

const driveForm = document.getElementById('driveForm');
const driveList = document.getElementById('driveList');
const applicationList = document.getElementById('applicationList');
const studentTableBody = document.getElementById('studentTableBody');
const searchInput = document.getElementById('searchStudent');
const addSampleButton = document.getElementById('addSampleApplication');

function loadState() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : defaultState;
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  renderDrives();
  renderApplications();
  renderStudents();
  renderStats();
}

function renderDrives() {
  driveList.innerHTML = '';

  state.drives.forEach((drive) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <div class="drive-item-head">
        <div class="drive-name">${drive.name}</div>
        <span class="drive-badge">${drive.mode}</span>
      </div>
      <div class="drive-meta">${drive.company} • ${drive.eligibility}</div>
      <div class="drive-meta">${formatDate(drive.startDate)} to ${formatDate(drive.endDate)}</div>
    `;
    driveList.appendChild(item);
  });
}

function renderApplications() {
  applicationList.innerHTML = '';

  state.applications.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.innerHTML = `
      <div class="app-card-header">
        <span class="app-name">${app.student}</span>
        <span class="status-pill ${app.status}">${labelStatus(app.status)}</span>
      </div>
      <p>${app.drive}</p>
      <p>CGPA: ${app.cgpa}</p>
      <p>${app.summary}</p>
      <div class="app-actions">
        <button class="action-review" data-status="review" data-id="${app.id}">Review</button>
        <button class="action-shortlist" data-status="shortlisted" data-id="${app.id}">Shortlist</button>
        <button class="action-reject" data-status="rejected" data-id="${app.id}">Reject</button>
      </div>
    `;
    applicationList.appendChild(card);
  });

  document.querySelectorAll('.app-actions button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const nextStatus = btn.dataset.status;
      updateApplicationStatus(id, nextStatus);
    });
  });
}

function renderStudents() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = state.applications.filter((app) =>
    app.student.toLowerCase().includes(query) || app.drive.toLowerCase().includes(query)
  );

  studentTableBody.innerHTML = '';

  filtered.forEach((app) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="student-name">${app.student}</td>
      <td>${app.drive}</td>
      <td>${app.cgpa}</td>
      <td><span class="student-status status-pill ${app.status}">${labelStatus(app.status)}</span></td>
      <td><button class="ghost-btn" data-id="${app.id}" data-status="review">Move to review</button></td>
    `;
    studentTableBody.appendChild(row);
  });

  studentTableBody.querySelectorAll('button[data-id]').forEach((button) => {
    button.addEventListener('click', () => {
      updateApplicationStatus(Number(button.dataset.id), button.dataset.status);
    });
  });
}

function renderStats() {
  const activeDrives = state.drives.length;
  const applicantCount = state.applications.length;
  const shortlistCount = state.applications.filter((app) => app.status === 'shortlisted').length;
  const pendingCount = state.applications.filter((app) => app.status === 'pending' || app.status === 'review').length;

  document.getElementById('activeDrivesCount').textContent = activeDrives;
  document.getElementById('applicantCount').textContent = applicantCount;
  document.getElementById('shortlistCount').textContent = shortlistCount;
  document.getElementById('pendingReviewCount').textContent = pendingCount;
}

function updateApplicationStatus(id, status) {
  const target = state.applications.find((app) => app.id === id);
  if (!target) return;
  target.status = status;
  saveState();
  render();
}

function labelStatus(status) {
  switch (status) {
    case 'shortlisted':
      return 'Shortlisted';
    case 'review':
      return 'In Review';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

driveForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const drive = {
    id: Date.now(),
    name: document.getElementById('driveName').value.trim(),
    company: document.getElementById('companyName').value.trim(),
    eligibility: document.getElementById('eligibility').value.trim(),
    mode: document.getElementById('mode').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value
  };

  state.drives.push(drive);
  saveState();
  render();
  driveForm.reset();
});

addSampleButton.addEventListener('click', () => {
  const nextId = Date.now();
  state.applications.push({
    id: nextId,
    student: `Student ${state.applications.length + 1}`,
    drive: state.drives[0]?.name ?? 'General Placement Drive',
    cgpa: 8.1,
    status: 'pending',
    summary: 'Application submitted and checked for eligibility.'
  });
  saveState();
  render();
});

searchInput.addEventListener('input', renderStudents);

render();
