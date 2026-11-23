document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // --------------------------------------------------
    // DOM REFERENCES & STORAGE KEYS
    // --------------------------------------------------

    const navLinks = document.querySelectorAll(".nav-link");
    const pageTitle = document.getElementById("page-title");
    const pageDescription = document.getElementById("page-description");
    const pageContent = document.getElementById("page-content");
    const authScreen = document.getElementById("auth-screen");
    const appContainer = document.getElementById("app-container");
    const headerUser = document.getElementById("header-user");
    const toastContainer = document.getElementById("toast-container");

    // Sidebar Mobile Toggle Elements
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const closeSidebarBtn = document.getElementById("close-sidebar-btn");

    // Facebook-Style Notification Bell Elements
    const notificationWrapper = document.getElementById("notification-wrapper");
    const notificationBellBtn = document.getElementById("notification-bell-btn");
    const notificationBadge = document.getElementById("notification-badge");
    const notificationDropdown = document.getElementById("notification-dropdown");
    const notificationDropdownList = document.getElementById("notification-dropdown-list");
    const markAllReadBtn = document.getElementById("mark-all-read-btn");
    const viewAllNotificationsLink = document.getElementById("view-all-notifications-link");

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
        currentUser: "textilelearn_current_user",
        systemSettings: "textilelearn_system_settings",
        notificationSettings: "textilelearn_notification_settings"
    };

    const ADMIN_ONLY_PAGES = new Set([
        "participants",
        "agency",
        "governance",
        "reports",
        "users",
        "settings"
    ]);

    let currentUser = null;
    let qrScanner = null;
    let scannerLibraryLoading = null;
    let dashboardChartInstance = null;

    // --------------------------------------------------
    // MOBILE SIDEBAR CONTROLS
    // --------------------------------------------------

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.hidden = false;
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.hidden = true;
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", openMobileSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeMobileSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", closeMobileSidebar);
    }

    // --------------------------------------------------
    // TOAST & STORAGE HELPERS
    // --------------------------------------------------

    function showToast(message, type = "info") {
        if (!toastContainer) {
            alert(message);
            return;
        }

        const toast = document.createElement("div");
        toast.className = "toast toast-" + type;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.25s ease";
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

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

    function loadObjectData(key, defaults) {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaults;
            const parsed = JSON.parse(saved);
            return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : defaults;
        } catch (error) {
            console.error("Unable to load saved object data:", error);
            return defaults;
        }
    }

    function saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Unable to save data:", error);
            showToast("Your changes could not be saved in this browser.", "error");
            return false;
        }
    }

    function loadSystemSettings() {
        return loadObjectData(STORAGE_KEYS.systemSettings, {
            systemName: "TextileLearn",
            systemType: "Training and Skills Management System",
            project: "Enterprise Training Initiative",
            version: "1.0"
        });
    }

    function loadNotificationSettings() {
        return loadObjectData(STORAGE_KEYS.notificationSettings, {
            email: true,
            sms: false,
            system: true
        });
    }

    function applyBranding() {
        const settings = loadSystemSettings();
        const sidebarName = document.getElementById("sidebar-system-name");
        const sidebarVersion = document.getElementById("sidebar-system-version");
        const footerText = document.getElementById("main-footer-text");

        if (sidebarName) sidebarName.textContent = settings.systemName + " System";
        if (sidebarVersion) sidebarVersion.textContent = "Version " + settings.version;
        if (footerText) {
            footerText.innerHTML = `&copy; 2026 ${escapeHTML(settings.systemName)}. ${escapeHTML(settings.systemType)}.`;
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

    function statusClass(status) {
        return String(status || "").toLowerCase().replace(/\s+/g, "-");
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
            id: "notif-1",
            title: "Upcoming Textile Basics Training",
            message: "Training is scheduled for November 15, 2026.",
            date: "Nov 10, 2026",
            readBy: []
        },
        {
            id: "notif-2",
            title: "Registration Reminder",
            message: "Participants are reminded to complete their registration details.",
            date: "Nov 12, 2026",
            readBy: []
        },
        {
            id: "notif-3",
            title: "Training Evaluation",
            message: "Please complete the evaluation after attending a training program.",
            date: "Nov 18, 2026",
            readBy: []
        }
    ]);

    // Normalize existing announcements to ensure read tracking fields exist
    announcements.forEach((item, idx) => {
        if (!item.id) item.id = "notif-" + idx + "-" + Date.now();
        if (!Array.isArray(item.readBy)) item.readBy = [];
        if (!item.date) item.date = "Recent";
    });

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

    // --------------------------------------------------
    // FACEBOOK-STYLE NOTIFICATION SYSTEM
    // --------------------------------------------------

    function isNotificationRead(item) {
        const email = (currentUser?.email || "").toLowerCase();
        if (!email) return true;
        return Array.isArray(item.readBy) && item.readBy.includes(email);
    }

    function markNotificationAsRead(index) {
        const email = (currentUser?.email || "").toLowerCase();
        const item = announcements[index];
        if (!email || !item) return;

        if (!Array.isArray(item.readBy)) item.readBy = [];
        if (!item.readBy.includes(email)) {
            item.readBy.push(email);
            saveData(STORAGE_KEYS.announcements, announcements);
            renderNotificationBell();
        }
    }

    function markAllNotificationsAsRead() {
        const email = (currentUser?.email || "").toLowerCase();
        if (!email) return;

        let updated = false;
        announcements.forEach(item => {
            if (!Array.isArray(item.readBy)) item.readBy = [];
            if (!item.readBy.includes(email)) {
                item.readBy.push(email);
                updated = true;
            }
        });

        if (updated) {
            saveData(STORAGE_KEYS.announcements, announcements);
            renderNotificationBell();
            if (document.getElementById("announcement-list")) {
                showPage("notifications");
            }
            showToast("All notifications marked as read.", "success");
        }
    }

    function renderNotificationBell() {
        if (!notificationBadge || !notificationDropdownList) return;

        const unreadCount = announcements.filter(item => !isNotificationRead(item)).length;

        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
            notificationBadge.hidden = false;
        } else {
            notificationBadge.hidden = true;
        }

        if (!announcements.length) {
            notificationDropdownList.innerHTML = `
                <div class="notif-empty-state">No notifications or announcements yet.</div>
            `;
            return;
        }

        const recentItems = announcements
            .map((item, idx) => ({ item, idx }))
            .reverse()
            .slice(0, 6);

        notificationDropdownList.innerHTML = recentItems.map(({ item, idx }) => {
            const unread = !isNotificationRead(item);
            return `
                <div class="notif-dropdown-item ${unread ? "unread" : ""}" data-notif-index="${idx}">
                    <div class="notif-item-body">
                        <div class="notif-item-title">${escapeHTML(item.title)}</div>
                        <div class="notif-item-msg">${escapeHTML(item.message)}</div>
                        <div class="notif-item-meta">${escapeHTML(item.date || "System Announcement")}</div>
                    </div>
                    ${unread ? '<span class="notif-unread-dot" title="Unread"></span>' : ""}
                </div>
            `;
        }).join("");
    }

    function toggleNotificationDropdown(forceClose = false) {
        if (!notificationDropdown || !notificationBellBtn) return;
        const willOpen = forceClose ? false : notificationDropdown.hidden;
        notificationDropdown.hidden = !willOpen;
        notificationBellBtn.setAttribute("aria-expanded", String(willOpen));
    }

    if (notificationBellBtn) {
        notificationBellBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleNotificationDropdown();
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            markAllNotificationsAsRead();
        });
    }

    if (viewAllNotificationsLink) {
        viewAllNotificationsLink.addEventListener("click", function (event) {
            event.preventDefault();
            toggleNotificationDropdown(true);
            showPage("notifications");
        });
    }

    if (notificationDropdownList) {
        notificationDropdownList.addEventListener("click", function (event) {
            const itemEl = event.target.closest("[data-notif-index]");
            if (!itemEl) return;
            const idx = Number(itemEl.getAttribute("data-notif-index"));
            markNotificationAsRead(idx);
            toggleNotificationDropdown(true);
            showPage("notifications");
        });
    }

    document.addEventListener("click", function (event) {
        if (notificationWrapper && !notificationWrapper.contains(event.target)) {
            toggleNotificationDropdown(true);
        }
    });

    // --------------------------------------------------
    // DASHBOARD CHART RENDERER
    // --------------------------------------------------

    function renderDashboardChart() {
        const canvas = document.getElementById("dashboard-program-chart");
        if (!canvas || typeof window.Chart === "undefined") return;

        if (dashboardChartInstance) {
            dashboardChartInstance.destroy();
            dashboardChartInstance = null;
        }

        const labels = programs.map(p => p.name);
        const enrolledCounts = programs.map(p =>
            participants.filter(part => part.program === p.name && part.status === "Approved").length
        );
        const attendanceCounts = programs.map(p =>
            attendanceRecords.filter(att => att.program === p.name).length
        );

        dashboardChartInstance = new Chart(canvas, {
            type: "bar",
            data: {
                labels: labels.length ? labels : ["No Programs"],
                datasets: [
                    {
                        label: "Approved Trainees",
                        data: labels.length ? enrolledCounts : [0],
                        backgroundColor: "#087DBB",
                        borderRadius: 6,
                        barPercentage: 0.55
                    },
                    {
                        label: "Attendance Recorded",
                        data: labels.length ? attendanceCounts : [0],
                        backgroundColor: "#19D4D8",
                        borderRadius: 6,
                        barPercentage: 0.55
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#12304A",
                            font: { size: 12, weight: "600" },
                            usePointStyle: true,
                            padding: 16
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: "#64748B", font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: "#64748B",
                            font: { size: 11 }
                        },
                        grid: { color: "#EDF2F7" }
                    }
                }
            }
        });
    }

    // --------------------------------------------------
    // TABLE & LIST RENDERERS
    // --------------------------------------------------

    function programOptions() {
        return programs.map(p =>
            `<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)}</option>`
        ).join("");
    }

    function agencyOptions() {
        return agencies
            .filter(a => a.status === "Active")
            .map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)}</option>`)
            .join("");
    }

    function participantRows() {
        if (!participants.length) {
            return '<tr><td colspan="6">No participants registered yet.</td></tr>';
        }

        return participants.map(p => `
            <tr>
                <td><strong>${escapeHTML(p.name)}</strong></td>
                <td>${escapeHTML(p.email)}</td>
                <td>${escapeHTML(p.contact)}</td>
                <td>${escapeHTML(p.program)}</td>
                <td>${escapeHTML(p.agency || "--")}</td>
                <td><span class="status ${statusClass(p.status)}">${escapeHTML(p.status)}</span></td>
            </tr>
        `).join("");
    }

    function registrationRows() {
        const indexed = registrations.map((item, idx) => ({ ...item, originalIndex: idx }));
        const visibleRegistrations = isAdmin()
            ? indexed
            : indexed.filter(p =>
                (p.email || "").toLowerCase() ===
                (currentUser?.email || "").toLowerCase()
            );

        if (!visibleRegistrations.length) {
            return `<tr><td colspan="${isAdmin() ? 6 : 5}">No registration requests found.</td></tr>`;
        }

        return visibleRegistrations.map(p => `
            <tr>
                <td><strong>${escapeHTML(p.name)}</strong></td>
                <td>${escapeHTML(p.program)}</td>
                <td>${escapeHTML(p.email)}</td>
                <td>${escapeHTML(p.agency)}</td>
                <td><span class="status ${statusClass(p.status)}">${escapeHTML(p.status)}</span></td>
                ${isAdmin() ? `
                    <td>
                        <div class="action-group">
                            ${p.status === "Pending" ? `
                                <button type="button" class="btn-sm btn-success"
                                    data-reg-action="approve" data-reg-index="${p.originalIndex}">
                                    Approve
                                </button>
                                <button type="button" class="btn-sm btn-danger"
                                    data-reg-action="reject" data-reg-index="${p.originalIndex}">
                                    Reject
                                </button>
                            ` : `<span class="text-muted">Processed</span>`}
                        </div>
                    </td>
                ` : ""}
            </tr>
        `).join("");
    }

    function scheduleRows() {
        if (!schedules.length) {
            return '<tr><td colspan="4">No schedules available.</td></tr>';
        }

        return schedules.map(s => `
            <tr>
                <td><strong>${escapeHTML(s.program)}</strong></td>
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
                <td><strong>${escapeHTML(r.name)}</strong></td>
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

        return announcements
            .map((a, idx) => ({ a, idx }))
            .reverse()
            .map(({ a, idx }) => {
                const unread = !isNotificationRead(a);
                return `
                    <div class="announcement-item ${unread ? "unread" : ""}">
                        <div class="announcement-item-body">
                            <h4>
                                ${escapeHTML(a.title)}
                                ${unread ? '<span class="status">New</span>' : ""}
                            </h4>
                            <p>${escapeHTML(a.message)}</p>
                            <div class="announcement-item-meta">Posted: ${escapeHTML(a.date || "System Update")}</div>
                        </div>
                        ${unread ? `
                            <button type="button" class="btn-sm btn-outline" data-mark-read-index="${idx}">
                                Mark as read
                            </button>
                        ` : `<span class="text-muted" style="font-size:12px;">Read</span>`}
                    </div>
                `;
            }).join("");
    }

    function agencyRows() {
        if (!agencies.length) {
            return '<tr><td colspan="5">No agencies registered yet.</td></tr>';
        }

        return agencies.map((agency, index) => `
            <tr>
                <td><strong>${escapeHTML(agency.name)}</strong></td>
                <td>${escapeHTML(agency.contactPerson)}</td>
                <td>${escapeHTML(agency.email)}</td>
                <td>
                    <span class="status ${statusClass(agency.status)}">
                        ${escapeHTML(agency.status)}
                    </span>
                </td>
                <td>
                    <div class="action-group">
                        <button type="button" class="btn-sm primary-button"
                            data-agency-action="edit" data-agency-index="${index}">
                            Edit
                        </button>
                        <button type="button" class="btn-sm btn-danger"
                            data-agency-action="delete" data-agency-index="${index}">
                            Delete
                        </button>
                        <button type="button" class="btn-sm btn-secondary"
                            data-agency-action="toggle" data-agency-index="${index}">
                            ${agency.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    function governanceRows() {
        if (!governanceRecords.length) {
            return '<tr><td colspan="4">No governance records have been added yet.</td></tr>';
        }

        return governanceRecords.map((record, index) => `
            <tr>
                <td><strong>${escapeHTML(record.name)}</strong></td>
                <td>${escapeHTML(record.description)}</td>
                <td>
                    <span class="status ${statusClass(record.status)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
                <td>
                    <div class="action-group">
                        <button type="button" class="btn-sm primary-button"
                            data-governance-action="edit" data-governance-index="${index}">
                            Edit
                        </button>
                        <button type="button" class="btn-sm btn-danger"
                            data-governance-action="delete" data-governance-index="${index}">
                            Delete
                        </button>
                        <button type="button" class="btn-sm btn-secondary"
                            data-governance-action="toggle" data-governance-index="${index}">
                            ${record.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

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
            return `<tr><td colspan="${isAdmin() ? 5 : 4}">No assessment records found.</td></tr>`;
        }

        return records.map(assessment => `
            <tr>
                <td><strong>${escapeHTML(assessment.participant)}</strong></td>
                <td>${escapeHTML(assessment.training)}</td>
                <td>
                    ${assessment.score === "" || assessment.score === null
                        ? "--"
                        : escapeHTML(assessment.score) + "%"}
                </td>
                <td>
                    <span class="status ${statusClass(assessment.result)}">
                        ${escapeHTML(assessment.result)}
                    </span>
                </td>
                ${isAdmin() ? `
                    <td>
                        <div class="action-group">
                            <button type="button" class="btn-sm primary-button"
                                data-assessment-action="edit"
                                data-assessment-index="${assessment.originalIndex}">
                                Edit
                            </button>
                            <button type="button" class="btn-sm btn-danger"
                                data-assessment-action="delete"
                                data-assessment-index="${assessment.originalIndex}">
                                Delete
                            </button>
                        </div>
                    </td>
                ` : ""}
            </tr>
        `).join("");
    }

    function participantSelectOptions() {
        if (!participants.length) {
            return '<option value="">No participants available</option>';
        }

        return participants.map((participant, index) => `
            <option value="${index}">
                ${escapeHTML(participant.name)} - ${escapeHTML(participant.program || "No program")}
            </option>
        `).join("");
    }

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
            return `<tr><td colspan="${isAdmin() ? 5 : 4}">No training completion records found.</td></tr>`;
        }

        return records.map(record => `
            <tr>
                <td><strong>${escapeHTML(record.participant)}</strong></td>
                <td>${escapeHTML(record.training)}</td>
                <td>${escapeHTML(record.completionDate)}</td>
                <td>
                    <span class="status ${statusClass(record.status)}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
                ${isAdmin() ? `
                    <td>
                        <div class="action-group">
                            <button type="button" class="btn-sm primary-button"
                                data-completion-action="edit"
                                data-completion-index="${record.originalIndex}">
                                Edit
                            </button>
                            <button type="button" class="btn-sm btn-danger"
                                data-completion-action="delete"
                                data-completion-index="${record.originalIndex}">
                                Delete
                            </button>
                        </div>
                    </td>
                ` : ""}
            </tr>
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
    // BACKUP & RESTORE
    // --------------------------------------------------

    function downloadDataBackup() {
        const backupData = {
            programs: loadSavedData(STORAGE_KEYS.programs, []),
            participants: loadSavedData(STORAGE_KEYS.participants, []),
            registrations: loadSavedData(STORAGE_KEYS.registrations, []),
            attendance: loadSavedData(STORAGE_KEYS.attendance, []),
            schedules: loadSavedData(STORAGE_KEYS.schedules, []),
            announcements: loadSavedData(STORAGE_KEYS.announcements, []),
            users: loadSavedData(STORAGE_KEYS.users, []),
            agencies: loadSavedData(STORAGE_KEYS.agencies, []),
            governance: loadSavedData(STORAGE_KEYS.governance, []),
            assessments: loadSavedData(STORAGE_KEYS.assessments, []),
            completions: loadSavedData(STORAGE_KEYS.completions, []),
            systemSettings: loadSystemSettings(),
            notificationSettings: loadNotificationSettings(),
            backupDate: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "textilelearn_backup_" + new Date().toISOString().slice(0, 10) + ".json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("System backup downloaded.", "success");
    }

    function restoreDataBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const backup = JSON.parse(e.target.result);
                if (!backup || typeof backup !== "object") {
                    throw new Error("Invalid backup file format.");
                }

                const keysToRestore = [
                    "programs", "participants", "registrations", "attendance",
                    "schedules", "announcements", "users", "agencies",
                    "governance", "assessments", "completions",
                    "systemSettings", "notificationSettings"
                ];

                keysToRestore.forEach(k => {
                    if (backup[k] !== undefined) {
                        localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(backup[k]));
                    }
                });

                alert("Data backup restored successfully! The application will now reload.");
                window.location.reload();
            } catch (error) {
                console.error("Restore error:", error);
                showToast("Failed to restore backup: " + error.message, "error");
            }
        };
        reader.readAsText(file);
    }

    // --------------------------------------------------
    // WEBSITE PAGES
    // --------------------------------------------------

    const pages = {
        dashboard: {
            title: "Dashboard",
            description: "Training activity overview and analytics",
            content: function () {
                const userEmail = (currentUser?.email || "").toLowerCase();

                const visibleParticipants = isAdmin()
                    ? participants
                    : participants.filter(p => (p.email || "").toLowerCase() === userEmail);

                const visibleRegistrations = isAdmin()
                    ? registrations
                    : registrations.filter(p => (p.email || "").toLowerCase() === userEmail);

                const visibleAttendance = isAdmin()
                    ? attendanceRecords
                    : attendanceRecords.filter(r => (r.email || "").toLowerCase() === userEmail);

                const settings = loadSystemSettings();

                // Build Recent Activities Feed
                const recentActivities = [];
                attendanceRecords.slice(-2).reverse().forEach(att => {
                    recentActivities.push({
                        title: `${att.name} attended ${att.program}`,
                        meta: `Attendance recorded • ${att.dateTime}`,
                        type: "turquoise"
                    });
                });
                registrations.slice(-2).reverse().forEach(reg => {
                    recentActivities.push({
                        title: `${reg.name} registered for ${reg.program}`,
                        meta: `Registration Status: ${reg.status}`,
                        type: "ocean"
                    });
                });
                if (!recentActivities.length) {
                    announcements.slice(-3).reverse().forEach(ann => {
                        recentActivities.push({
                            title: ann.title,
                            meta: ann.message,
                            type: "ocean"
                        });
                    });
                }

                return `
                    <!-- WELCOME SECTION & QUICK ACTIONS -->
                    <div class="welcome-section">
                        <div class="welcome-text">
                            <h2>Welcome back, ${escapeHTML(currentUser?.name || "User")}!</h2>
                            <p>Monitor training programs, schedules, and participant progress across ${escapeHTML(settings.systemName)}.</p>
                        </div>
                        <div class="quick-actions-bar">
                            <button type="button" class="primary-button" data-quick-nav="registration">
                                + Register Trainee
                            </button>
                            <button type="button" class="btn-ocean" data-quick-nav="attendance">
                                QR & Attendance
                            </button>
                            ${isAdmin() ? `
                                <button type="button" class="btn-outline" data-quick-nav="programs">
                                    Manage Programs
                                </button>
                            ` : ""}
                        </div>
                    </div>

                    <!-- MINIMAL STATISTIC CARDS -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-info">
                                <p>${isAdmin() ? "Active Programs" : "Available Programs"}</p>
                                <h2>${programs.length}</h2>
                            </div>
                            <div class="stat-icon-box">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-info">
                                <p>${isAdmin() ? "Registered Trainees" : "My Registrations"}</p>
                                <h2>${isAdmin() ? participants.length : visibleParticipants.length}</h2>
                            </div>
                            <div class="stat-icon-box">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-info">
                                <p>${isAdmin() ? "Pending Requests" : "My Pending Requests"}</p>
                                <h2>${visibleRegistrations.filter(r => r.status === "Pending").length}</h2>
                            </div>
                            <div class="stat-icon-box">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                        </div>

                        <div class="stat-card">
                            <div class="stat-info">
                                <p>${isAdmin() ? "Attendance Records" : "My Attendance"}</p>
                                <h2>${visibleAttendance.length}</h2>
                            </div>
                            <div class="stat-icon-box">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                        </div>
                    </div>

                    <!-- CHARTS & RECENT ACTIVITIES -->
                    <div class="dashboard-grid-2col">
                        <div class="content-card" style="margin-bottom:0;">
                            <div class="card-header-flex">
                                <h3>Enrollment & Attendance Overview</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="dashboard-program-chart"></canvas>
                            </div>
                        </div>

                        <div class="content-card" style="margin-bottom:0;">
                            <div class="card-header-flex">
                                <h3>Recent Activities</h3>
                                <button type="button" class="btn-sm btn-outline" data-quick-nav="notifications">
                                    View Updates
                                </button>
                            </div>
                            <div class="activity-feed">
                                ${recentActivities.slice(0, 4).map(act => `
                                    <div class="activity-item">
                                        <span class="activity-dot ${act.type === "ocean" ? "ocean" : ""}"></span>
                                        <div class="activity-content">
                                            <h4>${escapeHTML(act.title)}</h4>
                                            <p>${escapeHTML(act.meta)}</p>
                                        </div>
                                    </div>
                                `).join("") || '<p class="text-muted">No recent activity recorded yet.</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- UPCOMING TRAINING SCHEDULES -->
                    <div class="content-card">
                        <div class="card-header-flex">
                            <h3>Upcoming Training Schedules</h3>
                            <button type="button" class="btn-sm btn-outline" data-quick-nav="schedules">
                                Full Schedule
                            </button>
                        </div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Program Name</th>
                                        <th>Schedule</th>
                                        <th>Venue</th>
                                        <th>Enrolled</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${schedules.map(s => `
                                        <tr>
                                            <td><strong>${escapeHTML(s.program)}</strong></td>
                                            <td>${escapeHTML(s.date)} at ${escapeHTML(s.time)}</td>
                                            <td>${escapeHTML(s.venue)}</td>
                                            <td>${participants.filter(p => p.program === s.program && p.status === "Approved").length}</td>
                                            <td><span class="status approved">Open</span></td>
                                        </tr>
                                    `).join("") || '<tr><td colspan="5">No upcoming schedules.</td></tr>'}
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
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label for="program-name">Program Name</label>
                                        <input id="program-name" placeholder="Enter program name" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="program-duration">Duration</label>
                                        <input id="program-duration" placeholder="Example: 3 Days" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="program-description">Description</label>
                                    <textarea id="program-description" rows="3" placeholder="Enter program description" required></textarea>
                                </div>
                                <button type="submit" class="primary-button">Add Program</button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Training Program List</h3>
                        <div class="table-wrapper">
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
                                            <td><strong>${escapeHTML(p.name)}</strong></td>
                                            <td>${escapeHTML(p.description)}</td>
                                            <td>${escapeHTML(p.duration)}</td>
                                        </tr>
                                    `).join("") || '<tr><td colspan="3">No programs yet.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
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
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label for="schedule-program">Program</label>
                                        <select id="schedule-program" required>
                                            <option value="">Select program</option>
                                            ${programOptions()}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="schedule-venue">Venue</label>
                                        <input id="schedule-venue" placeholder="Example: Training Room 1" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="schedule-date">Date</label>
                                        <input type="date" id="schedule-date" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="schedule-time">Time</label>
                                        <input type="time" id="schedule-time" required>
                                    </div>
                                </div>
                                <button type="submit" class="primary-button">Add Schedule</button>
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
            description: "View approved and registered participants",
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
                                    <th>Agency</th>
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
                const activeAgencies = agencyOptions();
                return `
                    <div class="content-card">
                        <h3>Participant Registration</h3>
                        <form id="registration-form">
                            <div class="form-grid-2">
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
                                    <input id="participant-contact" placeholder="09XXXXXXXXX" required>
                                </div>

                                <div class="form-group">
                                    <label for="participant-program">Training Program</label>
                                    <select id="participant-program" required>
                                        <option value="">Select program</option>
                                        ${programOptions()}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="participant-agency">Agency / Organization</label>
                                ${activeAgencies ? `
                                    <select id="participant-agency" required>
                                        <option value="">Select agency</option>
                                        ${activeAgencies}
                                    </select>
                                ` : `
                                    <input id="participant-agency" placeholder="Enter agency name" required>
                                `}
                            </div>

                            <button type="submit" class="primary-button">Submit Registration</button>
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
                                        ${isAdmin() ? "<th>Actions</th>" : ""}
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

                const myTraining = myParticipant || myRegistration;

                return `
                    <div class="content-card">
                        <h3>${isAdmin() ? "Generate Participant QR Code" : "My QR Code"}</h3>

                        ${isAdmin() ? `
                            <p>Select a registered participant to generate their QR code.</p>
                            <div class="form-group">
                                <label for="qr-participant">Select Participant</label>
                                <select id="qr-participant">
                                    <option value="">Select a participant</option>
                                    ${participantSelectOptions()}
                                </select>
                            </div>
                            <button type="button" class="primary-button" id="generate-qr-button">
                                Generate Participant QR Code
                            </button>
                        ` : `
                            ${myTraining ? `
                                <p>Your registered training program has been automatically selected.</p>
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label>Participant Name</label>
                                        <input value="${escapeHTML(myTraining.name || currentUser.name)}" disabled>
                                    </div>
                                    <div class="form-group">
                                        <label>Registered Training</label>
                                        <input value="${escapeHTML(myTraining.program || "No training program")}" disabled>
                                    </div>
                                </div>
                                <button type="button" class="primary-button" id="generate-qr-button">
                                    Generate My QR Code
                                </button>
                            ` : `
                                <p>You do not have a training registration yet. Please complete your registration first.</p>
                                <button type="button" class="primary-button" disabled>
                                    Generate My QR Code
                                </button>
                            `}
                        `}

                        <div id="qr-result"></div>
                    </div>

                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Scan Participant QR Code</h3>
                            <p>Use Live Server (localhost) or HTTPS and allow camera access, or upload a QR image file.</p>

                            <div class="action-group">
                                <button type="button" class="primary-button" id="start-qr-scanner">
                                    Start Camera Scanner
                                </button>
                                <button type="button" class="btn-secondary" id="stop-qr-scanner" disabled>
                                    Stop Scanner
                                </button>
                            </div>

                            <div class="form-group" style="margin-top: 16px;">
                                <label for="qr-image-upload">Or Upload QR Code Image</label>
                                <input type="file" id="qr-image-upload" accept="image/*">
                            </div>

                            <div id="qr-reader"></div>
                            <div id="scan-result" role="status" aria-live="polite"></div>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <h3>Attendance Overview</h3>
                        <div class="stat-card" style="max-width: 260px;">
                            <div class="stat-info">
                                <p>Present (Scanned)</p>
                                <h2 id="attendance-present-count">
                                    ${isAdmin()
                                        ? attendanceRecords.length
                                        : attendanceRecords.filter(r =>
                                            (r.email || "").toLowerCase() === userEmail
                                        ).length}
                                </h2>
                            </div>
                            <div class="stat-icon-box">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
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
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label for="assessment-participant">Select Participant</label>
                                        <select id="assessment-participant" required>
                                            <option value="">Select participant</option>
                                            ${participantSelectOptions()}
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
                                        <input type="number" id="assessment-score" min="0" max="100" step="0.01" placeholder="Example: 90" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="assessment-result">Assessment Result</label>
                                        <select id="assessment-result" required>
                                            <option value="Passed">Passed</option>
                                            <option value="Failed">Failed</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" class="primary-button">Add Assessment</button>
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
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="agency-name">Agency Name</label>
                                    <input type="text" id="agency-name" placeholder="Enter agency name" required>
                                </div>
                                <div class="form-group">
                                    <label for="agency-contact">Contact Person</label>
                                    <input type="text" id="agency-contact" placeholder="Enter contact person's name" required>
                                </div>
                                <div class="form-group">
                                    <label for="agency-email">Email Address</label>
                                    <input type="email" id="agency-email" placeholder="Enter agency email" required>
                                </div>
                                <div class="form-group">
                                    <label for="agency-status">Agency Status</label>
                                    <select id="agency-status" required>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="primary-button">Add Agency</button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Agency Directory</h3>
                        <p>Manage the agencies and organizations participating in the program.</p>
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
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="governance-name">Record Name</label>
                                    <input type="text" id="governance-name" placeholder="Example: Training Policy" required>
                                </div>
                                <div class="form-group">
                                    <label for="governance-status">Status</label>
                                    <select id="governance-status" required>
                                        <option value="Active">Active</option>
                                        <option value="For Review">For Review</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="governance-description">Description</label>
                                <textarea id="governance-description" rows="4" placeholder="Enter the policy or guideline description" required></textarea>
                            </div>
                            <button type="submit" class="primary-button">Add Governance Record</button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Governance Records Directory</h3>
                        <p>Manage system policies, procedures, and guidelines.</p>
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

        records: {
            title: "Completion Records",
            description: "Add, view, edit, and manage training completion records",
            content: function () {
                return `
                    ${isAdmin() ? `
                        <div class="content-card">
                            <h3>Add Training Completion Record</h3>
                            <form id="completion-form">
                                <div class="form-grid-2">
                                    <div class="form-group">
                                        <label for="completion-participant">Select Participant</label>
                                        <select id="completion-participant" required>
                                            <option value="">Select participant</option>
                                            ${participantSelectOptions()}
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
                                </div>
                                <button type="submit" class="primary-button">Add Completion Record</button>
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
                                    <input id="announcement-title" placeholder="Enter announcement title" required>
                                </div>
                                <div class="form-group">
                                    <label for="announcement-message">Announcement Message</label>
                                    <textarea id="announcement-message" rows="4" placeholder="Enter announcement message" required></textarea>
                                </div>
                                <button type="submit" class="primary-button">Post Announcement</button>
                            </form>
                        </div>
                    ` : ""}

                    <div class="content-card">
                        <div class="card-header-flex">
                            <h3>Latest Announcements & Notifications</h3>
                            <button type="button" class="btn-sm btn-outline" id="page-mark-all-read">
                                Mark all as read
                            </button>
                        </div>
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
                    <p>Select a report category, then choose PDF or Excel format to download.</p>
                    <div class="report-export-list">
                        ${Object.keys(reportDefinitions).map(type => `
                            <div class="report-export-item">
                                <h4>${escapeHTML(reportDefinitions[type].title)}</h4>
                                <div class="action-group">
                                    <button type="button" class="btn-sm primary-button"
                                        data-export-format="pdf"
                                        data-report-type="${type}">
                                        PDF
                                    </button>
                                    <button type="button" class="btn-sm btn-ocean"
                                        data-export-format="excel"
                                        data-report-type="${type}">
                                        Excel
                                    </button>
                                </div>
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
                            <div class="form-grid-2">
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
                                    <input type="password" id="new-user-password" minlength="6" required>
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
                            </div>
                            <button type="submit" class="primary-button">Add User</button>
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
                                            <td><strong>${escapeHTML(u.name)}</strong></td>
                                            <td>${escapeHTML(u.role)}</td>
                                            <td>${escapeHTML(u.email)}</td>
                                            <td><span class="status ${statusClass(u.status || "Active")}">${escapeHTML(u.status || "Active")}</span></td>
                                            <td>
                                                <div class="action-group">
                                                    <button type="button" class="btn-sm primary-button"
                                                        data-user-action="edit"
                                                        data-user-index="${index}">
                                                        Edit
                                                    </button>
                                                    <button type="button" class="btn-sm btn-secondary"
                                                        data-user-action="toggle"
                                                        data-user-index="${index}">
                                                        ${(u.status || "Active") === "Active" ? "Deactivate" : "Activate"}
                                                    </button>
                                                </div>
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
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="profile-name">Full Name</label>
                                    <input id="profile-name" value="${escapeHTML(currentUser.name || "")}" required>
                                </div>
                                <div class="form-group">
                                    <label for="profile-email">Email Address</label>
                                    <input id="profile-email" type="email" value="${escapeHTML(currentUser.email || "")}" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="profile-role">Account Role</label>
                                <input id="profile-role" value="${escapeHTML(currentUser.role || "User")}" disabled>
                            </div>
                            <button type="submit" class="primary-button">Save Profile Changes</button>
                        </form>
                    </div>
                `;
            }
        },

        settings: {
            title: "System Settings",
            description: "Manage system configuration, notifications, and data backups",
            content: function () {
                const settings = loadSystemSettings();
                const notifSettings = loadNotificationSettings();

                return `
                    <div class="content-card">
                        <h3>System Information</h3>
                        <form id="settings-form">
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label for="setting-system-name">System Name</label>
                                    <input id="setting-system-name" value="${escapeHTML(settings.systemName)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="setting-system-type">System Type</label>
                                    <input id="setting-system-type" value="${escapeHTML(settings.systemType)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="setting-project">Project</label>
                                    <input id="setting-project" value="${escapeHTML(settings.project)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="setting-version">Version</label>
                                    <input id="setting-version" value="${escapeHTML(settings.version)}" required>
                                </div>
                            </div>
                            <button type="submit" class="primary-button">Save Settings</button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Notification Settings</h3>
                        <form id="notification-settings-form">
                            <div class="form-group" style="display:flex;align-items:center;gap:10px;">
                                <input type="checkbox" id="notif-email" ${notifSettings.email ? "checked" : ""}>
                                <label for="notif-email" style="margin:0;">Enable Email Notifications</label>
                            </div>
                            <div class="form-group" style="display:flex;align-items:center;gap:10px;">
                                <input type="checkbox" id="notif-sms" ${notifSettings.sms ? "checked" : ""}>
                                <label for="notif-sms" style="margin:0;">Enable SMS Notifications</label>
                            </div>
                            <div class="form-group" style="display:flex;align-items:center;gap:10px;">
                                <input type="checkbox" id="notif-system" ${notifSettings.system ? "checked" : ""}>
                                <label for="notif-system" style="margin:0;">Enable System Alerts</label>
                            </div>
                            <button type="submit" class="primary-button">Save Notification Settings</button>
                        </form>
                    </div>

                    <div class="content-card">
                        <h3>Data Backup & Recovery</h3>
                        <p>Download a complete JSON backup of all system data or restore from a previously saved backup file.</p>
                        <div class="action-group">
                            <button type="button" class="primary-button" id="download-backup-btn">Download Data Backup</button>
                            <label for="restore-backup-file" class="btn-label btn-ocean" style="cursor:pointer;margin:0;">
                                Restore from Backup
                            </label>
                            <input type="file" id="restore-backup-file" accept=".json" hidden>
                        </div>
                    </div>
                `;
            }
        }
    };

    // --------------------------------------------------
    // DISPLAY PAGE
    // --------------------------------------------------

    function showPage(pageName) {
        if (!isAdmin() && ADMIN_ONLY_PAGES.has(pageName)) {
            showToast("This page is available to administrators only.", "warning");
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

        closeMobileSidebar();

        if (pageName === "dashboard") {
            renderDashboardChart();
        }
    }

    // --------------------------------------------------
    // PDF AND EXCEL EXPORT
    // --------------------------------------------------

    const exportLibraryPromises = {};

    function loadExportLibrary(name, url, testFunction) {
        if (testFunction()) return Promise.resolve();
        if (exportLibraryPromises[name]) return exportLibraryPromises[name];

        exportLibraryPromises[name] = new Promise((resolve, reject) => {
            let script = document.querySelector('script[data-export-library="' + name + '"]');
            if (!script) {
                script = document.createElement("script");
                script.src = url;
                script.async = true;
                script.setAttribute("data-export-library", name);
                document.head.appendChild(script);
            }

            script.onload = () => {
                if (testFunction()) resolve();
                else reject(new Error(name + " library is unavailable."));
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
            showToast("The selected report is not available.", "error");
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

                const worksheet = XLSX.utils.aoa_to_sheet([report.headers, ...rows]);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
                XLSX.writeFile(workbook, fileName + ".xlsx");
                showToast("Excel report downloaded.", "success");

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
                showToast("PDF report downloaded.", "success");
            }
        } catch (error) {
            console.error("Report export error:", error);
            showToast("Unable to export report: " + error.message, "error");
        }
    }

    // --------------------------------------------------
    // QR CODE SCANNER & ATTENDANCE
    // --------------------------------------------------

    function loadQrScannerLibrary() {
        if (window.Html5Qrcode) return Promise.resolve();
        if (scannerLibraryLoading) return scannerLibraryLoading;

        scannerLibraryLoading = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
            script.onload = () => window.Html5Qrcode ? resolve() : reject(new Error("QR scanner library unavailable."));
            script.onerror = () => reject(new Error("Could not load QR scanner library."));
            document.head.appendChild(script);
        }).finally(() => {
            scannerLibraryLoading = null;
        });

        return scannerLibraryLoading;
    }

    async function stopQrScanner() {
        if (qrScanner) {
            try { await qrScanner.stop(); } catch (e) { /* ignore */ }
            try { await qrScanner.clear(); } catch (e) { /* ignore */ }
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
            if (result) result.textContent = "This QR code is not a valid participant code.";
            return;
        }

        if (!info || info.system !== "TextileLearn" || !info.participant) {
            if (result) result.textContent = "This QR code does not contain valid participant information.";
            return;
        }

        const participant = participants.find(person =>
            person.name === info.participant &&
            (person.email || "") === (info.email || "") &&
            (person.program || "") === (info.program || "")
        );

        if (!participant) {
            if (result) result.textContent = "Participant not found. Please register and approve the participant first.";
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
            if (result) result.textContent = participant.name + " is already marked Present today.";
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
        if (result) result.textContent = "Attendance recorded: " + participant.name + " — Present.";
        showToast("Attendance recorded for " + participant.name, "success");
        await stopQrScanner();
    }

    async function scanQrImage(file) {
        const result = document.getElementById("scan-result");
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            if (result) result.textContent = "Please select a valid QR code image.";
            return;
        }

        if (!isAdmin()) {
            if (result) result.textContent = "Only administrators can record attendance.";
            return;
        }

        try {
            if (result) result.textContent = "Reading QR code image. Please wait...";
            await stopQrScanner();
            await loadQrScannerLibrary();

            const imageScanner = new Html5Qrcode("qr-reader");
            try {
                const decodedText = await imageScanner.scanFile(file, true);
                await imageScanner.clear();
                await markAttendance(decodedText);
            } catch (error) {
                try { await imageScanner.clear(); } catch (e) { /* ignore */ }
                throw error;
            }
        } catch (error) {
            console.error("QR image scanning error:", error);
            if (result) result.textContent = "Unable to read the QR code. Please upload a clear QR code image.";
        }
    }

    async function startQrScanner() {
        const result = document.getElementById("scan-result");
        const startButton = document.getElementById("start-qr-scanner");
        const stopButton = document.getElementById("stop-qr-scanner");

        if (!result || !startButton || !stopButton) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            result.textContent = "Camera access requires HTTPS or http://localhost.";
            return;
        }

        startButton.disabled = true;
        result.textContent = "Loading scanner. Please allow camera access.";

        try {
            await loadQrScannerLibrary();
            qrScanner = new Html5Qrcode("qr-reader");

            await qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                decodedText => markAttendance(decodedText),
                () => {}
            );

            stopButton.disabled = false;
            result.textContent = "Camera is active. Point it at a participant QR code.";
        } catch (error) {
            console.error("QR scanner error:", error);
            result.textContent = "Could not start the camera: " + (error.message || error);
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
        applyBranding();
        renderNotificationBell();

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
        toggleNotificationDropdown(true);

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

        if (event.target.closest("#show-login") || event.target.closest("#reset-back-login")) {
            event.preventDefault();
            showAuth("login");
            return;
        }

        if (event.target.closest("#logout-button")) {
            event.preventDefault();
            logout();
        }
    });

    // LOGIN FORM
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
                showToast("Invalid email or password. Please check your credentials or sign up.", "error");
                return;
            }

            if ((user.status || "Active") !== "Active") {
                showToast("This account is inactive. Please contact the administrator.", "warning");
                return;
            }

            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            openApplication(user);
            showToast("Welcome back, " + user.name + "!", "success");
        });
    }

    // SIGNUP FORM (First account automatically becomes Admin)
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.getElementById("signup-name").value.trim();
            const email = document.getElementById("signup-email").value.trim().toLowerCase();
            const password = document.getElementById("signup-password").value;
            const confirmInput = document.getElementById("signup-confirm");
            const confirm = confirmInput ? confirmInput.value : password;

            if (!name || !email || !password) {
                return showToast("Please complete all sign-up fields.", "warning");
            }

            if (password.length < 6) {
                return showToast("Password must be at least 6 characters.", "warning");
            }

            if (password !== confirm) {
                return showToast("Passwords do not match.", "error");
            }

            if (users.some(u => (u.email || "").toLowerCase() === email)) {
                return showToast("This email is already registered.", "error");
            }

            const role = users.length === 0 ? "Admin" : "User";

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

            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            signupForm.reset();
            openApplication(user);
            showToast("Account created (" + role + ")!", "success");
        });
    }

    // RESET PASSWORD FORM
    const resetForm = document.getElementById("reset-form");
    if (resetForm) {
        resetForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("reset-email").value.trim().toLowerCase();
            const password = document.getElementById("reset-password").value;

            if (password.length < 6) {
                return showToast("Password must be at least 6 characters.", "warning");
            }

            const user = users.find(u => (u.email || "").toLowerCase() === email);
            if (!user) {
                return showToast("No account was found with that email.", "error");
            }

            const oldPassword = user.password;
            user.password = password;

            if (!saveData(STORAGE_KEYS.users, users)) {
                user.password = oldPassword;
                return;
            }

            resetForm.reset();
            showAuth("login");
            showToast("Password updated. Please log in.", "success");
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
    // DELEGATED CLICK ACTIONS
    // --------------------------------------------------

    if (pageContent) {
        pageContent.addEventListener("click", function (event) {

            // DASHBOARD QUICK NAVIGATION
            const quickNav = event.target.closest("[data-quick-nav]");
            if (quickNav) {
                const targetPage = quickNav.getAttribute("data-quick-nav");
                if (targetPage) showPage(targetPage);
                return;
            }

            // MARK SINGLE ANNOUNCEMENT AS READ
            const markReadBtn = event.target.closest("[data-mark-read-index]");
            if (markReadBtn) {
                const idx = Number(markReadBtn.getAttribute("data-mark-read-index"));
                markNotificationAsRead(idx);
                showPage("notifications");
                return;
            }

            // MARK ALL READ ON NOTIFICATIONS PAGE
            if (event.target.closest("#page-mark-all-read")) {
                markAllNotificationsAsRead();
                return;
            }

            // REGISTRATION APPROVAL / REJECTION
            const regAction = event.target.closest("[data-reg-action]");
            if (regAction) {
                if (!isAdmin()) {
                    return showToast("Only administrators can approve or reject registrations.", "error");
                }

                const index = Number(regAction.getAttribute("data-reg-index"));
                const action = regAction.getAttribute("data-reg-action");
                const reg = registrations[index];
                if (!reg) return;

                const newStatus = action === "approve" ? "Approved" : "Rejected";
                reg.status = newStatus;

                const existingParticipant = participants.find(p =>
                    (p.email || "").toLowerCase() === (reg.email || "").toLowerCase() &&
                    p.program === reg.program
                );

                if (existingParticipant) {
                    existingParticipant.status = newStatus;
                } else if (newStatus === "Approved") {
                    participants.push({ ...reg, status: "Approved" });
                }

                saveData(STORAGE_KEYS.registrations, registrations);
                saveData(STORAGE_KEYS.participants, participants);
                showPage("registration");
                showToast("Registration marked as " + newStatus + ".", "success");
                return;
            }

            // AGENCY MANAGEMENT ACTIONS
            const agencyAction = event.target.closest("[data-agency-action]");
            if (agencyAction) {
                if (!isAdmin()) return showToast("Only administrators can manage agencies.", "error");

                const index = Number(agencyAction.getAttribute("data-agency-index"));
                const action = agencyAction.getAttribute("data-agency-action");
                const agency = agencies[index];
                if (!agency) return;

                if (action === "edit") {
                    const name = prompt("Enter the agency name:", agency.name);
                    if (name === null) return;
                    const contactPerson = prompt("Enter the contact person's name:", agency.contactPerson);
                    if (contactPerson === null) return;
                    const email = prompt("Enter the agency email:", agency.email);
                    if (email === null) return;

                    const cleanName = name.trim();
                    const cleanContact = contactPerson.trim();
                    const cleanEmail = email.trim().toLowerCase();

                    if (!cleanName || !cleanContact || !cleanEmail) {
                        return showToast("Please complete all agency information.", "warning");
                    }

                    if (agencies.some((a, i) => i !== index && a.name.toLowerCase() === cleanName.toLowerCase())) {
                        return showToast("An agency with this name already exists.", "error");
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
                    showToast("Agency updated successfully!", "success");
                    return;
                }

                if (action === "delete") {
                    if (!confirm("Are you sure you want to delete " + agency.name + "?")) return;
                    const removedAgency = agencies.splice(index, 1)[0];
                    if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                        agencies.splice(index, 0, removedAgency);
                        return;
                    }
                    showPage("agency");
                    showToast("Agency deleted.", "success");
                    return;
                }

                if (action === "toggle") {
                    const oldStatus = agency.status;
                    agency.status = oldStatus === "Active" ? "Inactive" : "Active";
                    if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                        agency.status = oldStatus;
                        return;
                    }
                    showPage("agency");
                    showToast("Agency status updated.", "success");
                    return;
                }
                return;
            }

            // GOVERNANCE MANAGEMENT ACTIONS
            const governanceAction = event.target.closest("[data-governance-action]");
            if (governanceAction) {
                if (!isAdmin()) return showToast("Only administrators can manage governance records.", "error");

                const index = Number(governanceAction.getAttribute("data-governance-index"));
                const action = governanceAction.getAttribute("data-governance-action");
                const record = governanceRecords[index];
                if (!record) return;

                if (action === "edit") {
                    const name = prompt("Enter the governance record name:", record.name);
                    if (name === null) return;
                    const description = prompt("Enter the record description:", record.description);
                    if (description === null) return;
                    const status = prompt("Enter status: Active, For Review, or Inactive", record.status);
                    if (status === null) return;

                    const cleanName = name.trim();
                    const cleanDescription = description.trim();
                    const cleanStatus = status.trim();
                    const validStatuses = ["Active", "For Review", "Inactive"];

                    if (!cleanName || !cleanDescription) {
                        return showToast("Record name and description are required.", "warning");
                    }
                    if (!validStatuses.includes(cleanStatus)) {
                        return showToast("Please enter Active, For Review, or Inactive.", "warning");
                    }
                    if (governanceRecords.some((r, i) => i !== index && r.name.toLowerCase() === cleanName.toLowerCase())) {
                        return showToast("A governance record with this name already exists.", "error");
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
                    showToast("Governance record updated!", "success");
                    return;
                }

                if (action === "delete") {
                    if (!confirm("Are you sure you want to delete " + record.name + "?")) return;
                    const removedRecord = governanceRecords.splice(index, 1)[0];
                    if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                        governanceRecords.splice(index, 0, removedRecord);
                        return;
                    }
                    showPage("governance");
                    showToast("Governance record deleted.", "success");
                    return;
                }

                if (action === "toggle") {
                    const oldStatus = record.status;
                    record.status = oldStatus === "Active" ? "Inactive" : "Active";
                    if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                        record.status = oldStatus;
                        return;
                    }
                    showPage("governance");
                    showToast("Governance status updated.", "success");
                    return;
                }
                return;
            }

            // ASSESSMENT MANAGEMENT ACTIONS
            const assessmentAction = event.target.closest("[data-assessment-action]");
            if (assessmentAction) {
                if (!isAdmin()) return showToast("Only administrators can manage assessments.", "error");

                const index = Number(assessmentAction.getAttribute("data-assessment-index"));
                const action = assessmentAction.getAttribute("data-assessment-action");
                const assessment = assessments[index];
                if (!assessment) return;

                if (action === "edit") {
                    const participant = prompt("Enter participant name:", assessment.participant);
                    if (participant === null) return;
                    const training = prompt("Enter training program:", assessment.training);
                    if (training === null) return;
                    const scoreInput = prompt("Enter score from 0 to 100:", assessment.score);
                    if (scoreInput === null) return;
                    const result = prompt("Enter result: Passed, Failed, or Not Evaluated", assessment.result);
                    if (result === null) return;

                    const cleanParticipant = participant.trim();
                    const cleanTraining = training.trim();
                    const cleanResult = result.trim();
                    const cleanScore = scoreInput.trim();
                    const validResults = ["Passed", "Failed", "Not Evaluated"];

                    if (!cleanParticipant || !cleanTraining) {
                        return showToast("Participant and training program are required.", "warning");
                    }
                    if (!validResults.includes(cleanResult)) {
                        return showToast("Please enter Passed, Failed, or Not Evaluated.", "warning");
                    }

                    let numericScore = "";
                    if (cleanResult === "Not Evaluated" && cleanScore === "") {
                        numericScore = "";
                    } else {
                        numericScore = Number(cleanScore);
                        if (cleanScore === "" || !Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
                            return showToast("Please enter a valid score from 0 to 100.", "warning");
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
                    showToast("Assessment updated!", "success");
                    return;
                }

                if (action === "delete") {
                    if (!confirm("Delete assessment record for " + assessment.participant + "?")) return;
                    const removedAssessment = assessments.splice(index, 1)[0];
                    if (!saveData(STORAGE_KEYS.assessments, assessments)) {
                        assessments.splice(index, 0, removedAssessment);
                        return;
                    }
                    showPage("assessment");
                    showToast("Assessment deleted.", "success");
                    return;
                }
                return;
            }

            // COMPLETION RECORD ACTIONS
            const completionAction = event.target.closest("[data-completion-action]");
            if (completionAction) {
                if (!isAdmin()) return showToast("Only administrators can manage completion records.", "error");

                const index = Number(completionAction.getAttribute("data-completion-index"));
                const action = completionAction.getAttribute("data-completion-action");
                const record = completionRecords[index];
                if (!record) return;

                if (action === "edit") {
                    const participantName = prompt("Enter participant name:", record.participant);
                    if (participantName === null) return;
                    const training = prompt("Enter training program:", record.training);
                    if (training === null) return;
                    const completionDate = prompt("Enter completion date (YYYY-MM-DD):", record.completionDate);
                    if (completionDate === null) return;
                    const status = prompt("Enter status: Completed, In Progress, or Not Completed", record.status);
                    if (status === null) return;

                    const cleanParticipant = participantName.trim();
                    const cleanTraining = training.trim();
                    const cleanDate = completionDate.trim();
                    const cleanStatus = status.trim();
                    const validStatuses = ["Completed", "In Progress", "Not Completed"];

                    if (!cleanParticipant || !cleanTraining || !cleanDate) {
                        return showToast("Please complete all completion record fields.", "warning");
                    }
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || Number.isNaN(Date.parse(cleanDate))) {
                        return showToast("Please enter a valid date in YYYY-MM-DD format.", "warning");
                    }
                    if (!validStatuses.includes(cleanStatus)) {
                        return showToast("Please enter Completed, In Progress, or Not Completed.", "warning");
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
                    showToast("Completion record updated!", "success");
                    return;
                }

                if (action === "delete") {
                    if (!confirm("Delete completion record for " + record.participant + "?")) return;
                    const removedRecord = completionRecords.splice(index, 1)[0];
                    if (!saveData(STORAGE_KEYS.completions, completionRecords)) {
                        completionRecords.splice(index, 0, removedRecord);
                        return;
                    }
                    showPage("records");
                    showToast("Completion record deleted.", "success");
                    return;
                }
                return;
            }

            // USER ACCOUNT MANAGEMENT
            const userAction = event.target.closest("[data-user-action]");
            if (userAction) {
                if (!isAdmin()) return showToast("Only administrators can manage user accounts.", "error");

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
                    const role = prompt("Enter role: Admin, User, Participant, or Training Officer", user.role);
                    if (role === null) return;

                    const cleanName = name.trim();
                    const cleanEmail = email.trim().toLowerCase();
                    const cleanRole = role.trim();
                    const validRoles = ["Admin", "User", "Participant", "Training Officer"];

                    if (!cleanName || !cleanEmail) {
                        return showToast("Name and email are required.", "warning");
                    }
                    if (!validRoles.includes(cleanRole)) {
                        return showToast("Please enter a valid account role.", "warning");
                    }
                    if (users.some((u, i) => i !== index && (u.email || "").toLowerCase() === cleanEmail)) {
                        return showToast("This email is already registered.", "error");
                    }

                    const wasAdmin = isAdmin(user);
                    const willBeAdmin = cleanRole.toLowerCase() === "admin";

                    if (wasAdmin && !willBeAdmin) {
                        const otherAdmins = users.filter((u, i) =>
                            i !== index && isAdmin(u) && (u.status || "Active") === "Active"
                        );
                        if (!otherAdmins.length) {
                            return showToast("You cannot remove the last active administrator.", "error");
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

                    if (currentUser && (currentUser.email || "").toLowerCase() === oldEmail) {
                        currentUser = { ...user };
                        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
                        if (headerUser) headerUser.textContent = currentUser.name + " (" + currentUser.role + ")";
                        updateNavigationVisibility();
                    }

                    showPage("users");
                    showToast("User account updated!", "success");
                }

                if (action === "toggle") {
                    const isActive = (user.status || "Active") === "Active";

                    if (isActive && currentUser && (currentUser.email || "").toLowerCase() === (user.email || "").toLowerCase()) {
                        return showToast("You cannot deactivate your own account.", "error");
                    }

                    if (isActive && isAdmin(user)) {
                        const otherAdmins = users.filter((u, i) =>
                            i !== index && isAdmin(u) && (u.status || "Active") === "Active"
                        );
                        if (!otherAdmins.length) {
                            return showToast("You cannot deactivate the last active administrator.", "error");
                        }
                    }

                    user.status = isActive ? "Inactive" : "Active";
                    if (!saveData(STORAGE_KEYS.users, users)) {
                        user.status = isActive ? "Active" : "Inactive";
                        return;
                    }

                    showPage("users");
                    showToast("User status updated.", "success");
                }
                return;
            }

            // REPORT EXPORT
            const exportButton = event.target.closest("[data-export-format]");
            if (exportButton) {
                if (!isAdmin()) return showToast("Only administrators can export reports.", "error");
                exportReport(
                    exportButton.getAttribute("data-report-type"),
                    exportButton.getAttribute("data-export-format")
                );
                return;
            }

            // DOWNLOAD BACKUP
            if (event.target.closest("#download-backup-btn")) {
                if (!isAdmin()) return showToast("Only administrators can download data backups.", "error");
                downloadDataBackup();
                return;
            }

            // QR SCANNER START / STOP
            if (event.target.closest("#start-qr-scanner")) {
                if (!isAdmin()) return showToast("Only administrators can scan attendance.", "error");
                startQrScanner();
                return;
            }

            if (event.target.closest("#stop-qr-scanner")) {
                stopQrScanner();
                const result = document.getElementById("scan-result");
                if (result) result.textContent = "Scanner stopped.";
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
                        return showToast("Please select a participant first.", "warning");
                    }
                    participant = participants[Number(select.value)];
                } else {
                    const userEmail = (currentUser?.email || "").toLowerCase();
                    const registration = registrations.find(r => (r.email || "").toLowerCase() === userEmail);
                    const registeredParticipant = participants.find(p =>
                        (p.email || "").toLowerCase() === userEmail &&
                        (!registration || p.program === registration.program)
                    );

                    participant = registeredParticipant || registration || null;
                    if (!participant) {
                        return showToast("No registered training found for your account.", "warning");
                    }
                }

                if (!participant) {
                    return showToast("The selected participant could not be found.", "error");
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
                    <div class="qr-card-preview">
                        <h4>Participant QR Code</h4>
                        <img src="${qrUrl}" alt="Participant QR code" width="200" height="200">
                        <p><strong>${escapeHTML(qrInfo.participant)}</strong></p>
                        <p class="text-muted" style="font-size:13px;">${escapeHTML(qrInfo.program || "No training program")}</p>
                        <p class="text-muted" style="font-size:11px;margin-top:8px;">
                            Right-click image and select "Save image as" to download.
                        </p>
                    </div>
                `;
            }
        });

        // FILE INPUT HANDLERS (QR Image & JSON Restore)
        pageContent.addEventListener("change", function (event) {
            if (event.target.id === "qr-image-upload") {
                if (!isAdmin()) return showToast("Only administrators can record attendance.", "error");
                const file = event.target.files[0];
                if (file) {
                    scanQrImage(file);
                    event.target.value = "";
                }
            }

            if (event.target.id === "restore-backup-file") {
                if (!isAdmin()) return showToast("Only administrators can restore backups.", "error");
                const file = event.target.files[0];
                if (file) {
                    if (confirm("Restoring from backup will overwrite current system data. Continue?")) {
                        restoreDataBackup(file);
                    }
                    event.target.value = "";
                }
            }
        });

        // --------------------------------------------------
        // FORM SUBMISSIONS
        // --------------------------------------------------

        pageContent.addEventListener("submit", function (event) {
            event.preventDefault();

            // SYSTEM SETTINGS
            if (event.target.id === "settings-form") {
                if (!isAdmin()) return showToast("Only administrators can modify system settings.", "error");

                const systemName = document.getElementById("setting-system-name").value.trim();
                const systemType = document.getElementById("setting-system-type").value.trim();
                const project = document.getElementById("setting-project").value.trim();
                const version = document.getElementById("setting-version").value.trim();

                if (!systemName || !systemType || !project || !version) {
                    return showToast("Please complete all system settings fields.", "warning");
                }

                if (saveData(STORAGE_KEYS.systemSettings, { systemName, systemType, project, version })) {
                    applyBranding();
                    showToast("System settings saved!", "success");
                    showPage("settings");
                }
                return;
            }

            // NOTIFICATION SETTINGS
            if (event.target.id === "notification-settings-form") {
                if (!isAdmin()) return showToast("Only administrators can modify notification settings.", "error");

                const email = document.getElementById("notif-email").checked;
                const sms = document.getElementById("notif-sms").checked;
                const system = document.getElementById("notif-system").checked;

                if (saveData(STORAGE_KEYS.notificationSettings, { email, sms, system })) {
                    showToast("Notification settings saved!", "success");
                    showPage("settings");
                }
                return;
            }

            // ADD AGENCY
            if (event.target.id === "agency-form") {
                if (!isAdmin()) return showToast("Only administrators can add agencies.", "error");

                const name = document.getElementById("agency-name").value.trim();
                const contactPerson = document.getElementById("agency-contact").value.trim();
                const email = document.getElementById("agency-email").value.trim().toLowerCase();
                const status = document.getElementById("agency-status").value;

                if (!name || !contactPerson || !email || !status) {
                    return showToast("Please complete all agency fields.", "warning");
                }
                if (agencies.some(a => a.name.toLowerCase() === name.toLowerCase())) {
                    return showToast("This agency is already registered.", "error");
                }

                agencies.push({ name, contactPerson, email, status });
                if (!saveData(STORAGE_KEYS.agencies, agencies)) {
                    agencies.pop();
                    return;
                }

                showPage("agency");
                showToast("Agency added successfully!", "success");
                return;
            }

            // ADD GOVERNANCE RECORD
            if (event.target.id === "governance-form") {
                if (!isAdmin()) return showToast("Only administrators can add governance records.", "error");

                const name = document.getElementById("governance-name").value.trim();
                const description = document.getElementById("governance-description").value.trim();
                const status = document.getElementById("governance-status").value;

                if (!name || !description || !status) {
                    return showToast("Please complete all governance record fields.", "warning");
                }
                if (governanceRecords.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                    return showToast("A governance record with this name already exists.", "error");
                }

                governanceRecords.push({ name, description, status });
                if (!saveData(STORAGE_KEYS.governance, governanceRecords)) {
                    governanceRecords.pop();
                    return;
                }

                showPage("governance");
                showToast("Governance record added!", "success");
                return;
            }

            // ADD ASSESSMENT RECORD
            if (event.target.id === "assessment-form") {
                if (!isAdmin()) return showToast("Only administrators can add assessment records.", "error");

                const participantIndex = document.getElementById("assessment-participant").value;
                const training = document.getElementById("assessment-training").value;
                const scoreInput = document.getElementById("assessment-score").value;
                const result = document.getElementById("assessment-result").value;

                if (participantIndex === "" || !training || scoreInput === "") {
                    return showToast("Please complete all assessment fields.", "warning");
                }

                const participant = participants[Number(participantIndex)];
                if (!participant) return showToast("Please select a valid participant.", "error");

                const score = Number(scoreInput);
                if (!Number.isFinite(score) || score < 0 || score > 100) {
                    return showToast("Please enter a score from 0 to 100.", "warning");
                }

                assessments.push({
                    participant: participant.name,
                    email: participant.email || "",
                    training,
                    score,
                    result
                });

                if (!saveData(STORAGE_KEYS.assessments, assessments)) {
                    assessments.pop();
                    return;
                }

                showPage("assessment");
                showToast("Assessment record added!", "success");
                return;
            }

            // ADD COMPLETION RECORD
            if (event.target.id === "completion-form") {
                if (!isAdmin()) return showToast("Only administrators can add completion records.", "error");

                const participantIndex = document.getElementById("completion-participant").value;
                const training = document.getElementById("completion-training").value;
                const completionDate = document.getElementById("completion-date").value;
                const status = document.getElementById("completion-status").value;

                if (participantIndex === "" || !training || !completionDate || !status) {
                    return showToast("Please complete all completion record fields.", "warning");
                }

                const participant = participants[Number(participantIndex)];
                if (!participant) return showToast("Please select a valid participant.", "error");

                completionRecords.push({
                    participant: participant.name,
                    email: participant.email || "",
                    training,
                    completionDate,
                    status
                });

                if (!saveData(STORAGE_KEYS.completions, completionRecords)) {
                    completionRecords.pop();
                    return;
                }

                showPage("records");
                showToast("Completion record added!", "success");
                return;
            }

            // ADD USER ACCOUNT
            if (event.target.id === "user-form") {
                if (!isAdmin()) return showToast("Only administrators can create user accounts.", "error");

                const name = document.getElementById("new-user-name").value.trim();
                const email = document.getElementById("new-user-email").value.trim().toLowerCase();
                const password = document.getElementById("new-user-password").value;
                const role = document.getElementById("new-user-role").value;

                if (!name || !email || !password || !role) {
                    return showToast("Please complete all user account fields.", "warning");
                }
                if (password.length < 6) {
                    return showToast("Password must contain at least 6 characters.", "warning");
                }
                if (users.some(u => (u.email || "").toLowerCase() === email)) {
                    return showToast("This email address is already registered.", "error");
                }

                users.push({ name, email, password, role, status: "Active" });
                if (!saveData(STORAGE_KEYS.users, users)) {
                    users.pop();
                    return;
                }

                showPage("users");
                showToast("New user account created!", "success");
                return;
            }

            // UPDATE USER PROFILE
            if (event.target.id === "profile-form") {
                const name = document.getElementById("profile-name").value.trim();
                const email = document.getElementById("profile-email").value.trim().toLowerCase();

                if (!name || !email) {
                    return showToast("Please enter your name and email address.", "warning");
                }

                const oldEmail = (currentUser.email || "").toLowerCase();
                const duplicateEmail = users.some(user =>
                    (user.email || "").toLowerCase() === email &&
                    (user.email || "").toLowerCase() !== oldEmail
                );

                if (duplicateEmail) {
                    return showToast("This email address is already used by another account.", "error");
                }

                const userIndex = users.findIndex(user => (user.email || "").toLowerCase() === oldEmail);
                if (userIndex === -1) return showToast("Your account could not be found.", "error");

                const oldUser = { ...currentUser };
                const oldStoredUser = { ...users[userIndex] };

                currentUser.name = name;
                currentUser.email = email;
                users[userIndex] = { ...users[userIndex], name, email };

                if (!saveData(STORAGE_KEYS.users, users)) {
                    currentUser = oldUser;
                    users[userIndex] = oldStoredUser;
                    return;
                }

                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
                if (headerUser) headerUser.textContent = currentUser.name + " (" + currentUser.role + ")";

                showPage("profile");
                showToast("Profile updated successfully!", "success");
                return;
            }

            // ADD TRAINING PROGRAM
            if (event.target.id === "program-form") {
                if (!isAdmin()) return showToast("Only administrators can manage programs.", "error");

                const name = document.getElementById("program-name").value.trim();
                const description = document.getElementById("program-description").value.trim();
                const duration = document.getElementById("program-duration").value.trim();

                if (!name || !description || !duration) {
                    return showToast("Please complete all program fields.", "warning");
                }
                if (programs.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                    return showToast("This training program already exists.", "error");
                }

                programs.push({ name, description, duration });
                if (!saveData(STORAGE_KEYS.programs, programs)) {
                    programs.pop();
                    return;
                }

                showPage("programs");
                showToast("Training program added!", "success");
                return;
            }

            // ADD TRAINING SCHEDULE
            if (event.target.id === "schedule-form") {
                if (!isAdmin()) return showToast("Only administrators can manage schedules.", "error");

                const program = document.getElementById("schedule-program").value;
                const date = document.getElementById("schedule-date").value;
                const time = document.getElementById("schedule-time").value;
                const venue = document.getElementById("schedule-venue").value.trim();

                if (!program || !date || !time || !venue) {
                    return showToast("Please complete all schedule fields.", "warning");
                }

                schedules.push({ program, date, time, venue });
                if (!saveData(STORAGE_KEYS.schedules, schedules)) {
                    schedules.pop();
                    return;
                }

                showPage("schedules");
                showToast("Training schedule added!", "success");
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
                    return showToast("Please complete all registration fields.", "warning");
                }

                if (!isAdmin() && email !== (currentUser?.email || "").toLowerCase()) {
                    return showToast("Please use the email address connected to your account.", "warning");
                }

                if (registrations.some(p =>
                    (p.email || "").toLowerCase() === email &&
                    p.program === program
                )) {
                    return showToast("This participant is already registered for this program.", "error");
                }

                const newParticipant = {
                    name,
                    email,
                    contact,
                    program,
                    agency,
                    status: isAdmin() ? "Approved" : "Pending"
                };

                registrations.push(newParticipant);
                participants.push({ ...newParticipant });

                if (!saveData(STORAGE_KEYS.registrations, registrations) ||
                    !saveData(STORAGE_KEYS.participants, participants)) {
                    registrations.pop();
                    participants.pop();
                    saveData(STORAGE_KEYS.registrations, registrations);
                    saveData(STORAGE_KEYS.participants, participants);
                    return;
                }

                showPage("registration");
                showToast("Registration submitted successfully!", "success");
                return;
            }

            // ADD ANNOUNCEMENT
            if (event.target.id === "announcement-form") {
                if (!isAdmin()) return showToast("Only administrators can add announcements.", "error");

                const title = document.getElementById("announcement-title").value.trim();
                const message = document.getElementById("announcement-message").value.trim();

                if (!title || !message) {
                    return showToast("Please enter an announcement title and message.", "warning");
                }

                const dateLabel = new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });

                announcements.push({
                    id: "notif-" + Date.now(),
                    title,
                    message,
                    date: dateLabel,
                    readBy: []
                });

                if (!saveData(STORAGE_KEYS.announcements, announcements)) {
                    announcements.pop();
                    return;
                }

                renderNotificationBell();
                showPage("notifications");
                showToast("Announcement posted!", "success");
                return;
            }
        });
    }

    // --------------------------------------------------
    // RESTORE PREVIOUS LOGIN SESSION
    // --------------------------------------------------

    try {
        currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || "null");
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        currentUser = null;
    }

    if (currentUser) {
        const savedUser = users.find(u =>
            (u.email || "").toLowerCase() === (currentUser.email || "").toLowerCase()
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