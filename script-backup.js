
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const navLinks = document.querySelectorAll(".nav-link");
    const pageTitle = document.getElementById("page-title");
    const pageDescription = document.getElementById("page-description");
    const pageContent = document.getElementById("page-content");
    const authScreen = document.getElementById("auth-screen");
    const appContainer = document.getElementById("app-container");
    const headerUser = document.getElementById("header-user");

    const STORAGE_KEYS = {
        programs: "textilelearn_programs",
        participants: "textilelearn_participants",
        registrations: "textilelearn_registrations",
        attendance: "textilelearn_attendance",
        schedules: "textilelearn_schedules",
        announcements: "textilelearn_announcements",
        users: "textilelearn_users",
        agencies: "textilelearn_agencies",
        governance: "textilelearn_governance",
        assessments: "textilelearn_assessments",
        completions: "textilelearn_completions",
        currentUser: "textilelearn_current_user"
    };

    let currentUser = null;
    let qrScanner = null;
    let scannerLibraryLoading = null;

    const ADMIN_ONLY_PAGES = new Set([
        "participants", "agency", "governance",
        "reports", "users", "settings"
    ]);

    function isAdmin(user = currentUser) {
        const role = String(user?.role || "").toLowerCase();
        return role === "admin" || role === "administrator";
    }

    function updateNavigationVisibility() {
        navLinks.forEach(link => {
            const pageName = (link.getAttribute("href") || "").replace("#", "");
            link.hidden = !isAdmin() && ADMIN_ONLY_PAGES.has(pageName);
        });
    }

    function loadSavedData(key, defaults) {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaults;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : defaults;
        } catch (error) {
            console.error("Unable to load saved data:", error);
            return defaults;
        }
    }

    function saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Unable to save data:", error);
            alert("Your changes could not be saved in this browser.");
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    // --------------------------------------------------
    // LOAD SYSTEM DATA
    // --------------------------------------------------

    const programs = loadSavedData(STORAGE_KEYS.programs, [
        {
            name: "Textile Basics",
            description: "Introduction to textile production",
            duration: "3 Days"
        },
        {
            name: "Natural Fibers Workshop",
            description: "Study of natural textile fibers",
            duration: "2 Days"
        },
        {
            name: "Fabric Quality Essentials",
            description: "Fabric inspection and quality control",
            duration: "5 Days"
        }
    ]);

    const participants = loadSavedData(STORAGE_KEYS.participants, [
        {
            name: "Juan Dela Cruz",
            email: "juan@example.com",
            contact: "09123456789",
            program: "Textile Basics",
            agency: "Sample Agency 1",
            status: "Approved"
        },
        {
            name: "Maria Santos",
            email: "maria@example.com",
            contact: "09987654321",
            program: "Natural Fibers Workshop",
            agency: "Sample Agency 2",
            status: "Approved"
        }
    ]);

    const registrations = loadSavedData(STORAGE_KEYS.registrations, []);

    const schedules = loadSavedData(STORAGE_KEYS.schedules, [
        {
            program: "Textile Basics",
            date: "2026-11-15",
            time: "08:00",
            venue: "Training Room 1"
        },
        {
            program: "Natural Fibers Workshop",
            date: "2026-11-20",
            time: "09:00",
            venue: "Training Room 2"
        },
        {
            program: "Fabric Quality Essentials",
            date: "2026-11-25",
            time: "08:30",
            venue: "Laboratory 1"
        }
    ]);

    const attendanceRecords = loadSavedData(STORAGE_KEYS.attendance, []);

    const announcements = loadSavedData(STORAGE_KEYS.announcements, [
        {
            title: "Upcoming Textile Basics Training",
            message: "Training is scheduled for November 15, 2026."
        },
        {
            title: "Registration Reminder",
            message: "Participants are reminded to complete their registration details."
        },
        {
            title: "Training Evaluation",
            message: "Please complete the evaluation after attending a training program."
        }
    ]);

    const agencies = loadSavedData(STORAGE_KEYS.agencies, [
        {
            name: "Sample Agency 1",
            contactPerson: "Alex Cruz",
            email: "agency1@example.com",
            status: "Active"
        },
        {
            name: "Sample Agency 2",
            contactPerson: "Sam Reyes",
            email: "agency2@example.com",
            status: "Active"
        }
    ]);

    const governanceRecords = loadSavedData(STORAGE_KEYS.governance, [
        {
            name: "Training Policy",
            description: "Training program guidelines",
            status: "Active"
        },
        {
            name: "Program Guidelines",
            description: "Program implementation procedures",
            status: "Active"
        },
        {
            name: "Evaluation Guidelines",
            description: "Training assessment procedures",
            status: "For Review"
        }
    ]);

    // ASSESSMENT RECORDS

    const assessments = loadSavedData(STORAGE_KEYS.assessments, [
        {
            participant: "Juan Dela Cruz",
            email: "juan@example.com",
            training: "Textile Basics",
            score: 90,
            result: "Passed"
        },
        {
            participant: "Maria Santos",
            email: "maria@example.com",
            training: "Natural Fibers Workshop",
            score: 85,
            result: "Passed"
        },
        {
            participant: "Pedro Reyes",
            email: "",
            training: "Textile Basics",
            score: "",
            result: "Not Evaluated"
        }
    ]);

    // TRAINING COMPLETION RECORDS

    const completionRecords = loadSavedData(STORAGE_KEYS.completions, [
        {
            participant: "Juan Dela Cruz",
            email: "juan@example.com",
            training: "Textile Basics",
            completionDate: "2026-10-20",
            status: "Completed"
        },
        {
            participant: "Maria Santos",
            email: "maria@example.com",
            training: "Natural Fibers Workshop",
            completionDate: "2026-10-25",
            status: "Completed"
        }
    ]);

    const users = loadSavedData(STORAGE_KEYS.users, []);

    function saveAllData() {
        const programsSaved = saveData(STORAGE_KEYS.programs, programs);
        const participantsSaved = saveData(STORAGE_KEYS.participants, participants);
        const registrationsSaved = saveData(STORAGE_KEYS.registrations, registrations);
        const schedulesSaved = saveData(STORAGE_KEYS.schedules, schedules);

        return programsSaved &&
            participantsSaved &&
            registrationsSaved &&
            schedulesSaved;
    }

    // --------------------------------------------------
    // GENERAL TABLE FUNCTIONS
    // --------------------------------------------------

    function programOptions() {
        return programs.map(p =>
            `<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)}</option>`
        ).join("");
    }

    function participantRows() {
        if (!participants.length) {
            return '<tr><td colspan="5">No participants registered yet.</td></tr>';
        }

        return participants.map(p => `
            <tr>
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.email)}</td>
                <td>${escapeHTML(p.contact)}</td>
                <td>${escapeHTML(p.program)}</td>
                <td>${escapeHTML(p.status)}</td>
            </tr>
        `).join("");
    }

    function registrationRows() {
        let visibleRegistrations = registrations;

        if (!isAdmin()) {
            visibleRegistrations = registrations.filter(p =>
                (p.email || "").toLowerCase() ===
                (currentUser?.email || "").toLowerCase()
            );
        }

        if (!visibleRegistrations.length) {
            return '<tr><td colspan="5">No registration requests found.</td></tr>';
        }

        return visibleRegistrations.map(p => `
            <tr>
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.program)}</td>
                <td>${escapeHTML(p.email)}</td>
                <td>${escapeHTML(p.agency)}</td>
                <td>${escapeHTML(p.status)}</td>
            </tr>
        `).join("");
    }

    function scheduleRows() {
        if (!schedules.length) {
            return '<tr><td colspan="4">No schedules available.</td></tr>';
        }

        return schedules.map(s => `
            <tr>
                <td>${escapeHTML(s.program)}</td>
                <td>${escapeHTML(s.date)}</td>
                <td>${escapeHTML(s.time)}</td>
                <td>${escapeHTML(s.venue)}</td>
            </tr>
        `).join("");
    }

    function attendanceRows() {
        let visibleRecords = attendanceRecords;

        if (!isAdmin()) {
            visibleRecords = attendanceRecords.filter(r =>
                (r.email || "").toLowerCase() ===
                (currentUser?.email || "").toLowerCase()
            );
        }

        if (!visibleRecords.length) {
            return '<tr><td colspan="4">No attendance has been recorded yet.</td></tr>';
        }

        return visibleRecords.slice().reverse().map(r => `
            <tr>
                <td>${escapeHTML(r.name)}</td>
                <td>${escapeHTML(r.program)}</td>
                <td><span class="status approved">${escapeHTML(r.status)}</span></td>
                <td>${escapeHTML(r.dateTime)}</td>
            </tr>
        `).join("");
    }

    function announcementCards() {
        if (!announcements.length) {
            return "<p>No announcements have been posted yet.</p>";
        }

        return announcements.slice().reverse().map(a => `
            <div class="announcement">
                <h4>${escapeHTML(a.title)}</h4>
                <p>${escapeHTML(a.message)}</p>
            </div>
        `).join("");
    }

    // --------------------------------------------------
    // AGENCY MANAGEMENT
    // --------------------------------------------------

    function agencyRows() {
        if (!agencies.length) {
            return '<tr><td colspan="5">No agencies registered yet.</td></tr>';
        }

        return agencies.map((agency, index) => `
            <tr>
                <td>${escapeHTML(agency.name)}</td>
                <td>${escapeHTML(agency.contactPerson)}</td>
                <td>${escapeHTML(agency.email)}</td>
                <td>
                    <span class="status ${agency.status === "Active" ? "approved" : ""}">
                        ${escapeHTML(agency.status)}
                    </span>
                </td>
                <td>
                    <button type="button" class="primary-button"
                        data-agency-action="edit" data-agency-index="${index}">
                        Edit
                    </button>
                    <button type="button" class="primary-button"
                        data-agency-action="delete" data-agency-index="${index}">
                        Delete
                    </button>
                    <button type="button" class="primary-button"
                        data-agency-action="toggle" data-agency-index="${index}">
                        ${agency.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // --------------------------------------------------
    // GOVERNANCE MANAGEMENT
    // --------------------------------------------------

    function governanceRows() {
        if (!governanceRecords.length) {
            return '<tr><td colspan="4">No governance records have been added yet.</td></tr>';
        }

        return governanceRecords.map((record, index) => `
            <tr>
                <td>${escapeHTML(record.name)}</td>
                <td>${escapeHTML(record.description)}</td>
                <td>
                    <span class="status ${record.status === "Active" ? "approved" : ""}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
                <td>
                    <button type="button" class="primary-button"
                        data-governance-action="edit"
                        data-governance-index="${index}">
                        Edit
                    </button>

                    <button type="button" class="primary-button"
                        data-governance-action="delete"
                        data-governance-index="${index}">
                        Delete
                    </button>

                    <button type="button" class="primary-button"
                        data-governance-action="toggle"
                        data-governance-index="${index}">
                        ${record.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // --------------------------------------------------
    // ASSESSMENT AND EVALUATION
    // --------------------------------------------------

    function visibleAssessments() {
        if (isAdmin()) {
            return assessments.map((assessment, index) => ({
                ...assessment,
                originalIndex: index
            }));
        }

        const userEmail = (currentUser?.email || "").toLowerCase();

        return assessments
            .map((assessment, index) => ({
                ...assessment,
                originalIndex: index
            }))
            .filter(assessment =>
                (assessment.email || "").toLowerCase() === userEmail
            );
    }

    function assessmentRows() {
        const records = visibleAssessments();

        if (!records.length) {
            return `<tr><td colspan="${isAdmin() ? 5 : 4}">
                No assessment records found.
            </td></tr>`;
        }

        return records.map(assessment => `
            <tr>
                <td>${escapeHTML(assessment.participant)}</td>
                <td>${escapeHTML(assessment.training)}</td>
                <td>
                    ${assessment.score === "" || assessment.score === null
                        ? "--"
                        : escapeHTML(assessment.score) + "%"}
                </td>
                <td>
                    <span class="status ${assessment.result === "Passed" ? "approved" : ""}">
                        ${escapeHTML(assessment.result)}
                    </span>
                </td>
                ${isAdmin() ? `
                    <td>
                        <button type="button" class="primary-button"
                            data-assessment-action="edit"
                            data-assessment-index="${assessment.originalIndex}">
                            Edit
                        </button>
                        <button type="button" class="primary-button"
                            data-assessment-action="delete"
                            data-assessment-index="${assessment.originalIndex}">
                            Delete
                        </button>
                    </td>
                ` : ""}
            </tr>
        `).join("");
    }

    function assessmentParticipantOptions() {
        if (!participants.length) {
            return '<option value="">No participants available</option>';
        }

        return participants.map((participant, index) => `
            <option value="${index}">
                ${escapeHTML(participant.name)} - ${escapeHTML(participant.program || "No program")}
            </option>
        `).join("");
    }

    // --------------------------------------------------
    // TRAINING COMPLETION RECORDS
    // --------------------------------------------------

    function visibleCompletionRecords() {
        if (isAdmin()) {
            return completionRecords.map((record, index) => ({
                ...record,
                originalIndex: index
            }));
        }

        const userEmail = (currentUser?.email || "").toLowerCase();

        return completionRecords
            .map((record, index) => ({
                ...record,
                originalIndex: index
            }))
            .filter(record =>
                (record.email || "").toLowerCase() === userEmail
            );
    }

    function completionRows() {
        const records = visibleCompletionRecords();

        if (!records.length) {
            return `<tr><td colspan="${isAdmin() ? 5 : 4}">
                No training completion records found.
            </td></tr>`;
        }

        return records.map(record => `
            <tr>
                <td>${escapeHTML(record.participant)}</td>
                <td>${escapeHTML(record.training)}</td>
                <td>${escapeHTML(record.completionDate)}</td>
                <td>
                    <span class="status ${record.status === "Completed" ? "approved" : ""}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>

                ${isAdmin() ? `
                    <td>
                        <button type="button" class="primary-button"
                            data-completion-action="edit"
                            data-completion-index="${record.originalIndex}">
                            Edit
                        </button>

                        <button type="button" class="primary-button"
                            data-completion-action="delete"
                            data-completion-index="${record.originalIndex}">
                            Delete
                        </button>
                    </td>
                ` : ""}
            </tr>
        `).join("");
    }

    function completionParticipantOptions() {
        if (!participants.length) {
            return '<option value="">No participants available</option>';
        }

        return participants.map((participant, index) => `
            <option value="${index}">
                ${escapeHTML(participant.name)} - ${escapeHTML(participant.program || "No program")}
            </option>
        `).join("");
    }

    // --------------------------------------------------
    // REPORT DEFINITIONS
    // --------------------------------------------------

    const reportDefinitions = {
        programs: {
            title: "Training Program Reports",
            headers: ["Program Name", "Description", "Duration", "Status"],
            getRows: () => programs.map(p => [
                p.name, p.description, p.duration, "Open"
            ])
        },

        registrations: {
            title: "Participant Registration Reports",
            headers: ["Participant", "Training Program", "Email", "Agency", "Status"],
            getRows: () => registrations.map(p => [
                p.name, p.program, p.email, p.agency, p.status
            ])
        },

        attendance: {
            title: "Attendance Reports",
            headers: ["Participant", "Training Program", "Attendance", "Date & Time"],
            getRows: () => attendanceRecords.map(r => [
                r.name, r.program, r.status, r.dateTime
            ])
        },

        assessment: {
            title: "Assessment and Evaluation Reports",
            headers: ["Participant", "Training Program", "Score", "Result"],
            getRows: () => assessments.map(a => [
                a.participant,
                a.training,
                a.score === "" || a.score === null ? "--" : a.score + "%",
                a.result
            ])
        },

        completion: {
            title: "Training Completion Reports",
            headers: ["Participant", "Training Program", "Completion Date", "Status"],
            getRows: () => completionRecords.map(record => [
                record.participant,
                record.training,
                record.completionDate,
                record.status
            ])
        }
    };

    // --------------------------------------------------
    // WEBSITE PAGES
    // --------------------------------------------------

    const pages = {
        dashboard: {
            title: "Dashboard",
            description: "Training activity overview",

            content: function () {
                const visibleParticipants = isAdmin()
                    ? participants
                    : participants.filter(p =>
                        (p.email || "").toLowerCase() ===
                        (currentUser?.email || "").toLowerCase()
                    );

                const visibleRegistrations = isAdmin()
                    ? registrations
                    : registrations.filter(p =>
                        (p.email || "").toLowerCase() ===
                        (currentUser?.email || "").toLowerCase()
                    );

                const visibleAttendance = isAdmin()
                    ? attendanceRecords
                    : attendanceRecords.filter(r =>
                        (r.email || "").toLowerCase() ===
                        (currentUser?.email || "").toLowerCase()
                    );

                return `
                    <div class="welcome-section">
                        <h2>Welcome to TextileLearn!</h2>
                        <p>Manage and monitor your training activities in one system.</p>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <p>${isAdmin() ? "Active Programs" : "Available Programs"}</p>
                            <h2>${programs.length}</h2>
                        </div>

                        <div class="stat-card">
                            <p>${isAdmin() ? "Registered Trainees" : "My Registrations"}</p>
                            <h2>${isAdmin() ? participants.length : visibleParticipants.length}</h2>
                        </div>

                        <div class="stat-card">
                            <p>${isAdmin() ? "Pending Requests" : "My Pending Requests"}</p>
                            <h2>${visibleRegistrations.filter(r => r.status === "Pending").length}</h2>
                        </div>

                        <div class="stat-card">
                            <p>${isAdmin() ? "Attendance Records" : "My Attendance"}</p>
                            <h2>${visibleAttendance.length}</h2>
                        </div>
                    </div>

                    <div class="content-card">
                        <h3>Upcoming Training Programs</h3>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Program Name</th>
                                        <th>Schedule</th>
                                        <th>Participants</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${schedules.map(s => `
                                        <tr>
                                            <td>${escapeHTML(s.program)}</td>
                                            <td>${escapeHTML(s.date)}</td>
                                            <td>${participants.filter(p => p.program === s.program).length}</td>
                                            <td><span class="status approved">Open</span></td>
                                        </tr>
                                    `).join("") || '<tr><td colspan="4">No upcoming schedules.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        programs: {
            title: "Training Programs",
            description: "Create and view training programs",

            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add Training Program</h3>

                            <form id="program-form">
                                <div class="form-group">
                                    <label for="program-name">Program Name</label>
                                    <input id="program-name" required>
                                </div>

                                <div class="form-group">
                                    <label for="program-description">Description</label>
                                    <textarea id="program-description" required></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="program-duration">Duration</label>
                                    <input id="program-duration"
                                        placeholder="Example: 3 Days" required>
                                </div>

                                <button type="submit" class="primary-button">
                                    Add Program
                                </button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Training Program List</h3>

                        <table>
                            <thead>
                                <tr>
                                    <th>Program Name</th>
                                    <th>Description</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${programs.map(p => `
                                    <tr>
                                        <td>${escapeHTML(p.name)}</td>
                                        <td>${escapeHTML(p.description)}</td>
                                        <td>${escapeHTML(p.duration)}</td>
                                    </tr>
                                `).join("") || '<tr><td colspan="3">No programs yet.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },

        schedules: {
            title: "Training Schedules",
            description: "Create and view training schedules",

            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add Training Schedule</h3>

                            <form id="schedule-form">
                                <div class="form-group">
                                    <label for="schedule-program">Program</label>
                                    <select id="schedule-program" required>
                                        <option value="">Select program</option>
                                        ${programOptions()}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="schedule-date">Date</label>
                                    <input type="date" id="schedule-date" required>
                                </div>

                                <div class="form-group">
                                    <label for="schedule-time">Time</label>
                                    <input type="time" id="schedule-time" required>
                                </div>

                                <div class="form-group">
                                    <label for="schedule-venue">Venue</label>
                                    <input id="schedule-venue" required>
                                </div>

                                <button type="submit" class="primary-button">
                                    Add Schedule
                                </button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Training Schedule List</h3>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Program</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Venue</th>
                                    </tr>
                                </thead>

                                <tbody>${scheduleRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        participants: {
            title: "Participants",
            description: "View registered participants",

            content: `
                <div class="content-card">
                    <h3>Participant List</h3>

                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Contact</th>
                                    <th>Program</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>${participantRows()}</tbody>
                        </table>
                    </div>
                </div>
            `
        },

        registration: {
            title: "Registration",
            description: "Submit and review participant registration requests",

            content: function () {
                return `
                    <div class="content-card">
                        <h3>Participant Registration</h3>

                        <form id="registration-form">
                            <div class="form-group">
                                <label for="participant-name">Full Name</label>
                                <input id="participant-name"
                                    value="${escapeHTML(isAdmin() ? "" : currentUser?.name || "")}"
                                    required>
                            </div>

                            <div class="form-group">
                                <label for="participant-email">Email</label>
                                <input type="email" id="participant-email"
                                    value="${escapeHTML(isAdmin() ? "" : currentUser?.email || "")}"
                                    required>
                            </div>

                            <div class="form-group">
                                <label for="participant-contact">Contact Number</label>
                                <input id="participant-contact" required>
                            </div>

                            <div class="form-group">
                                <label for="participant-program">Training Program</label>
                                <select id="participant-program" required>
                                    <option value="">Select program</option>
                                    ${programOptions()}
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="participant-agency">Agency</label>
                                <input id="participant-agency" required>
                            </div>

                            <button type="submit" class="primary-button">
                                Submit Registration
                            </button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>${isAdmin() ? "Registration Requests" : "My Registration Requests"}</h3>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Program</th>
                                        <th>Email</th>
                                        <th>Agency</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>${registrationRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        attendance: {
            title: "QR Code & Attendance",
            description: "Generate participant QR codes and monitor training attendance",

            content: function () {
                const userEmail = (currentUser?.email || "").toLowerCase();

                const myRegistration = registrations.find(r =>
                    (r.email || "").toLowerCase() === userEmail
                );

                const myParticipant = participants.find(p =>
                    (p.email || "").toLowerCase() === userEmail &&
                    (!myRegistration || p.program === myRegistration.program)
                );

                const myTraining = myRegistration || myParticipant;

                const visibleParticipants = isAdmin()
                    ? participants.map((p, index) => ({
                        ...p,
                        originalIndex: index
                    }))
                    : [];

                const options = visibleParticipants.map(p => `
                    <option value="${p.originalIndex}">
                        ${escapeHTML(p.name)} - ${escapeHTML(p.program || "No program")}
                    </option>
                `).join("");

                return `
                    <div class="content-card">
                        <h3>${isAdmin() ? "Generate Participant QR Code" : "My QR Code"}</h3>

                        ${isAdmin() ? `
                            <p>Select a participant to generate their QR code.</p>

                            <div class="form-group">
                                <label for="qr-participant">Select Participant</label>
                                <select id="qr-participant">
                                    <option value="">Select a participant</option>
                                    ${options}
                                </select>
                            </div>

                            <button type="button" class="primary-button" id="generate-qr-button">
                                Generate Participant QR Code
                            </button>
                        ` : `
                            ${myTraining ? `
                                <p>Your registered training program has been automatically selected.</p>

                                <div class="form-group">
                                    <label>Participant Name</label>
                                    <input value="${escapeHTML(myTraining.name || currentUser.name)}" disabled>
                                </div>

                                <div class="form-group">
                                    <label>Registered Training</label>
                                    <input value="${escapeHTML(myTraining.program || "No training program")}" disabled>
                                </div>

                                <button type="button" class="primary-button" id="generate-qr-button">
                                    Generate My QR Code
                                </button>
                            ` : `
                                <p>You do not have a training registration yet.</p>
                                <p>Please complete your participant registration first.</p>

                                <button type="button" class="primary-button" disabled>
                                    Generate My QR Code
                                </button>
                            `}
                        `}

                        <div id="qr-result" style="margin-top:20px;"></div>
                    </div>

                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Scan Participant QR Code</h3>
                            <p>Use Live Server (localhost) or HTTPS and allow camera access.</p>

                            <button type="button" class="primary-button" id="start-qr-scanner">
                                Start Camera Scanner
                            </button>

                            <button type="button" class="primary-button"
                                id="stop-qr-scanner" style="margin-left:8px;" disabled>
                                Stop Scanner
                            </button>

                            <div class="form-group" style="margin-top:16px;">
                                <label for="qr-image-upload">Or Upload QR Code Image</label>
                                <input type="file" id="qr-image-upload" accept="image/*">

                                <p style="font-size:12px;color:#64748b;">
                                    Select a saved TextileLearn QR code image from your computer.
                                </p>
                            </div>

                            <div id="qr-reader"
                                style="width:100%;max-width:420px;margin-top:16px;"></div>

                            <div id="scan-result" role="status"
                                aria-live="polite" style="margin-top:12px;"></div>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Attendance Overview</h3>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <p>Present (scanned)</p>
                                <h2 id="attendance-present-count">
                                    ${isAdmin()
                                        ? attendanceRecords.length
                                        : attendanceRecords.filter(r =>
                                            (r.email || "").toLowerCase() === userEmail
                                        ).length}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div class="content-card">
                        <h3>Attendance Records</h3>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Participant</th>
                                        <th>Training</th>
                                        <th>Attendance</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>

                                <tbody id="attendance-record-rows">
                                    ${attendanceRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        assessment: {
            title: "Assessment & Evaluation",
            description: "Add, view, edit, and manage participant assessments",

            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add Assessment Record</h3>

                            <form id="assessment-form">
                                <div class="form-group">
                                    <label for="assessment-participant">Select Participant</label>

                                    <select id="assessment-participant" required>
                                        <option value="">Select participant</option>
                                        ${assessmentParticipantOptions()}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="assessment-training">Training Program</label>

                                    <select id="assessment-training" required>
                                        <option value="">Select training program</option>
                                        ${programOptions()}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="assessment-score">Assessment Score (0–100)</label>

                                    <input
                                        type="number"
                                        id="assessment-score"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="Example: 90"
                                        required>
                                </div>

                                <div class="form-group">
                                    <label for="assessment-result">Assessment Result</label>

                                    <select id="assessment-result" required>
                                        <option value="Passed">Passed</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>

                                <button type="submit" class="primary-button">
                                    Add Assessment
                                </button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Assessment Records</h3>

                        <p>
                            ${isAdmin()
                                ? "View and manage all participant assessment records."
                                : "View your assessment and evaluation results."}
                        </p>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Participant</th>
                                        <th>Training</th>
                                        <th>Score</th>
                                        <th>Result</th>
                                        ${isAdmin() ? "<th>Actions</th>" : ""}
                                    </tr>
                                </thead>

                                <tbody>${assessmentRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        agency: {
            title: "Agency Management",
            description: "Add, view, edit, and manage participating agencies",

            content: function () {
                return `
                    <div class="content-card">
                        <h3>Add New Agency</h3>

                        <form id="agency-form">
                            <div class="form-group">
                                <label for="agency-name">Agency Name</label>
                                <input type="text" id="agency-name"
                                    placeholder="Enter agency name" required>
                            </div>

                            <div class="form-group">
                                <label for="agency-contact">Contact Person</label>
                                <input type="text" id="agency-contact"
                                    placeholder="Enter contact person's name" required>
                            </div>

                            <div class="form-group">
                                <label for="agency-email">Email Address</label>
                                <input type="email" id="agency-email"
                                    placeholder="Enter agency email" required>
                            </div>

                            <div class="form-group">
                                <label for="agency-status">Agency Status</label>
                                <select id="agency-status" required>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <button type="submit" class="primary-button">
                                Add Agency
                            </button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Agency Directory</h3>
                        <p>Manage the agencies and organizations participating in TextileLearn.</p>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Agency Name</th>
                                        <th>Contact Person</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>${agencyRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        governance: {
            title: "Governance Management",
            description: "Add, view, edit, and manage governance policies and guidelines",

            content: function () {
                return `
                    <div class="content-card">
                        <h3>Add Governance Record</h3>

                        <form id="governance-form">
                            <div class="form-group">
                                <label for="governance-name">Record Name</label>
                                <input type="text" id="governance-name"
                                    placeholder="Example: Training Policy" required>
                            </div>

                            <div class="form-group">
                                <label for="governance-description">Description</label>
                                <textarea id="governance-description"
                                    rows="4"
                                    placeholder="Enter the policy or guideline description"
                                    required></textarea>
                            </div>

                            <div class="form-group">
                                <label for="governance-status">Status</label>
                                <select id="governance-status" required>
                                    <option value="Active">Active</option>
                                    <option value="For Review">For Review</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <button type="submit" class="primary-button">
                                Add Governance Record
                            </button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Governance Records Directory</h3>
                        <p>Manage TextileLearn policies, procedures, and guidelines.</p>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Record Name</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>${governanceRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        // IMPROVED TRAINING COMPLETION RECORDS

        records: {
            title: "Completion Records",
            description: "Add, view, edit, and manage training completion records",

            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add Training Completion Record</h3>

                            <form id="completion-form">
                                <div class="form-group">
                                    <label for="completion-participant">Select Participant</label>

                                    <select id="completion-participant" required>
                                        <option value="">Select participant</option>
                                        ${completionParticipantOptions()}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="completion-training">Training Program</label>

                                    <select id="completion-training" required>
                                        <option value="">Select training program</option>
                                        ${programOptions()}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="completion-date">Completion Date</label>
                                    <input type="date" id="completion-date" required>
                                </div>

                                <div class="form-group">
                                    <label for="completion-status">Completion Status</label>

                                    <select id="completion-status" required>
                                        <option value="Completed">Completed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Not Completed">Not Completed</option>
                                    </select>
                                </div>

                                <button type="submit" class="primary-button">
                                    Add Completion Record
                                </button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Training Completion Records</h3>

                        <p>
                            ${isAdmin()
                                ? "View and manage all participant training completion records."
                                : "View your own training completion records."}
                        </p>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Participant</th>
                                        <th>Training Program</th>
                                        <th>Completion Date</th>
                                        <th>Status</th>
                                        ${isAdmin() ? "<th>Actions</th>" : ""}
                                    </tr>
                                </thead>

                                <tbody>${completionRows()}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        notifications: {
            title: "Notifications & Announcements",
            description: "Create and view training updates and announcements",

            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add New Announcement</h3>

                            <form id="announcement-form">
                                <div class="form-group">
                                    <label for="announcement-title">Announcement Title</label>
                                    <input id="announcement-title" required>
                                </div>

                                <div class="form-group">
                                    <label for="announcement-message">Announcement Message</label>
                                    <textarea id="announcement-message" rows="4" required></textarea>
                                </div>

                                <button type="submit" class="primary-button">
                                    Add Announcement
                                </button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Latest Announcements</h3>
                        <div id="announcement-list">${announcementCards()}</div>
                    </div>
                `;
            }
        },

        reports: {
            title: "Reports",
            description: "Download training, participant, attendance, assessment, and completion reports",

            content: `
                <div class="content-card">
                    <h3>Reports Generation</h3>
                    <p>Select a report category, then choose PDF or Excel.</p>

                    <div class="report-export-list">
                        ${Object.keys(reportDefinitions).map(type => `
                            <div class="report-export-item">
                                <h4>${escapeHTML(reportDefinitions[type].title)}</h4>

                                <button class="primary-button"
                                    data-export-format="pdf"
                                    data-report-type="${type}">
                                    Export PDF
                                </button>

                                <button class="primary-button"
                                    data-export-format="excel"
                                    data-report-type="${type}">
                                    Export Excel
                                </button>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `
        },

        users: {
            title: "User Management",
            description: "Create and manage system user accounts",

            content: function () {
                return `
                    <div class="content-card">
                        <h3>Add New User Account</h3>

                        <form id="user-form">
                            <div class="form-group">
                                <label for="new-user-name">Full Name</label>
                                <input id="new-user-name" required>
                            </div>

                            <div class="form-group">
                                <label for="new-user-email">Email</label>
                                <input type="email" id="new-user-email" required>
                            </div>

                            <div class="form-group">
                                <label for="new-user-password">Password</label>
                                <input type="password" id="new-user-password"
                                    minlength="6" required>
                            </div>

                            <div class="form-group">
                                <label for="new-user-role">Account Role</label>
                                <select id="new-user-role" required>
                                    <option value="User">User</option>
                                    <option value="Participant">Participant</option>
                                    <option value="Training Officer">Training Officer</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <button type="submit" class="primary-button">
                                Add User
                            </button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>User Account Directory</h3>

                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${users.map((u, index) => `
                                        <tr>
                                            <td>${escapeHTML(u.name)}</td>
                                            <td>${escapeHTML(u.role)}</td>
                                            <td>${escapeHTML(u.email)}</td>
                                            <td>${escapeHTML(u.status || "Active")}</td>
                                            <td>
                                                <button type="button" class="primary-button"
                                                    data-user-action="edit"
                                                    data-user-index="${index}">
                                                    Edit
                                                </button>

                                                <button type="button" class="primary-button"
                                                    data-user-action="toggle"
                                                    data-user-index="${index}">
                                                    ${(u.status || "Active") === "Active" ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    `).join("") || '<tr><td colspan="5">No user accounts found.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        },

        profile: {
            title: "My Profile",
            description: "View and update your account information",

            content: function () {
                if (!currentUser) {
                    return '<div class="content-card"><p>Please log in to view your profile.</p></div>';
                }

                return `
                    <div class="content-card">
                        <h3>My Account Information</h3>

                        <form id="profile-form">
                            <div class="form-group">
                                <label for="profile-name">Full Name</label>
                                <input id="profile-name"
                                    value="${escapeHTML(currentUser.name || "")}"
                                    required>
                            </div>

                            <div class="form-group">
                                <label for="profile-email">Email Address</label>
                                <input id="profile-email" type="email"
                                    value="${escapeHTML(currentUser.email || "")}"
                                    required>
                            </div>

                            <div class="form-group">
                                <label for="profile-role">Account Role</label>
                                <input id="profile-role"
                                    value="${escapeHTML(currentUser.role || "User")}"
                                    disabled>
                            </div>

                            <button type="submit" class="primary-button">
                                Save Profile Changes
                            </button>
                        </form>
                    </div>
                `;
            }
        },

        settings: {
            title: "System Settings",
            description: "View system configuration options",

            content: `
                <div class="content-card">
                    <h3>System Information</h3>
                    <p><strong>System Name:</strong> TextileLearn</p>
                    <p><strong>System Type:</strong> Training and Skills Management System</p>
                    <p><strong>Project:</strong> Preliminary Academic Prototype</p>
                    <p><strong>Version:</strong> 1.0</p>
                </div>
            `
        }
    };

    // --------------------------------------------------
    // DISPLAY PAGE
    // --------------------------------------------------

    function showPage(pageName) {
        if (!isAdmin() && ADMIN_ONLY_PAGES.has(pageName)) {
            alert("This page is available to administrators only.");
            pageName = "dashboard";
        }

        const page = pages[pageName];
        if (!page) return;

        if (!pageTitle || !pageDescription || !pageContent) {
            console.error("Required page elements are missing from index.html.");
            return;
        }

        pageTitle.textContent = page.title;
        pageDescription.textContent = page.description;

        pageContent.innerHTML =
            typeof page.content === "function"
                ? page.content()
                : page.content;

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + pageName
            );
        });
    }

    // --------------------------------------------------
    // PDF AND EXCEL EXPORT
    // --------------------------------------------------

    const exportLibraryPromises = {};

    function loadExportLibrary(name, url, testFunction) {
        if (testFunction()) return Promise.resolve();
        if (exportLibraryPromises[name]) return exportLibraryPromises[name];

        exportLibraryPromises[name] = new Promise((resolve, reject) => {
            let script = document.querySelector(
                'script[data-export-library="' + name + '"]'
            );

            if (!script) {
                script = document.createElement("script");
                script.src = url;
                script.async = true;
                script.setAttribute("data-export-library", name);
                document.head.appendChild(script);
            }

            script.onload = () => {
                if (testFunction()) {
                    resolve();
                } else {
                    reject(new Error(name + " library is unavailable."));
                }
            };

            script.onerror = () => {
                exportLibraryPromises[name] = null;
                reject(new Error("Could not load " + name + ". Check your internet connection."));
            };
        });

        return exportLibraryPromises[name];
    }

    async function exportReport(reportType, format) {
        const report = reportDefinitions[reportType];

        if (!report) {
            alert("The selected report is not available.");
            return;
        }

        const rows = report.getRows();
        const fileName = "textilelearn-" + reportType;

        try {
            if (format === "excel") {
                await loadExportLibrary(
                    "xlsx",
                    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
                    () => !!window.XLSX
                );

                const worksheet = XLSX.utils.aoa_to_sheet([
                    report.headers,
                    ...rows
                ]);

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
                XLSX.writeFile(workbook, fileName + ".xlsx");

            } else if (format === "pdf") {
                await loadExportLibrary(
                    "jspdf",
                    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
                    () => !!window.jspdf
                );

                await loadExportLibrary(
                    "autotable",
                    "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js",
                    () => !!(window.jspdf && window.jspdf.jsPDF.API.autoTable)
                );

                const doc = new window.jspdf.jsPDF();
                doc.text(report.title, 14, 15);

                doc.autoTable({
                    head: [report.headers],
                    body: rows,
                    startY: 22
                });

                doc.save(fileName + ".pdf");
            }
        } catch (error) {
            console.error("Report export error:", error);
            alert("Unable to export report: " + error.message);
        }
    }

    // --------------------------------------------------
    // QR CODE SCANNER
    // --------------------------------------------------

    function loadQrScannerLibrary() {
        if (window.Html5Qrcode) return Promise.resolve();
        if (scannerLibraryLoading) return scannerLibraryLoading;

        scannerLibraryLoading = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";

            script.onload = () => {
                if (window.Html5Qrcode) {
                    resolve();
                } else {
                    reject(new Error("QR scanner library unavailable."));
                }
            };

            script.onerror = () => {
                reject(new Error("Could not load the QR scanner library. Check your internet connection."));
            };

            document.head.appendChild(script);
        }).finally(() => {
            scannerLibraryLoading = null;
        });

        return scannerLibraryLoading;
    }

    async function stopQrScanner() {
        if (qrScanner) {
            try {
                await qrScanner.stop();
            } catch (error) {
                console.warn("Scanner stop:", error);
            }

            try {
                await qrScanner.clear();
            } catch (error) {
                console.warn("Scanner clear:", error);
            }

            qrScanner = null;
        }

        const startButton = document.getElementById("start-qr-scanner");
        const stopButton = document.getElementById("stop-qr-scanner");

        if (startButton) startButton.disabled = false;
        if (stopButton) stopButton.disabled = true;
    }

    function renderAttendanceRecords() {
        const body = document.getElementById("attendance-record-rows");
        const count = document.getElementById("attendance-present-count");

        if (body) body.innerHTML = attendanceRows();

        if (count) {
            const visibleCount = isAdmin()
                ? attendanceRecords.length
                : attendanceRecords.filter(r =>
                    (r.email || "").toLowerCase() ===
                    (currentUser?.email || "").toLowerCase()
                ).length;

            count.textContent = String(visibleCount);
        }
    }

    async function markAttendance(decodedText) {
        const result = document.getElementById("scan-result");
        let info;

        try {
            info = JSON.parse(decodedText);
        } catch (error) {
            if (result) {
                result.textContent =
                    "This QR code is not a valid TextileLearn participant code.";
            }
            return;
        }

        if (!info || info.system !== "TextileLearn" || !info.participant) {
            if (result) {
                result.textContent =
                    "This QR code does not contain TextileLearn participant information.";
            }
            return;
        }

        const participant = participants.find(person =>
            person.name === info.participant &&
            (person.email || "") === (info.email || "") &&
            (person.program || "") === (info.program || "")
        );

        if (!participant) {
            if (result) {
                result.textContent =
                    "Participant not found. Please register the participant first.";
            }
            return;
        }

        const now = new Date();

        const dateKey =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");

        const alreadyMarked = attendanceRecords.some(record =>
            record.email === (participant.email || "") &&
            record.program === (participant.program || "") &&
            record.dateKey === dateKey
        );

        if (alreadyMarked) {
            if (result) {
                result.textContent =
                    participant.name + " is already marked Present today.";
            }

            await stopQrScanner();
            return;
        }

        const newRecord = {
            name: participant.name,
            email: participant.email || "",
            program: participant.program || "",
            status: "Present",
            dateKey: dateKey,
            dateTime: now.toLocaleString()
        };

        attendanceRecords.push(newRecord);

        if (!saveData(STORAGE_KEYS.attendance, attendanceRecords)) {
            attendanceRecords.pop();
            return;
        }

        renderAttendanceRecords();

        if (result) {
            result.textContent =
                "Attendance recorded: " + participant.name + " — Present.";
        }

        await stopQrScanner();
    }

    // --------------------------------------------------
    // SCAN QR CODE FROM AN UPLOADED IMAGE
    // --------------------------------------------------

    async function scanQrImage(file) {
        const result = document.getElementById("scan-result");
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            if (result) {
                result.textContent = "Please select a valid QR code image.";
            }
            return;
        }

        if (!isAdmin()) {
            if (result) {
                result.textContent = "Only administrators can record attendance.";
            }
            return;
        }

        try {
            if (result) {
                result.textContent = "Reading QR code image. Please wait...";
            }

            await stopQrScanner();
            await loadQrScannerLibrary();

            const imageScanner = new Html5Qrcode("qr-reader");

            try {
                const decodedText = await imageScanner.scanFile(file, true);
                await imageScanner.clear();
                await markAttendance(decodedText);
            } catch (error) {
                try {
                    await imageScanner.clear();
                } catch (clearError) {
                    console.warn("Image scanner cleanup:", clearError);
                }

                throw error;
            }
        } catch (error) {
            console.error("QR image scanning error:", error);

            if (result) {
                result.textContent =
                    "Unable to read the QR code. Please upload a clear QR code image.";
            }
        }
    }

    async function startQrScanner() {
        const result = document.getElementById("scan-result");
        const startButton = document.getElementById("start-qr-scanner");
        const stopButton = document.getElementById("stop-qr-scanner");

        if (!result || !startButton || !stopButton) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            result.textContent =
                "Camera access requires HTTPS or http://localhost. Please use VS Code Live Server.";
            return;
        }

        startButton.disabled = true;
        result.textContent = "Loading scanner. Please allow camera access.";

        try {
            await loadQrScannerLibrary();
            qrScanner = new Html5Qrcode("qr-reader");

            await qrScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                decodedText => markAttendance(decodedText),
                () => {}
            );

            stopButton.disabled = false;
            result.textContent =
                "Camera is active. Point it at a TextileLearn participant QR code.";

        } catch (error) {
            console.error("QR scanner error:", error);

            result.textContent =
                "Could not start the camera: " + (error.message || error);

            await stopQrScanner();
        }
    }

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    function showAuth(view) {
        document.querySelectorAll("[data-auth-view]").forEach(form => {
            form.hidden = form.getAttribute("data-auth-view") !== view;
        });
    }

    function openApplication(user) {
        currentUser = user;
        updateNavigationVisibility();

        if (authScreen) authScreen.style.display = "none";
        if (appContainer) appContainer.style.display = "flex";

        if (headerUser) {
            headerUser.textContent = user.name + " (" + user.role + ")";
        }

        showPage("dashboard");
    }

    function logout() {
        currentUser = null;
        updateNavigationVisibility();

        localStorage.removeItem(STORAGE_KEYS.currentUser);

        if (appContainer) appContainer.style.display = "none";
        if (authScreen) authScreen.style.display = "flex";

        showAuth("login");
    }

    document.addEventListener("click", function (event) {
        const authButton = event.target.closest("[data-show-auth]");

        if (authButton) {
            event.preventDefault();
            showAuth(authButton.getAttribute("data-show-auth"));
            return;
        }

        if (event.target.closest("#show-reset")) {
            event.preventDefault();
            showAuth("reset");
            return;
        }

        if (event.target.closest("#show-signup")) {
            event.preventDefault();
            showAuth("signup");
            return;
        }

        if (
            event.target.closest("#show-login") ||
            event.target.closest("#reset-back-login")
        ) {
            event.preventDefault();
            showAuth("login");
            return;
        }

        if (event.target.closest("#logout-button")) {
            event.preventDefault();
            logout();
        }
    });

    // --------------------------------------------------
    // LOGIN FORM
    // --------------------------------------------------

    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("login-email").value.trim().toLowerCase();
            const password = document.getElementById("login-password").value;

            const user = users.find(u =>
                (u.email || "").toLowerCase() === email &&
                u.password === password
            );

            if (!user) {
                alert("Invalid email or password. Please create an account first.");
                return;
            }

            if ((user.status || "Active") !== "Active") {
                alert("This account is inactive. Please contact the administrator.");
                return;
            }

            localStorage.setItem(
                STORAGE_KEYS.currentUser,
                JSON.stringify(user)
            );

            openApplication(user);
        });
    }

    // --------------------------------------------------
    // SIGNUP FORM
    // --------------------------------------------------

    const signupForm = document.getElementById("signup-form");

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.getElementById("signup-name").value.trim();
            const email = document.getElementById("signup-email").value.trim().toLowerCase();
            const role = "User";
            const password = document.getElementById("signup-password").value;

            const confirmInput = document.getElementById("signup-confirm");
            const confirm = confirmInput ? confirmInput.value : password;

            if (!name || !email || !password) {
                return alert("Please complete all sign-up fields.");
            }

            if (password.length < 6) {
                return alert("Password must be at least 6 characters.");
            }

            if (password !== confirm) {
                return alert("Passwords do not match.");
            }

            if (users.some(u => (u.email || "").toLowerCase() === email)) {
                return alert("This email is already registered.");
            }

            const user = {
                name,
                email,
                role,
                password,
                status: "Active"
            };

            users.push(user);

            if (!saveData(STORAGE_KEYS.users, users)) {
                users.pop();
                return;
            }

            localStorage.setItem(
                STORAGE_KEYS.currentUser,
                JSON.stringify(user)
            );

            signupForm.reset();
            openApplication(user);
        });
    }

    // --------------------------------------------------
    // RESET PASSWORD FORM
    // --------------------------------------------------

    const resetForm = document.getElementById("reset-form");

    if (resetForm) {
        resetForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("reset-email").value.trim().toLowerCase();
            const password = document.getElementById("reset-password").value;

            if (password.length < 6) {
                return alert("Password must be at least 6 characters.");
            }

            const user = users.find(u =>
                (u.email || "").toLowerCase() === email
            );

            if (!user) {
                return alert("No account was found with that email.");
            }

            const oldPassword = user.password;
            user.password = password;

            if (!saveData(STORAGE_KEYS.users, users)) {
                user.password = oldPassword;
                return;
            }

            resetForm.reset();
            showAuth("login");
            alert("Password updated. Please log in.");
        });
    }

    // --------------------------------------------------
    // PAGE NAVIGATION
    // --------------------------------------------------

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const pageName = this.getAttribute("href").substring(1);

            if (pageName !== "attendance") {
                stopQrScanner();
            }

            showPage(pageName);
        });
    });

    // --------------------------------------------------
    // PAGE BUTTON ACTIONS
    // --------------------------------------------------

    if (pageContent) {
        pageContent.addEventListener("click", function (event) {

            // AGENCY MANAGEMENT ACTIONS

            const agencyAction = event.target.closest("[data-agency-action]");

            if (agencyAction) {
                if (!isAdmin()) {
                    return alert("Only administrators can manage agencies.");
                }

                const index = Number(agencyAction.getAttribute("data-agency-index"));
                const action = agencyAction.getAttribute("data-agency-action");
                const agency = agencies[index];

                if (!agency) return;

                if (action === "edit") {
                    const name = prompt("Enter the agency name:", agency.name);
                    if (name === null) return;

                    const contactPerson = prompt(
                        "Enter the contact person's name:",
                        agency.contactPerson
                    );

                    if (contactPerson === null) return;

                    const email = prompt("Enter the agency email:", agency.email);
                    if (email === null) return;

                    const cleanName = name.trim();
                    const cleanContact = contactPerson.trim();
                    const cleanEmail = email.trim().toLowerCase();

                    if (!cleanName || !cleanContact || !cleanEmail) {
                        return alert("Please complete all agency information.");
                    }

                    if (agencies.some((a, i) =>
                        i !== index &&
                        a.name.toLowerCase() === cleanName.toLowerCase()
                    )) {
                        return alert("An agency with this name already exists.");
                    }

                    const oldAgency = { ...agency };

                    agency.name = cleanName;
                    agency.contactPerson = cleanContact;
                    agency.email = cleanEmail;

                    if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                        Object.assign(agency, oldAgency);
                        return;
                    }

                    showPage("agency");
                    alert("Agency information updated successfully!");
                    return;
                }

                if (action === "delete") {
                    const confirmed = confirm(
                        "Are you sure you want to delete " + agency.name + "?"
                    );

                    if (!confirmed) return;

                    const removedAgency = agencies.splice(index, 1)[0];

                    if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                        agencies.splice(index, 0, removedAgency);
                        return;
                    }

                    showPage("agency");
                    alert("Agency deleted successfully!");
                    return;
                }

                if (action === "toggle") {
                    const oldStatus = agency.status;

                    agency.status =
                        oldStatus === "Active" ? "Inactive" : "Active";

                    if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                        agency.status = oldStatus;
                        return;
                    }

                    showPage("agency");
                    alert("Agency status updated successfully!");
                    return;
                }

                return;
            }

            // GOVERNANCE MANAGEMENT ACTIONS

            const governanceAction = event.target.closest("[data-governance-action]");

            if (governanceAction) {
                if (!isAdmin()) {
                    return alert("Only administrators can manage governance records.");
                }

                const index = Number(
                    governanceAction.getAttribute("data-governance-index")
                );

                const action = governanceAction.getAttribute("data-governance-action");
                const record = governanceRecords[index];

                if (!record) return;

                if (action === "edit") {
                    const name = prompt(
                        "Enter the governance record name:",
                        record.name
                    );

                    if (name === null) return;

                    const description = prompt(
                        "Enter the record description:",
                        record.description
                    );

                    if (description === null) return;

                    const status = prompt(
                        "Enter status: Active, For Review, or Inactive",
                        record.status
                    );

                    if (status === null) return;

                    const cleanName = name.trim();
                    const cleanDescription = description.trim();
                    const cleanStatus = status.trim();

                    const validStatuses = [
                        "Active",
                        "For Review",
                        "Inactive"
                    ];

                    if (!cleanName || !cleanDescription) {
                        return alert("Record name and description are required.");
                    }

                    if (!validStatuses.includes(cleanStatus)) {
                        return alert("Please enter Active, For Review, or Inactive.");
                    }

                    const duplicate = governanceRecords.some((r, i) =>
                        i !== index &&
                        r.name.toLowerCase() === cleanName.toLowerCase()
                    );

                    if (duplicate) {
                        return alert("A governance record with this name already exists.");
                    }

                    const oldRecord = { ...record };

                    record.name = cleanName;
                    record.description = cleanDescription;
                    record.status = cleanStatus;

                    if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                        Object.assign(record, oldRecord);
                        return;
                    }

                    showPage("governance");
                    alert("Governance record updated successfully!");
                    return;
                }

                if (action === "delete") {
                    const confirmed = confirm(
                        "Are you sure you want to delete " + record.name + "?"
                    );

                    if (!confirmed) return;

                    const removedRecord = governanceRecords.splice(index, 1)[0];

                    if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                        governanceRecords.splice(index, 0, removedRecord);
                        return;
                    }

                    showPage("governance");
                    alert("Governance record deleted successfully!");
                    return;
                }

                if (action === "toggle") {
                    const oldStatus = record.status;

                    record.status =
                        oldStatus === "Active" ? "Inactive" : "Active";

                    if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                        record.status = oldStatus;
                        return;
                    }

                    showPage("governance");
                    alert("Governance record status updated successfully!");
                    return;
                }

                return;
            }

            // ASSESSMENT MANAGEMENT ACTIONS

            const assessmentAction = event.target.closest("[data-assessment-action]");

            if (assessmentAction) {
                if (!isAdmin()) {
                    return alert("Only administrators can manage assessments.");
                }

                const index = Number(
                    assessmentAction.getAttribute("data-assessment-index")
                );

                const action = assessmentAction.getAttribute("data-assessment-action");
                const assessment = assessments[index];

                if (!assessment) return;

                if (action === "edit") {
                    const participant = prompt(
                        "Enter participant name:",
                        assessment.participant
                    );

                    if (participant === null) return;

                    const training = prompt(
                        "Enter training program:",
                        assessment.training
                    );

                    if (training === null) return;

                    const scoreInput = prompt(
                        "Enter score from 0 to 100:",
                        assessment.score
                    );

                    if (scoreInput === null) return;

                    const result = prompt(
                        "Enter result: Passed, Failed, or Not Evaluated",
                        assessment.result
                    );

                    if (result === null) return;

                    const cleanParticipant = participant.trim();
                    const cleanTraining = training.trim();
                    const cleanResult = result.trim();
                    const cleanScore = scoreInput.trim();

                    const validResults = [
                        "Passed",
                        "Failed",
                        "Not Evaluated"
                    ];

                    if (!cleanParticipant || !cleanTraining) {
                        return alert("Participant and training program are required.");
                    }

                    if (!validResults.includes(cleanResult)) {
                        return alert("Please enter Passed, Failed, or Not Evaluated.");
                    }

                    let numericScore = "";

                    if (cleanResult === "Not Evaluated" && cleanScore === "") {
                        numericScore = "";
                    } else {
                        numericScore = Number(cleanScore);

                        if (
                            cleanScore === "" ||
                            !Number.isFinite(numericScore) ||
                            numericScore < 0 ||
                            numericScore > 100
                        ) {
                            return alert("Please enter a valid score from 0 to 100.");
                        }
                    }

                    const oldAssessment = { ...assessment };

                    assessment.participant = cleanParticipant;
                    assessment.training = cleanTraining;
                    assessment.score = numericScore;
                    assessment.result = cleanResult;

                    const matchingParticipant = participants.find(p =>
                        p.name.toLowerCase() === cleanParticipant.toLowerCase()
                    );

                    if (matchingParticipant) {
                        assessment.email = matchingParticipant.email || "";
                    }

                    if (!saveData(STORAGE_KEYS.assessments, assessments)) {
                        Object.assign(assessment, oldAssessment);
                        return;
                    }

                    showPage("assessment");
                    alert("Assessment record updated successfully!");
                    return;
                }

                if (action === "delete") {
                    const confirmed = confirm(
                        "Are you sure you want to delete the assessment record for " +
                        assessment.participant + "?"
                    );

                    if (!confirmed) return;

                    const removedAssessment = assessments.splice(index, 1)[0];

                    if (!saveData(STORAGE_KEYS.assessments, assessments)) {
                        assessments.splice(index, 0, removedAssessment);
                        return;
                    }

                    showPage("assessment");
                    alert("Assessment record deleted successfully!");
                    return;
                }

                return;
            }

            // TRAINING COMPLETION MANAGEMENT ACTIONS

            const completionAction = event.target.closest("[data-completion-action]");

            if (completionAction) {
                if (!isAdmin()) {
                    return alert("Only administrators can manage completion records.");
                }

                const index = Number(
                    completionAction.getAttribute("data-completion-index")
                );

                const action = completionAction.getAttribute("data-completion-action");
                const record = completionRecords[index];

                if (!record) return;

                if (action === "edit") {
                    const participantName = prompt(
                        "Enter participant name:",
                        record.participant
                    );

                    if (participantName === null) return;

                    const training = prompt(
                        "Enter training program:",
                        record.training
                    );

                    if (training === null) return;

                    const completionDate = prompt(
                        "Enter completion date (YYYY-MM-DD):",
                        record.completionDate
                    );

                    if (completionDate === null) return;

                    const status = prompt(
                        "Enter status: Completed, In Progress, or Not Completed",
                        record.status
                    );

                    if (status === null) return;

                    const cleanParticipant = participantName.trim();
                    const cleanTraining = training.trim();
                    const cleanDate = completionDate.trim();
                    const cleanStatus = status.trim();

                    const validStatuses = [
                        "Completed",
                        "In Progress",
                        "Not Completed"
                    ];

                    if (!cleanParticipant || !cleanTraining || !cleanDate) {
                        return alert("Please complete all completion record fields.");
                    }

                    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) ||
                        Number.isNaN(Date.parse(cleanDate))) {
                        return alert("Please enter a valid date in YYYY-MM-DD format.");
                    }

                    if (!validStatuses.includes(cleanStatus)) {
                        return alert("Please enter Completed, In Progress, or Not Completed.");
                    }

                    const oldRecord = { ...record };

                    record.participant = cleanParticipant;
                    record.training = cleanTraining;
                    record.completionDate = cleanDate;
                    record.status = cleanStatus;

                    const matchingParticipant = participants.find(p =>
                        p.name.toLowerCase() === cleanParticipant.toLowerCase()
                    );

                    if (matchingParticipant) {
                        record.email = matchingParticipant.email || "";
                    }

                    if (!saveData(STORAGE_KEYS.completions, completionRecords)) {
                        Object.assign(record, oldRecord);
                        return;
                    }

                    showPage("records");
                    alert("Training completion record updated successfully!");
                    return;
                }

                if (action === "delete") {
                    const confirmed = confirm(
                        "Are you sure you want to delete the completion record for " +
                        record.participant + "?"
                    );

                    if (!confirmed) return;

                    const removedRecord = completionRecords.splice(index, 1)[0];

                    if (!saveData(STORAGE_KEYS.completions, completionRecords)) {
                        completionRecords.splice(index, 0, removedRecord);
                        return;
                    }

                    showPage("records");
                    alert("Training completion record deleted successfully!");
                    return;
                }

                return;
            }

            // USER ACCOUNT MANAGEMENT

            const userAction = event.target.closest("[data-user-action]");

            if (userAction) {
                if (!isAdmin()) {
                    return alert("Only administrators can manage user accounts.");
                }

                const index = Number(userAction.getAttribute("data-user-index"));
                const action = userAction.getAttribute("data-user-action");
                const user = users[index];

                if (!user) return;

                if (action === "edit") {
                    const oldEmail = (user.email || "").toLowerCase();

                    const name = prompt("Enter the user's full name:", user.name);
                    if (name === null) return;

                    const email = prompt("Enter the user's email:", user.email);
                    if (email === null) return;

                    const role = prompt(
                        "Enter role: Admin, User, Participant, or Training Officer",
                        user.role
                    );

                    if (role === null) return;

                    const cleanName = name.trim();
                    const cleanEmail = email.trim().toLowerCase();
                    const cleanRole = role.trim();

                    const validRoles = [
                        "Admin",
                        "User",
                        "Participant",
                        "Training Officer"
                    ];

                    if (!cleanName || !cleanEmail) {
                        return alert("Name and email are required.");
                    }

                    if (!validRoles.includes(cleanRole)) {
                        return alert("Please enter a valid account role.");
                    }

                    if (users.some((u, i) =>
                        i !== index &&
                        (u.email || "").toLowerCase() === cleanEmail
                    )) {
                        return alert("This email is already registered.");
                    }

                    const wasAdmin = isAdmin(user);
                    const willBeAdmin = cleanRole.toLowerCase() === "admin";

                    if (wasAdmin && !willBeAdmin) {
                        const otherAdmins = users.filter((u, i) =>
                            i !== index &&
                            isAdmin(u) &&
                            (u.status || "Active") === "Active"
                        );

                        if (!otherAdmins.length) {
                            return alert("You cannot remove the last active administrator.");
                        }
                    }

                    const oldUser = { ...user };

                    user.name = cleanName;
                    user.email = cleanEmail;
                    user.role = cleanRole;

                    if (!saveData(STORAGE_KEYS.users, users)) {
                        Object.assign(user, oldUser);
                        return;
                    }

                    if (currentUser &&
                        (currentUser.email || "").toLowerCase() === oldEmail) {

                        currentUser = { ...user };

                        localStorage.setItem(
                            STORAGE_KEYS.currentUser,
                            JSON.stringify(currentUser)
                        );

                        if (headerUser) {
                            headerUser.textContent =
                                currentUser.name + " (" + currentUser.role + ")";
                        }

                        updateNavigationVisibility();
                    }

                    showPage("users");
                    alert("User account updated successfully!");
                }

                if (action === "toggle") {
                    const isActive = (user.status || "Active") === "Active";

                    if (isActive &&
                        currentUser &&
                        (currentUser.email || "").toLowerCase() ===
                        (user.email || "").toLowerCase()) {
                        return alert("You cannot deactivate your own account.");
                    }

                    if (isActive && isAdmin(user)) {
                        const otherAdmins = users.filter((u, i) =>
                            i !== index &&
                            isAdmin(u) &&
                            (u.status || "Active") === "Active"
                        );

                        if (!otherAdmins.length) {
                            return alert("You cannot deactivate the last active administrator.");
                        }
                    }

                    user.status = isActive ? "Inactive" : "Active";

                    if (!saveData(STORAGE_KEYS.users, users)) {
                        user.status = isActive ? "Active" : "Inactive";
                        return;
                    }

                    showPage("users");
                    alert("User account status updated successfully!");
                }

                return;
            }

            // REPORT EXPORT

            const exportButton = event.target.closest("[data-export-format]");

            if (exportButton) {
                if (!isAdmin()) {
                    return alert("Only administrators can export reports.");
                }

                exportReport(
                    exportButton.getAttribute("data-report-type"),
                    exportButton.getAttribute("data-export-format")
                );

                return;
            }

            // QR SCANNER START

            if (event.target.closest("#start-qr-scanner")) {
                if (!isAdmin()) {
                    return alert("Only administrators can scan attendance.");
                }

                startQrScanner();
                return;
            }

            // QR SCANNER STOP

            if (event.target.closest("#stop-qr-scanner")) {
                stopQrScanner();

                const result = document.getElementById("scan-result");

                if (result) {
                    result.textContent = "Scanner stopped.";
                }

                return;
            }

            // QR CODE GENERATION

            if (event.target.closest("#generate-qr-button")) {
                const result = document.getElementById("qr-result");
                if (!result) return;

                let participant = null;

                if (isAdmin()) {
                    const select = document.getElementById("qr-participant");

                    if (!select || select.value === "") {
                        return alert("Please select a participant first.");
                    }

                    participant = participants[Number(select.value)];

                } else {
                    const userEmail = (currentUser?.email || "").toLowerCase();

                    const registration = registrations.find(r =>
                        (r.email || "").toLowerCase() === userEmail
                    );

                    const registeredParticipant = participants.find(p =>
                        (p.email || "").toLowerCase() === userEmail &&
                        (!registration || p.program === registration.program)
                    );

                    participant = registeredParticipant || registration || null;

                    if (!participant) {
                        return alert(
                            "No registered training was found for your account. Please complete your registration first."
                        );
                    }

                    if ((participant.email || "").toLowerCase() !== userEmail) {
                        return alert("You can only generate your own QR code.");
                    }
                }

                if (!participant) {
                    return alert("The selected participant could not be found.");
                }

                const qrInfo = {
                    system: "TextileLearn",
                    participant: participant.name || currentUser?.name || "",
                    email: participant.email || currentUser?.email || "",
                    program: participant.program || ""
                };

                const qrUrl =
                    "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" +
                    encodeURIComponent(JSON.stringify(qrInfo));

                result.innerHTML = `
                    <div style="text-align:center;padding:16px;border:1px solid #ddd;border-radius:10px;">
                        <h4>Participant QR Code</h4>

                        <img
                            src="${qrUrl}"
                            alt="Participant QR code"
                            width="240"
                            height="240"
                            style="display:block;margin:12px auto;max-width:100%;"
                        >

                        <p><strong>${escapeHTML(qrInfo.participant)}</strong></p>
                        <p>${escapeHTML(qrInfo.program || "No training program")}</p>

                        <p style="font-size:12px;color:#64748b;">
                            TextileLearn Participant Attendance QR Code
                        </p>

                        <p style="font-size:12px;color:#64748b;">
                            To save this QR code, right-click the image and select "Save image as".
                        </p>
                    </div>
                `;
            }
        });

        // QR IMAGE UPLOAD EVENT

        pageContent.addEventListener("change", function (event) {
            if (event.target.id === "qr-image-upload") {
                if (!isAdmin()) {
                    return alert("Only administrators can record attendance.");
                }

                const file = event.target.files[0];

                if (file) {
                    scanQrImage(file);
                    event.target.value = "";
                }
            }
        });

        // --------------------------------------------------
        // FORM SUBMISSIONS
        // --------------------------------------------------

        pageContent.addEventListener("submit", function (event) {
            event.preventDefault();

            // ADD AGENCY

            if (event.target.id === "agency-form") {
                if (!isAdmin()) {
                    return alert("Only administrators can add agencies.");
                }

                const name = document.getElementById("agency-name").value.trim();
                const contactPerson = document.getElementById("agency-contact").value.trim();
                const email = document.getElementById("agency-email").value.trim().toLowerCase();
                const status = document.getElementById("agency-status").value;

                if (!name || !contactPerson || !email || !status) {
                    return alert("Please complete all agency fields.");
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return alert("Please enter a valid agency email address.");
                }

                if (agencies.some(a =>
                    a.name.toLowerCase() === name.toLowerCase()
                )) {
                    return alert("This agency is already registered.");
                }

                const newAgency = {
                    name,
                    contactPerson,
                    email,
                    status
                };

                agencies.push(newAgency);

                if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                    agencies.pop();
                    return;
                }

                showPage("agency");
                alert("Agency added successfully!");
                return;
            }

            // ADD GOVERNANCE RECORD

            if (event.target.id === "governance-form") {
                if (!isAdmin()) {
                    return alert("Only administrators can add governance records.");
                }

                const name = document.getElementById("governance-name").value.trim();
                const description = document.getElementById("governance-description").value.trim();
                const status = document.getElementById("governance-status").value;

                if (!name || !description || !status) {
                    return alert("Please complete all governance record fields.");
                }

                const validStatuses = [
                    "Active",
                    "For Review",
                    "Inactive"
                ];

                if (!validStatuses.includes(status)) {
                    return alert("Please select a valid governance status.");
                }

                const duplicate = governanceRecords.some(record =>
                    record.name.toLowerCase() === name.toLowerCase()
                );

                if (duplicate) {
                    return alert("A governance record with this name already exists.");
                }

                governanceRecords.push({
                    name,
                    description,
                    status
                });

                if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                    governanceRecords.pop();
                    return;
                }

                showPage("governance");
                alert("Governance record added successfully!");
                return;
            }

            // ADD ASSESSMENT RECORD

            if (event.target.id === "assessment-form") {
                if (!isAdmin()) {
                    return alert("Only administrators can add assessment records.");
                }

                const participantIndex = document.getElementById(
                    "assessment-participant"
                ).value;

                const training = document.getElementById(
                    "assessment-training"
                ).value;

                const scoreInput = document.getElementById(
                    "assessment-score"
                ).value;

                const result = document.getElementById(
                    "assessment-result"
                ).value;

                if (participantIndex === "" || !training || scoreInput === "") {
                    return alert("Please complete all assessment fields.");
                }

                const participant = participants[Number(participantIndex)];

                if (!participant) {
                    return alert("Please select a valid participant.");
                }

                const score = Number(scoreInput);

                if (
                    !Number.isFinite(score) ||
                    score < 0 ||
                    score > 100
                ) {
                    return alert("Please enter a score from 0 to 100.");
                }

                if (!["Passed", "Failed"].includes(result)) {
                    return alert("Please select a valid assessment result.");
                }

                const newAssessment = {
                    participant: participant.name,
                    email: participant.email || "",
                    training: training,
                    score: score,
                    result: result
                };

                assessments.push(newAssessment);

                if (!saveData(STORAGE_KEYS.assessments, assessments)) {
                    assessments.pop();
                    return;
                }

                showPage("assessment");
                alert("Assessment record added successfully!");
                return;
            }

            // ADD TRAINING COMPLETION RECORD

            if (event.target.id === "completion-form") {
                if (!isAdmin()) {
                    return alert("Only administrators can add completion records.");
                }

                const participantIndex = document.getElementById(
                    "completion-participant"
                ).value;

                const training = document.getElementById(
                    "completion-training"
                ).value;

                const completionDate = document.getElementById(
                    "completion-date"
                ).value;

                const status = document.getElementById(
                    "completion-status"
                ).value;

                if (
                    participantIndex === "" ||
                    !training ||
                    !completionDate ||
                    !status
                ) {
                    return alert("Please complete all completion record fields.");
                }

                const participant = participants[Number(participantIndex)];

                if (!participant) {
                    return alert("Please select a valid participant.");
                }

                if (!["Completed", "In Progress", "Not Completed"].includes(status)) {
                    return alert("Please select a valid completion status.");
                }

                const newRecord = {
                    participant: participant.name,
                    email: participant.email || "",
                    training: training,
                    completionDate: completionDate,
                    status: status
                };

                completionRecords.push(newRecord);

                if (!saveData(STORAGE_KEYS.completions, completionRecords)) {
                    completionRecords.pop();
                    return;
                }

                showPage("records");
                alert("Training completion record added successfully!");
                return;
            }

            // ADD USER ACCOUNT

            if (event.target.id === "user-form") {
                if (!isAdmin()) {
                    return alert("Only administrators can create user accounts.");
                }

                const name = document.getElementById("new-user-name").value.trim();
                const email = document.getElementById("new-user-email").value.trim().toLowerCase();
                const password = document.getElementById("new-user-password").value;
                const role = document.getElementById("new-user-role").value;

                if (!name || !email || !password || !role) {
                    return alert("Please complete all user account fields.");
                }

                if (password.length < 6) {
                    return alert("Password must contain at least 6 characters.");
                }

                if (users.some(u =>
                    (u.email || "").toLowerCase() === email
                )) {
                    return alert("This email address is already registered.");
                }

                const newUser = {
                    name,
                    email,
                    password,
                    role,
                    status: "Active"
                };

                users.push(newUser);

                if (!saveData(STORAGE_KEYS.users, users)) {
                    users.pop();
                    return;
                }

                showPage("users");
                alert("New user account created successfully!");
                return;
            }

            const adminManagedForms = [
                "program-form",
                "schedule-form",
                "announcement-form"
            ];

            if (!isAdmin() && adminManagedForms.includes(event.target.id)) {
                return alert("Only administrators can manage this information.");
            }

            // UPDATE USER PROFILE

            if (event.target.id === "profile-form") {
                const name = document.getElementById("profile-name").value.trim();
                const email = document.getElementById("profile-email").value.trim().toLowerCase();

                if (!name || !email) {
                    return alert("Please enter your name and email address.");
                }

                const oldEmail = (currentUser.email || "").toLowerCase();

                const duplicateEmail = users.some(user =>
                    (user.email || "").toLowerCase() === email &&
                    (user.email || "").toLowerCase() !== oldEmail
                );

                if (duplicateEmail) {
                    return alert("This email address is already used by another account.");
                }

                const oldUser = { ...currentUser };

                const userIndex = users.findIndex(user =>
                    (user.email || "").toLowerCase() === oldEmail
                );

                if (userIndex === -1) {
                    return alert("Your account could not be found.");
                }

                const oldStoredUser = { ...users[userIndex] };

                currentUser.name = name;
                currentUser.email = email;

                users[userIndex] = {
                    ...users[userIndex],
                    name,
                    email
                };

                if (!saveData(STORAGE_KEYS.users, users)) {
                    currentUser = oldUser;
                    users[userIndex] = oldStoredUser;
                    return;
                }

                localStorage.setItem(
                    STORAGE_KEYS.currentUser,
                    JSON.stringify(currentUser)
                );

                if (headerUser) {
                    headerUser.textContent =
                        currentUser.name + " (" + currentUser.role + ")";
                }

                showPage("profile");
                alert("Your profile has been updated successfully!");
                return;
            }

            // ADD TRAINING PROGRAM

            if (event.target.id === "program-form") {
                const name = document.getElementById("program-name").value.trim();
                const description = document.getElementById("program-description").value.trim();
                const duration = document.getElementById("program-duration").value.trim();

                if (!name || !description || !duration) {
                    return alert("Please complete all program fields.");
                }

                if (programs.some(p =>
                    p.name.toLowerCase() === name.toLowerCase()
                )) {
                    return alert("This training program already exists.");
                }

                programs.push({
                    name,
                    description,
                    duration
                });

                if (!saveData(STORAGE_KEYS.programs, programs)) {
                    programs.pop();
                    return;
                }

                showPage("programs");
                alert("Training program added successfully!");
                return;
            }

            // ADD TRAINING SCHEDULE

            if (event.target.id === "schedule-form") {
                const program = document.getElementById("schedule-program").value;
                const date = document.getElementById("schedule-date").value;
                const time = document.getElementById("schedule-time").value;
                const venue = document.getElementById("schedule-venue").value.trim();

                if (!program || !date || !time || !venue) {
                    return alert("Please complete all schedule fields.");
                }

                schedules.push({
                    program,
                    date,
                    time,
                    venue
                });

                if (!saveData(STORAGE_KEYS.schedules, schedules)) {
                    schedules.pop();
                    return;
                }

                showPage("schedules");
                alert("Training schedule added successfully!");
                return;
            }

            // PARTICIPANT REGISTRATION

            if (event.target.id === "registration-form") {
                const name = document.getElementById("participant-name").value.trim();
                const email = document.getElementById("participant-email").value.trim().toLowerCase();
                const contact = document.getElementById("participant-contact").value.trim();
                const program = document.getElementById("participant-program").value;
                const agency = document.getElementById("participant-agency").value.trim();

                if (!name || !email || !contact || !program || !agency) {
                    return alert("Please complete all registration fields.");
                }

                if (!isAdmin() &&
                    email !== (currentUser?.email || "").toLowerCase()) {
                    return alert("Please use the email address connected to your TextileLearn account.");
                }

                if (registrations.some(p =>
                    (p.email || "").toLowerCase() === email &&
                    p.program === program
                )) {
                    return alert("This participant is already registered for this program.");
                }

                const newParticipant = {
                    name,
                    email,
                    contact,
                    program,
                    agency,
                    status: "Pending"
                };

                registrations.push(newParticipant);
                participants.push(newParticipant);

                if (!saveData(STORAGE_KEYS.registrations, registrations) ||
                    !saveData(STORAGE_KEYS.participants, participants)) {

                    registrations.pop();
                    participants.pop();

                    saveData(STORAGE_KEYS.registrations, registrations);
                    saveData(STORAGE_KEYS.participants, participants);
                    return;
                }

                showPage("registration");
                alert("Participant registration submitted successfully!");
                return;
            }

            // ADD ANNOUNCEMENT

            if (event.target.id === "announcement-form") {
                const title = document.getElementById("announcement-title").value.trim();
                const message = document.getElementById("announcement-message").value.trim();

                if (!title || !message) {
                    return alert("Please enter an announcement title and message.");
                }

                announcements.push({
                    title,
                    message
                });

                if (!saveData(STORAGE_KEYS.announcements, announcements)) {
                    announcements.pop();
                    return;
                }

                showPage("notifications");
                alert("Announcement added successfully!");
                return;
            }
        });
    }

    // --------------------------------------------------
    // RESTORE PREVIOUS LOGIN SESSION
    // --------------------------------------------------

    try {
        currentUser = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.currentUser) || "null"
        );
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        currentUser = null;
    }

    if (currentUser) {
        const savedUser = users.find(u =>
            (u.email || "").toLowerCase() ===
            (currentUser.email || "").toLowerCase()
        );

        if (!savedUser || (savedUser.status || "Active") !== "Active") {
            logout();
        } else {
            currentUser = savedUser;
            openApplication(currentUser);
        }
    } else {
        updateNavigationVisibility();

        if (appContainer) appContainer.style.display = "none";
        if (authScreen) authScreen.style.display = "flex";

        showAuth("login");
    }
});
