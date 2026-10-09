const API_BASE_URL = "http://localhost:5000/api";

// Load student interview schedule
async function loadInterviews() {
  const studentId = document.getElementById("studentId").value.trim();
  const message = document.getElementById("interviewMessage");
  const tableBody = document.getElementById("interviewBody");

  tableBody.innerHTML = "";
  message.innerHTML = "";

  if (!studentId) {
    message.innerHTML = "Please enter a Student ID.";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/interviews/student/${studentId}`
    );

    const data = await response.json();

    if (!response.ok) {
      message.innerHTML = data.message || "Failed to load interviews.";
      return;
    }

    if (data.interviews.length === 0) {
      message.innerHTML = "No interviews found.";
      return;
    }

    data.interviews.forEach((interview) => {
      const row = document.createElement("tr");

      const date = new Date(interview.interviewDate)
        .toLocaleDateString();

      row.innerHTML = `
        <td>${date}</td>
        <td>${interview.interviewTime}</td>
        <td>${interview.round}</td>
        <td>${interview.mode}</td>
        <td>${interview.venue || "-"}</td>
        <td>${interview.status}</td>
      `;

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error(error);
    message.innerHTML =
      "Unable to connect to the backend server.";
  }
}


// Load student placement history
async function loadPlacements() {
  const studentId =
    document.getElementById("placementStudentId").value.trim();

  const message =
    document.getElementById("placementMessage");

  const tableBody =
    document.getElementById("placementBody");

  tableBody.innerHTML = "";
  message.innerHTML = "";

  if (!studentId) {
    message.innerHTML = "Please enter a Student ID.";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/placements/student/${studentId}`
    );

    const data = await response.json();

    if (!response.ok) {
      message.innerHTML =
        data.message || "Failed to load placements.";
      return;
    }

    if (data.placements.length === 0) {
      message.innerHTML = "No placement history found.";
      return;
    }

    data.placements.forEach((placement) => {
      const row = document.createElement("tr");

      const companyName =
        placement.companyId?.name || placement.companyId || "-";

      const date = new Date(placement.placementDate)
        .toLocaleDateString();

      row.innerHTML = `
        <td>${companyName}</td>
        <td>${placement.jobRole}</td>
        <td>${placement.package}</td>
        <td>${date}</td>
        <td>${placement.status}</td>
      `;

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error(error);
    message.innerHTML =
      "Unable to connect to the backend server.";
  }
}