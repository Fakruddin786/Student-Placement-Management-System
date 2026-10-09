(function () {
    const app = document.getElementById('placement-app');
    if (!app) {
        return;
    }

    const jobsUrl = app.dataset.jobsUrl;
    const jobDetailTemplate = app.dataset.jobDetailTemplate;
    const companyDetailTemplate = app.dataset.companyDetailTemplate;
    const applicationsUrl = app.dataset.applicationsUrl;
    const message = document.getElementById('api-message');
    const jobsList = document.getElementById('jobs-list');
    const applicationsList = document.getElementById('applications-list');
    const detailPanel = document.getElementById('job-detail');
    const detailEmpty = document.getElementById('job-detail-empty');
    const applyButton = document.getElementById('apply-button');
    const form = document.getElementById('application-form');
    const formError = document.getElementById('application-form-error');
    const profileHint = document.getElementById('application-form-profile-hint');
    const appliedJobIds = new Set();
    const jobTitles = new Map();
    let selectedJob = null;
    let currentApplications = [];

    function showMessage(text, kind, loginHref) {
        message.replaceChildren();
        message.className = 'messages';
        if (text) {
            const notice = makeElement('p', kind === 'error' ? 'error' : 'success', text);
            if (loginHref) {
                const loginLink = makeElement('a', '', 'Log in');
                loginLink.href = loginHref;
                notice.append(' ', loginLink);
            }
            message.append(notice);
        }
        message.hidden = !text;
        message.style.display = text ? '' : 'none';
    }

    function getErrorText(data, fallback) {
        if (!data) {
            return fallback;
        }
        if (typeof data === 'string') {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map((item) => getErrorText(item, '')).filter(Boolean).join(' ');
        }
        if (typeof data === 'object') {
            return Object.entries(data)
                .map(([field, errors]) => {
                    const detail = getErrorText(errors, '');
                    return field === 'detail' || field === 'non_field_errors'
                        ? detail
                        : `${field.replaceAll('_', ' ')}: ${detail}`;
                })
                .filter(Boolean)
                .join(' ');
        }
        return fallback;
    }

    async function apiRequest(url, options) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                ...(options && options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options && options.method
                    ? { 'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value }
                    : {}),
                ...(options && options.headers ? options.headers : {}),
            },
            ...options,
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const loginUrl = new URL(app.dataset.loginUrl, window.location.origin);
                const error = new Error('Your session may have expired or this action is not allowed. Log in, then return to this page.');
                error.loginHref = loginUrl.pathname;
                throw error;
            }
            throw new Error(getErrorText(data, `The request failed (${response.status}).`));
        }
        return data;
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }

    function renderJobs(jobs) {
        jobsList.replaceChildren();
        jobTitles.clear();
        document.getElementById('jobs-empty').hidden = jobs.length > 0;
        jobs.forEach((job) => {
            jobTitles.set(job.id, job.title);
            const item = makeElement('li');
            item.append(makeElement('h3', '', job.title));
            item.append(makeElement('p', '', `${job.location} · ${job.employment_type.replaceAll('_', ' ')}`));
            item.append(makeElement('p', '', `Apply by ${job.application_deadline}`));
            const actions = makeElement('div', 'buttons-row');
            const detailsButton = makeElement('button', 'primary-btn', 'View details');
            detailsButton.type = 'button';
            detailsButton.dataset.jobId = job.id;
            detailsButton.addEventListener('click', () => loadJob(job.id));
            actions.append(detailsButton);
            if (appliedJobIds.has(job.id)) {
                actions.append(makeElement('span', 'success', 'Applied'));
            }
            item.append(actions);
            jobsList.append(item);
        });
        renderApplications(currentApplications);
    }

    function renderApplications(applications) {
        currentApplications = applications;
        applicationsList.replaceChildren();
        document.getElementById('applications-empty').hidden = applications.length > 0;
        applications.forEach((application) => {
            appliedJobIds.add(application.job);
            const item = makeElement(
                'li',
                '',
                `${jobTitles.get(application.job) || `Job #${application.job}`} — ${application.status.replaceAll('_', ' ')} — applied ${new Date(application.applied_at).toLocaleDateString()}`
            );
            applicationsList.append(item);
        });
    }

    async function loadJob(jobId) {
        showMessage('', '');
        detailPanel.hidden = true;
        detailEmpty.hidden = false;
        detailEmpty.textContent = 'Loading job details…';
        const detailUrl = jobDetailTemplate.replace(/0\/$/, `${jobId}/`);
        try {
            selectedJob = await apiRequest(detailUrl);
            const companyUrl = companyDetailTemplate.replace(/0\/$/, `${selectedJob.company}/`);
            const company = await apiRequest(companyUrl);
            document.getElementById('detail-title').textContent = selectedJob.title;
            document.getElementById('detail-company').textContent = company.name;
            document.getElementById('detail-location').textContent = selectedJob.location;
            document.getElementById('detail-type').textContent = selectedJob.employment_type.replaceAll('_', ' ');
            document.getElementById('detail-cgpa').textContent = selectedJob.min_cgpa;
            document.getElementById('detail-backlogs').textContent = selectedJob.max_backlogs;
            document.getElementById('detail-deadline').textContent = selectedJob.application_deadline;
            document.getElementById('detail-description').textContent = selectedJob.description;
            formError.hidden = true;
            profileHint.hidden = Boolean(app.dataset.studentId);
            applyButton.disabled = appliedJobIds.has(selectedJob.id);
            applyButton.textContent = applyButton.disabled ? 'Already applied' : 'Apply for this job';
            detailPanel.hidden = false;
            detailEmpty.hidden = true;
        } catch (error) {
            detailEmpty.textContent = error.message;
            showMessage(error.message, 'error', error.loginHref);
        }
    }

    async function loadJobs() {
        try {
            const jobs = await apiRequest(jobsUrl);
            document.getElementById('jobs-loading').hidden = true;
            renderJobs(jobs);
            renderJobsCacheAppliedState();
        } catch (error) {
            document.getElementById('jobs-loading').hidden = true;
            showMessage(error.message, 'error', error.loginHref);
        }
    }

    async function loadApplications() {
        try {
            const applications = await apiRequest(applicationsUrl);
            document.getElementById('applications-loading').hidden = true;
            renderApplications(applications.filter(
                (application) => String(application.student) === app.dataset.studentId
            ));
            renderJobsCacheAppliedState();
            if (selectedJob) {
                applyButton.disabled = appliedJobIds.has(selectedJob.id);
                applyButton.textContent = applyButton.disabled ? 'Already applied' : 'Apply for this job';
            }
        } catch (error) {
            document.getElementById('applications-loading').hidden = true;
            showMessage(error.message, 'error', error.loginHref);
        }
    }

    function renderJobsCacheAppliedState() {
        jobsList.querySelectorAll('li').forEach((item) => {
            const button = item.querySelector('button[data-job-id]');
            if (button && appliedJobIds.has(Number(button.dataset.jobId)) && !item.querySelector('.success')) {
                item.querySelector('.buttons-row').append(makeElement('span', 'success', 'Applied'));
            }
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedJob) {
            return;
        }
        formError.hidden = true;
        applyButton.disabled = true;
        applyButton.textContent = 'Submitting…';
        try {
            await apiRequest(applicationsUrl, {
                method: 'POST',
                body: JSON.stringify({
                    job: selectedJob.id,
                    cover_letter: document.getElementById('cover-letter').value,
                }),
            });
            showMessage('Your application was submitted successfully.', 'success');
            appliedJobIds.add(selectedJob.id);
            applyButton.textContent = 'Already applied';
            await loadApplications();
        } catch (error) {
            formError.textContent = error.message;
            formError.hidden = false;
            applyButton.disabled = appliedJobIds.has(selectedJob.id);
            applyButton.textContent = applyButton.disabled ? 'Already applied' : 'Apply for this job';
        }
    });

    loadJobs();
    loadApplications();
})();
