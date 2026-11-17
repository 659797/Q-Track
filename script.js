
/* ==========================================
   Q-TRACK - QA ENGINEERING TOOLKIT
   Complete JavaScript
========================================== */

/* ==========================================
   1. DATA STORAGE
========================================== */

const STORAGE_KEY = "qtrackData";

let data = {
    requirements: [],
    scenarios: [],
    testCases: [],
    executions: [],
    defects: [],
    activities: []
};

function loadData() {
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (savedData && typeof savedData === "object") {
            data = {
                requirements: savedData.requirements || [],
                scenarios: savedData.scenarios || [],
                testCases: savedData.testCases || [],
                executions: savedData.executions || [],
                defects: savedData.defects || [],
                activities: savedData.activities || []
            };
        }
    } catch (error) {
        console.error("Unable to load Q-Track data:", error);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ==========================================
   2. HELPER FUNCTIONS
========================================== */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function generateID(prefix, collection) {
    const numbers = collection.map(item => {
        const match = String(item.id || "").match(/(\d+)$/);
        return match ? Number(match[1]) : 0;
    });

    const nextNumber = Math.max(0, ...numbers) + 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

function displayDate(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "N/A";
    }

    return parsedDate.toLocaleDateString();
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

function badgeClass(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function getStatusBadge(status) {
    return `<span class="status-badge status-${badgeClass(status)}">${escapeHTML(status || "N/A")}</span>`;
}

function getPriorityBadge(priority) {
    return `<span class="priority-badge priority-${badgeClass(priority)}">${escapeHTML(priority || "N/A")}</span>`;
}

function showModal(id) {
    const modal = getElement(id);
    if (modal) modal.classList.add("active");
}

function hideModal(id) {
    const modal = getElement(id);
    if (modal) modal.classList.remove("active");
}

function addActivity(message) {
    data.activities.unshift({
        message,
        date: getCurrentDateTime()
    });

    data.activities = data.activities.slice(0, 10);

    saveData();
    displayActivities();
}

function displayActivities() {
    const container = getElement("activity-list");

    if (!container) return;

    if (!data.activities.length) {
        container.innerHTML = `<p class="empty-state">No recent activities.</p>`;
        return;
    }

    container.innerHTML = data.activities.map(activity => `
        <div class="activity-item">
            <span>${escapeHTML(activity.message)}</span>
            <small>${displayDate(activity.date)}</small>
        </div>
    `).join("");
}

function confirmDelete(message) {
    return window.confirm(message || "Are you sure you want to delete this item?");
}

function getById(collection, id) {
    return collection.find(item => item.id === id);
}

/* ==========================================
   3. NAVIGATION
========================================== */

const pageMap = {
    "Dashboard": "dashboard-content",
    "Requirements": "requirements-content",
    "Test Scenarios": "scenarios-content",
    "Test Cases": "testcases-content",
    "Test Execution": "execution-content",
    "Bug Reports": "bugs-content",
    "Traceability Matrix": "traceability-content",
    "QA Reports": "placeholder-content"
};

function navigateTo(pageName) {
    const targetId = pageMap[pageName];

    if (!targetId) return;

    document.querySelectorAll(".page-content").forEach(section => {
        section.hidden = true;
    });

    const target = getElement(targetId);

    if (target) {
        target.hidden = false;
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    setText("page-title", pageName);
    setText("breadcrumb", `Home / ${pageName}`);

    if (pageName === "Dashboard") {
        displayDashboard();
    }

    if (pageName === "Requirements") {
        displayRequirements();
    }

    if (pageName === "Test Scenarios") {
        displayScenarios();
    }

    if (pageName === "Test Cases") {
        displayTestCases();
    }

    if (pageName === "Test Execution") {
        displayExecutions();
    }

    if (pageName === "Bug Reports") {
        displayBugs();
    }

    if (pageName === "Traceability Matrix") {
        displayTraceabilityMatrix();
    }

    if (pageName === "QA Reports") {
        setText("placeholder-title", "QA Reports");
    }
}

function initializeNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
}

/* ==========================================
   4. DASHBOARD
========================================== */

function displayDashboard() {
    const totalRequirements = data.requirements.length;
    const totalCases = data.testCases.length;

    const passed = data.executions.filter(
        item => item.status === "Passed"
    ).length;

    const failed = data.executions.filter(
        item => item.status === "Failed"
    ).length;

    const blocked = data.executions.filter(
        item => item.status === "Blocked"
    ).length;

    const notRun = data.executions.filter(
        item => item.status === "Not Run"
    ).length;

    const totalExecutions = data.executions.length;

    const percentage = totalExecutions
        ? Math.round((passed / totalExecutions) * 100)
        : 0;

    setText("requirements-count", totalRequirements);
    setText("testcases-count", totalCases);
    setText("passed-count", passed);
    setText("defects-count", data.defects.length);

    setText("progress-percentage", `${percentage}%`);
    setText("passed-detail", passed);
    setText("failed-detail", failed);
    setText("notrun-detail", notRun);

    const progressFill = getElement("progress-fill");

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    setText(
        "critical-count",
        data.defects.filter(bug => bug.severity === "Critical").length
    );

    setText(
        "high-count",
        data.defects.filter(bug => bug.severity === "High").length
    );

    setText(
        "medium-count",
        data.defects.filter(bug => bug.severity === "Medium").length
    );

    setText(
        "low-count",
        data.defects.filter(bug => bug.severity === "Low").length
    );

    displayActivities();
}

/* ==========================================
   5. REQUIREMENTS MODULE
========================================== */

function displayRequirements() {
    const search = (getElement("requirement-search")?.value || "").toLowerCase();
    const type = getElement("type-filter")?.value || "";
    const priority = getElement("priority-filter")?.value || "";
    const status = getElement("status-filter")?.value || "";

    setText("req-total", data.requirements.length);

    setText(
        "req-functional",
        data.requirements.filter(item => item.type === "Functional").length
    );

    setText(
        "req-nonfunctional",
        data.requirements.filter(item => item.type === "Non-Functional").length
    );

    setText(
        "req-pending",
        data.requirements.filter(item => item.status === "Pending").length
    );

    const filtered = data.requirements.filter(item => {
        return (
            `${item.id} ${item.title}`.toLowerCase().includes(search) &&
            (!type || item.type === type) &&
            (!priority || item.priority === priority) &&
            (!status || item.status === status)
        );
    });

    const tbody = getElement("requirements-table-body");

    if (!tbody) return;

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHTML(item.id)}</td>
            <td>${escapeHTML(item.title)}</td>
            <td>${escapeHTML(item.type)}</td>
            <td>${getPriorityBadge(item.priority)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="action-btn edit-btn" data-action="edit-requirement" data-id="${escapeHTML(item.id)}">Edit</button>
                <button class="action-btn delete-btn" data-action="delete-requirement" data-id="${escapeHTML(item.id)}">Delete</button>
            </td>
        </tr>
    `).join("");

    const empty = getElement("no-requirements");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }
}

function openRequirementModal(id = null) {
    const form = getElement("requirement-form");
    form.reset();

    setText("modal-title", id ? "Edit Requirement" : "Add Requirement");

    const requirement = id
        ? getById(data.requirements, id)
        : null;

    getElement("editing-requirement-id").value = requirement?.id || "";
    getElement("requirement-title").value = requirement?.title || "";
    getElement("requirement-description").value = requirement?.description || "";
    getElement("requirement-type").value = requirement?.type || "Functional";
    getElement("requirement-priority").value = requirement?.priority || "Medium";
    getElement("requirement-status").value = requirement?.status || "Pending";
    getElement("acceptance-criteria").value = requirement?.acceptanceCriteria || "";

    showModal("requirement-modal");
}

function saveRequirement(event) {
    event.preventDefault();

    const editingId = getElement("editing-requirement-id").value;

    const requirementData = {
        id: editingId || generateID("REQ", data.requirements),
        title: getElement("requirement-title").value.trim(),
        description: getElement("requirement-description").value.trim(),
        type: getElement("requirement-type").value,
        priority: getElement("requirement-priority").value,
        status: getElement("requirement-status").value,
        acceptanceCriteria: getElement("acceptance-criteria").value.trim(),
        updatedAt: getCurrentDateTime()
    };

    if (!requirementData.title) return;

    if (editingId) {
        const index = data.requirements.findIndex(item => item.id === editingId);

        if (index !== -1) {
            data.requirements[index] = {
                ...data.requirements[index],
                ...requirementData
            };
        }

        addActivity(`Updated requirement ${editingId}`);
    } else {
        requirementData.createdAt = getCurrentDateTime();
        data.requirements.push(requirementData);
        addActivity(`Created requirement ${requirementData.id}`);
    }

    saveData();
    hideModal("requirement-modal");
    displayRequirements();
    displayDashboard();
    refreshRelatedDropdowns();
}

function deleteRequirement(id) {
    if (!confirmDelete("Delete this requirement? Its linked scenarios will remain but become unlinked.")) {
        return;
    }

    data.requirements = data.requirements.filter(item => item.id !== id);

    saveData();
    addActivity(`Deleted requirement ${id}`);
    displayRequirements();
    displayDashboard();
    refreshRelatedDropdowns();
}

function initializeRequirements() {
    getElement("add-requirement-btn")?.addEventListener("click", () => {
        openRequirementModal();
    });

    getElement("requirement-form")?.addEventListener("submit", saveRequirement);

    getElement("close-modal")?.addEventListener("click", () => hideModal("requirement-modal"));
    getElement("cancel-requirement")?.addEventListener("click", () => hideModal("requirement-modal"));

    ["requirement-search", "type-filter", "priority-filter", "status-filter"].forEach(id => {
        getElement(id)?.addEventListener("input", displayRequirements);
        getElement(id)?.addEventListener("change", displayRequirements);
    });

    getElement("requirements-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;

        if (button.dataset.action === "edit-requirement") {
            openRequirementModal(id);
        }

        if (button.dataset.action === "delete-requirement") {
            deleteRequirement(id);
        }
    });
}

/* ==========================================
   6. TEST SCENARIOS MODULE
========================================== */

function displayScenarios() {
    const search = (getElement("scenario-search")?.value || "").toLowerCase();
    const type = getElement("scenario-type-filter")?.value || "";
    const priority = getElement("scenario-priority-filter")?.value || "";
    const status = getElement("scenario-status-filter")?.value || "";

    setText("scenario-total", data.scenarios.length);

    setText(
        "scenario-positive",
        data.scenarios.filter(item => item.type === "Positive").length
    );

    setText(
        "scenario-negative",
        data.scenarios.filter(item => item.type === "Negative").length
    );

    setText(
        "scenario-pending",
        data.scenarios.filter(item => item.status === "Pending").length
    );

    const filtered = data.scenarios.filter(item => {
        return (
            `${item.id} ${item.title}`.toLowerCase().includes(search) &&
            (!type || item.type === type) &&
            (!priority || item.priority === priority) &&
            (!status || item.status === status)
        );
    });

    const tbody = getElement("scenarios-table-body");
    if (!tbody) return;

    tbody.innerHTML = filtered.map(item => {
        const requirement = getById(data.requirements, item.requirementId);

        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(requirement?.id || "Not Linked")}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>${getPriorityBadge(item.priority)}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>
                    <button class="action-btn edit-btn" data-action="edit-scenario" data-id="${escapeHTML(item.id)}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-scenario" data-id="${escapeHTML(item.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    const empty = getElement("no-scenarios");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }
}

function populateRequirementDropdown() {
    const select = getElement("scenario-requirement");
    if (!select) return;

    const current = select.value;

    select.innerHTML = `
        <option value="">Select Requirement</option>
        ${data.requirements.map(item => `
            <option value="${escapeHTML(item.id)}">
                ${escapeHTML(item.id)} - ${escapeHTML(item.title)}
            </option>
        `).join("")}
    `;

    select.value = current;
}

function openScenarioModal(id = null) {
    getElement("scenario-form").reset();

    const scenario = id
        ? getById(data.scenarios, id)
        : null;

    populateRequirementDropdown();

    setText("scenario-modal-title", id ? "Edit Test Scenario" : "Add Test Scenario");

    getElement("editing-scenario-id").value = scenario?.id || "";
    getElement("scenario-title").value = scenario?.title || "";
    getElement("scenario-description").value = scenario?.description || "";
    getElement("scenario-requirement").value = scenario?.requirementId || "";
    getElement("scenario-preconditions").value = scenario?.preconditions || "";
    getElement("scenario-type").value = scenario?.type || "Positive";
    getElement("scenario-priority").value = scenario?.priority || "Medium";
    getElement("scenario-status").value = scenario?.status || "Pending";

    showModal("scenario-modal");
}

function saveScenario(event) {
    event.preventDefault();

    const editingId = getElement("editing-scenario-id").value;

    const scenarioData = {
        id: editingId || generateID("TS", data.scenarios),
        title: getElement("scenario-title").value.trim(),
        description: getElement("scenario-description").value.trim(),
        requirementId: getElement("scenario-requirement").value,
        preconditions: getElement("scenario-preconditions").value.trim(),
        type: getElement("scenario-type").value,
        priority: getElement("scenario-priority").value,
        status: getElement("scenario-status").value,
        updatedAt: getCurrentDateTime()
    };

    if (!scenarioData.title) return;

    if (editingId) {
        const index = data.scenarios.findIndex(item => item.id === editingId);

        if (index !== -1) {
            data.scenarios[index] = {
                ...data.scenarios[index],
                ...scenarioData
            };
        }

        addActivity(`Updated scenario ${editingId}`);
    } else {
        scenarioData.createdAt = getCurrentDateTime();
        data.scenarios.push(scenarioData);
        addActivity(`Created scenario ${scenarioData.id}`);
    }

    saveData();
    hideModal("scenario-modal");
    displayScenarios();
    refreshRelatedDropdowns();
}

function deleteScenario(id) {
    if (!confirmDelete("Delete this test scenario?")) return;

    data.scenarios = data.scenarios.filter(item => item.id !== id);

    saveData();
    addActivity(`Deleted scenario ${id}`);
    displayScenarios();
    refreshRelatedDropdowns();
}

function initializeScenarios() {
    getElement("add-scenario-btn")?.addEventListener("click", () => openScenarioModal());

    getElement("scenario-form")?.addEventListener("submit", saveScenario);

    getElement("close-scenario-modal")?.addEventListener("click", () => hideModal("scenario-modal"));
    getElement("cancel-scenario")?.addEventListener("click", () => hideModal("scenario-modal"));

    ["scenario-search", "scenario-type-filter", "scenario-priority-filter", "scenario-status-filter"].forEach(id => {
        getElement(id)?.addEventListener("input", displayScenarios);
        getElement(id)?.addEventListener("change", displayScenarios);
    });

    getElement("scenarios-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        if (button.dataset.action === "edit-scenario") {
            openScenarioModal(button.dataset.id);
        }

        if (button.dataset.action === "delete-scenario") {
            deleteScenario(button.dataset.id);
        }
    });
}

/* ==========================================
   7. TEST CASE MODULE
========================================== */

function populateScenarioDropdown() {
    const select = getElement("testcase-scenario");
    if (!select) return;

    const current = select.value;

    select.innerHTML = `
        <option value="">Select Scenario</option>
        ${data.scenarios.map(item => `
            <option value="${escapeHTML(item.id)}">
                ${escapeHTML(item.id)} - ${escapeHTML(item.title)}
            </option>
        `).join("")}
    `;

    select.value = current;
}

function displayTestCases() {
    const search = (getElement("testcase-search")?.value || "").toLowerCase();
    const priority = getElement("testcase-priority-filter")?.value || "";
    const status = getElement("testcase-status-filter")?.value || "";

    setText("testcase-total", data.testCases.length);

    ["Draft", "Ready", "Approved"].forEach(value => {
        const id = `testcase-${value.toLowerCase()}`;

        setText(
            id,
            data.testCases.filter(item => item.status === value).length
        );
    });

    const filtered = data.testCases.filter(item => {
        return (
            `${item.id} ${item.title}`.toLowerCase().includes(search) &&
            (!priority || item.priority === priority) &&
            (!status || item.status === status)
        );
    });

    const tbody = getElement("testcases-table-body");
    if (!tbody) return;

    tbody.innerHTML = filtered.map(item => {
        const scenario = getById(data.scenarios, item.scenarioId);

        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(scenario?.id || "Not Linked")}</td>
                <td>${getPriorityBadge(item.priority)}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>
                    <button class="action-btn edit-btn" data-action="edit-testcase" data-id="${escapeHTML(item.id)}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-testcase" data-id="${escapeHTML(item.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    const empty = getElement("no-testcases");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }
}

function openTestCaseModal(id = null) {
    getElement("testcase-form").reset();

    const testCase = id
        ? getById(data.testCases, id)
        : null;

    populateScenarioDropdown();

    setText("testcase-modal-title", id ? "Edit Test Case" : "Add Test Case");

    getElement("editing-testcase-id").value = testCase?.id || "";
    getElement("testcase-title").value = testCase?.title || "";
    getElement("testcase-description").value = testCase?.description || "";
    getElement("testcase-scenario").value = testCase?.scenarioId || "";
    getElement("testcase-preconditions").value = testCase?.preconditions || "";
    getElement("testcase-steps").value = testCase?.steps || "";
    getElement("testcase-expected").value = testCase?.expectedResult || "";
    getElement("testcase-priority").value = testCase?.priority || "Medium";
    getElement("testcase-status").value = testCase?.status || "Draft";

    showModal("testcase-modal");
}

function saveTestCase(event) {
    event.preventDefault();

    const editingId = getElement("editing-testcase-id").value;

    const testCaseData = {
        id: editingId || generateID("TC", data.testCases),
        title: getElement("testcase-title").value.trim(),
        description: getElement("testcase-description").value.trim(),
        scenarioId: getElement("testcase-scenario").value,
        preconditions: getElement("testcase-preconditions").value.trim(),
        steps: getElement("testcase-steps").value.trim(),
        expectedResult: getElement("testcase-expected").value.trim(),
        priority: getElement("testcase-priority").value,
        status: getElement("testcase-status").value,
        updatedAt: getCurrentDateTime()
    };

    if (!testCaseData.title) return;

    if (editingId) {
        const index = data.testCases.findIndex(item => item.id === editingId);

        if (index !== -1) {
            data.testCases[index] = {
                ...data.testCases[index],
                ...testCaseData
            };
        }

        addActivity(`Updated test case ${editingId}`);
    } else {
        testCaseData.createdAt = getCurrentDateTime();
        data.testCases.push(testCaseData);
        addActivity(`Created test case ${testCaseData.id}`);
    }

    saveData();
    hideModal("testcase-modal");
    displayTestCases();
    refreshRelatedDropdowns();
}

function deleteTestCase(id) {
    if (!confirmDelete("Delete this test case?")) return;

    data.testCases = data.testCases.filter(item => item.id !== id);

    saveData();
    addActivity(`Deleted test case ${id}`);
    displayTestCases();
    refreshRelatedDropdowns();
}

function initializeTestCases() {
    getElement("add-testcase-btn")?.addEventListener("click", () => openTestCaseModal());

    getElement("testcase-form")?.addEventListener("submit", saveTestCase);

    getElement("close-testcase-modal")?.addEventListener("click", () => hideModal("testcase-modal"));
    getElement("cancel-testcase")?.addEventListener("click", () => hideModal("testcase-modal"));

    ["testcase-search", "testcase-priority-filter", "testcase-status-filter"].forEach(id => {
        getElement(id)?.addEventListener("input", displayTestCases);
        getElement(id)?.addEventListener("change", displayTestCases);
    });

    getElement("testcases-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        if (button.dataset.action === "edit-testcase") {
            openTestCaseModal(button.dataset.id);
        }

        if (button.dataset.action === "delete-testcase") {
            deleteTestCase(button.dataset.id);
        }
    });
}

/* ==========================================
   8. TEST EXECUTION MODULE
========================================== */

function populateExecutionDropdown() {
    const select = getElement("execution-testcase");
    if (!select) return;

    const current = select.value;

    select.innerHTML = `
        <option value="">Select Test Case</option>
        ${data.testCases.map(item => `
            <option value="${escapeHTML(item.id)}">
                ${escapeHTML(item.id)} - ${escapeHTML(item.title)}
            </option>
        `).join("")}
    `;

    select.value = current;
}

function displayExecutions() {
    const search = (getElement("execution-search")?.value || "").toLowerCase();
    const status = getElement("execution-status-filter")?.value || "";

    setText("execution-total", data.executions.length);

    ["Passed", "Failed", "Blocked"].forEach(value => {
        setText(
            `execution-${value.toLowerCase()}`,
            data.executions.filter(item => item.status === value).length
        );
    });

    const filtered = data.executions.filter(item => {
        const testCase = getById(data.testCases, item.testCaseId);
        const text = `${item.id} ${testCase?.title || ""} ${item.actualResult || ""}`;

        return text.toLowerCase().includes(search) &&
            (!status || item.status === status);
    });

    const tbody = getElement("executions-table-body");
    if (!tbody) return;

    tbody.innerHTML = filtered.map(item => {
        const testCase = getById(data.testCases, item.testCaseId);

        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>
                <td>${escapeHTML(testCase?.title || "Deleted Test Case")}</td>
                <td>${escapeHTML(item.actualResult || "N/A")}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>${displayDate(item.executedAt)}</td>
                <td>
                    <button class="action-btn edit-btn" data-action="edit-execution" data-id="${escapeHTML(item.id)}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-execution" data-id="${escapeHTML(item.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    const empty = getElement("no-executions");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }
}

function updateExecutionTestCaseDetails() {
    const testCase = getById(
        data.testCases,
        getElement("execution-testcase").value
    );

    getElement("execution-steps").value = testCase?.steps || "";
    getElement("execution-expected").value = testCase?.expectedResult || "";
}

function openExecutionModal(id = null) {
    getElement("execution-form").reset();

    const execution = id
        ? getById(data.executions, id)
        : null;

    populateExecutionDropdown();

    setText("execution-modal-title", id ? "Edit Execution" : "Execute Test Case");

    getElement("editing-execution-id").value = execution?.id || "";
    getElement("execution-testcase").value = execution?.testCaseId || "";
    getElement("execution-actual").value = execution?.actualResult || "";
    getElement("execution-status").value = execution?.status || "Not Run";
    getElement("execution-comments").value = execution?.comments || "";

    updateExecutionTestCaseDetails();

    showModal("execution-modal");
}

function saveExecution(event) {
    event.preventDefault();

    const editingId = getElement("editing-execution-id").value;

    const executionData = {
        id: editingId || generateID("EXE", data.executions),
        testCaseId: getElement("execution-testcase").value,
        actualResult: getElement("execution-actual").value.trim(),
        status: getElement("execution-status").value,
        comments: getElement("execution-comments").value.trim(),
        executedAt: getCurrentDateTime()
    };

    if (!executionData.testCaseId) {
        alert("Please select a test case.");
        return;
    }

    if (!executionData.actualResult) {
        alert("Please enter the actual result.");
        return;
    }

    if (editingId) {
        const index = data.executions.findIndex(item => item.id === editingId);

        if (index !== -1) {
            data.executions[index] = {
                ...data.executions[index],
                ...executionData
            };
        }

        addActivity(`Updated execution ${editingId}`);
    } else {
        data.executions.push(executionData);
        addActivity(`Created execution ${executionData.id}`);
    }

    saveData();
    hideModal("execution-modal");
    displayExecutions();
    displayDashboard();
    refreshRelatedDropdowns();
}

function deleteExecution(id) {
    if (!confirmDelete("Delete this test execution?")) return;

    data.executions = data.executions.filter(item => item.id !== id);

    saveData();
    addActivity(`Deleted execution ${id}`);
    displayExecutions();
    displayDashboard();
    refreshRelatedDropdowns();
}

function initializeExecution() {
    getElement("add-execution-btn")?.addEventListener("click", () => {
        openExecutionModal();
    });

    getElement("execution-form")?.addEventListener("submit", saveExecution);

    getElement("execution-testcase")?.addEventListener("change", updateExecutionTestCaseDetails);

    getElement("close-execution-modal")?.addEventListener("click", () => hideModal("execution-modal"));
    getElement("cancel-execution")?.addEventListener("click", () => hideModal("execution-modal"));

    ["execution-search", "execution-status-filter"].forEach(id => {
        getElement(id)?.addEventListener("input", displayExecutions);
        getElement(id)?.addEventListener("change", displayExecutions);
    });

    getElement("executions-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        if (button.dataset.action === "edit-execution") {
            openExecutionModal(button.dataset.id);
        }

        if (button.dataset.action === "delete-execution") {
            deleteExecution(button.dataset.id);
        }
    });
}

/* ==========================================
   9. BUG REPORT MODULE
========================================== */

function populateBugExecutionDropdown() {
    const select = getElement("bug-execution");
    if (!select) return;

    const current = select.value;

    select.innerHTML = `
        <option value="">No Linked Execution</option>
        ${data.executions.map(item => {
            const testCase = getById(data.testCases, item.testCaseId);

            return `
                <option value="${escapeHTML(item.id)}">
                    ${escapeHTML(item.id)} - ${escapeHTML(testCase?.title || "Test Case")}
                </option>
            `;
        }).join("")}
    `;

    select.value = current;
}

function displayBugs() {
    const search = (getElement("bug-search")?.value || "").toLowerCase();
    const severity = getElement("bug-severity-filter")?.value || "";
    const priority = getElement("bug-priority-filter")?.value || "";
    const status = getElement("bug-status-filter")?.value || "";

    setText("bug-total", data.defects.length);

    setText(
        "bug-open",
        data.defects.filter(item => item.status === "Open").length
    );

    setText(
        "bug-progress",
        data.defects.filter(item => item.status === "In Progress").length
    );

    setText(
        "bug-fixed",
        data.defects.filter(item => item.status === "Fixed").length
    );

    const filtered = data.defects.filter(item => {
        return (
            `${item.id} ${item.title}`.toLowerCase().includes(search) &&
            (!severity || item.severity === severity) &&
            (!priority || item.priority === priority) &&
            (!status || item.status === status)
        );
    });

    const tbody = getElement("bugs-table-body");
    if (!tbody) return;

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>${escapeHTML(item.id)}</td>
            <td>${escapeHTML(item.title)}</td>
            <td>${getPriorityBadge(item.severity)}</td>
            <td>${getPriorityBadge(item.priority)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>${escapeHTML(item.executionId || "Not Linked")}</td>
            <td>${displayDate(item.createdAt)}</td>
            <td>
                <button class="action-btn view-btn" data-action="view-bug" data-id="${escapeHTML(item.id)}">View</button>
                <button class="action-btn edit-btn" data-action="edit-bug" data-id="${escapeHTML(item.id)}">Edit</button>
                <button class="action-btn delete-btn" data-action="delete-bug" data-id="${escapeHTML(item.id)}">Delete</button>
            </td>
        </tr>
    `).join("");

    const empty = getElement("no-bugs");

    if (empty) {
        empty.style.display = filtered.length ? "none" : "block";
    }
}

function openBugModal(id = null) {
    getElement("bug-form").reset();

    const bug = id
        ? getById(data.defects, id)
        : null;

    populateBugExecutionDropdown();

    setText("bug-modal-title", id ? "Edit Bug Report" : "Report New Bug");

    getElement("editing-bug-id").value = bug?.id || "";
    getElement("bug-title").value = bug?.title || "";
    getElement("bug-description").value = bug?.description || "";
    getElement("bug-steps").value = bug?.steps || "";
    getElement("bug-expected").value = bug?.expectedResult || "";
    getElement("bug-actual").value = bug?.actualResult || "";
    getElement("bug-execution").value = bug?.executionId || "";
    getElement("bug-severity").value = bug?.severity || "Medium";
    getElement("bug-priority").value = bug?.priority || "Medium";
    getElement("bug-status").value = bug?.status || "Open";

    showModal("bug-modal");
}

function saveBug(event) {
    event.preventDefault();

    const editingId = getElement("editing-bug-id").value;

    const existingBug = editingId
        ? getById(data.defects, editingId)
        : null;

    const bugData = {
        id: editingId || generateID("BUG", data.defects),
        title: getElement("bug-title").value.trim(),
        description: getElement("bug-description").value.trim(),
        steps: getElement("bug-steps").value.trim(),
        expectedResult: getElement("bug-expected").value.trim(),
        actualResult: getElement("bug-actual").value.trim(),
        executionId: getElement("bug-execution").value,
        severity: getElement("bug-severity").value,
        priority: getElement("bug-priority").value,
        status: getElement("bug-status").value,
        createdAt: existingBug?.createdAt || getCurrentDateTime(),
        updatedAt: getCurrentDateTime(),
        history: existingBug?.history || []
    };

    if (!bugData.title || !bugData.description) {
        alert("Please complete the required fields.");
        return;
    }

    if (existingBug && existingBug.status !== bugData.status) {
        bugData.history.push({
            status: bugData.status,
            date: getCurrentDateTime()
        });
    }

    if (!existingBug) {
        bugData.history.push({
            status: bugData.status,
            date: getCurrentDateTime()
        });

        data.defects.push(bugData);
        addActivity(`Reported bug ${bugData.id}`);
    } else {
        const index = data.defects.findIndex(item => item.id === editingId);

        if (index !== -1) {
            data.defects[index] = {
                ...existingBug,
                ...bugData
            };
        }

        addActivity(`Updated bug ${editingId}`);
    }

    saveData();
    hideModal("bug-modal");
    displayBugs();
    displayDashboard();
}

function deleteBug(id) {
    if (!confirmDelete("Are you sure you want to delete this bug report?")) return;

    data.defects = data.defects.filter(item => item.id !== id);

    saveData();
    addActivity(`Deleted bug ${id}`);
    displayBugs();
    displayDashboard();
}

function viewBug(id) {
    const bug = getById(data.defects, id);
    if (!bug) return;

    setText("details-bug-title", bug.title);
    setText("details-bug-id", bug.id);
    setText("details-description", bug.description || "N/A");
    setText("details-steps", bug.steps || "N/A");
    setText("details-expected", bug.expectedResult || "N/A");
    setText("details-actual", bug.actualResult || "N/A");
    setText("details-execution", bug.executionId || "Not Linked");
    setText("details-date", displayDate(bug.createdAt));

    const badges = getElement("details-badges");

    if (badges) {
        badges.innerHTML = `
            ${getPriorityBadge(bug.severity)}
            ${getPriorityBadge(bug.priority)}
            ${getStatusBadge(bug.status)}
        `;
    }

    const history = getElement("bug-history-list");

    if (history) {
        history.innerHTML = (bug.history || []).map(item => `
            <div class="history-item">
                <strong>${escapeHTML(item.status)}</strong>
                <small>${displayDate(item.date)}</small>
            </div>
        `).join("") || `<p class="muted-text">No status history available.</p>`;
    }

    getElement("details-edit-btn").dataset.id = id;

    showModal("bug-details-modal");
}

function initializeBugs() {
    getElement("add-bug-btn")?.addEventListener("click", () => openBugModal());

    getElement("bug-form")?.addEventListener("submit", saveBug);

    getElement("close-bug-modal")?.addEventListener("click", () => hideModal("bug-modal"));
    getElement("cancel-bug")?.addEventListener("click", () => hideModal("bug-modal"));

    getElement("close-bug-details")?.addEventListener("click", () => hideModal("bug-details-modal"));
    getElement("details-close-btn")?.addEventListener("click", () => hideModal("bug-details-modal"));

    getElement("details-edit-btn")?.addEventListener("click", event => {
        const id = event.currentTarget.dataset.id;

        hideModal("bug-details-modal");
        openBugModal(id);
    });

    ["bug-search", "bug-severity-filter", "bug-priority-filter", "bug-status-filter"].forEach(id => {
        getElement(id)?.addEventListener("input", displayBugs);
        getElement(id)?.addEventListener("change", displayBugs);
    });

    getElement("bugs-table-body")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;

        if (button.dataset.action === "view-bug") {
            viewBug(id);
        }

        if (button.dataset.action === "edit-bug") {
            openBugModal(id);
        }

        if (button.dataset.action === "delete-bug") {
            deleteBug(id);
        }
    });
}

/* ==========================================
   10. TRACEABILITY MATRIX
========================================== */

/*
   Relationship structure:

   Requirement
       |
       v
   Test Scenario
       |
       v
   Test Case
       |
       v
   Test Execution
       |
       v
   Bug Report
*/

function getTraceabilityRows() {
    return data.requirements.map(requirement => {

        const scenarios = data.scenarios.filter(
            scenario => scenario.requirementId === requirement.id
        );

        const testCases = data.testCases.filter(testCase =>
            scenarios.some(scenario => scenario.id === testCase.scenarioId)
        );

        const executions = data.executions.filter(execution =>
            testCases.some(testCase => testCase.id === execution.testCaseId)
        );

        const bugs = data.defects.filter(bug =>
            executions.some(execution => execution.id === bug.executionId)
        );

        const covered = testCases.length > 0;
        const tested = executions.length > 0;

        return {
            requirement,
            scenarios,
            testCases,
            executions,
            bugs,
            covered,
            tested
        };
    });
}

function renderTraceItems(items, idField, titleField) {
    if (!items.length) {
        return `<span class="trace-empty">Not linked</span>`;
    }

    return `
        <div class="trace-cell-list">
            ${items.map(item => `
                <div class="trace-item">
                    <strong>${escapeHTML(item[idField])}</strong>
                    <small>${escapeHTML(item[titleField] || item.name || "")}</small>
                </div>
            `).join("")}
        </div>
    `;
}

function renderTraceExecutions(executions) {
    if (!executions.length) {
        return `<span class="trace-empty">Not executed</span>`;
    }

    return `
        <div class="trace-cell-list">
            ${executions.map(execution => `
                <div class="trace-item">
                    <strong>${escapeHTML(execution.id)}</strong>
                    <span class="trace-result">${escapeHTML(execution.status || "Not Run")}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderTraceBugs(bugs) {
    if (!bugs.length) {
        return `<span class="trace-empty">No bugs reported</span>`;
    }

    return `
        <div class="trace-cell-list">
            ${bugs.map(bug => `
                <div class="trace-bug">
                    <strong>${escapeHTML(bug.id)}</strong>
                    <small>${escapeHTML(bug.title)}</small>
                    <small>${escapeHTML(bug.status || "Open")}</small>
                </div>
            `).join("")}
        </div>
    `;
}

function displayTraceabilityMatrix() {
    const rows = getTraceabilityRows();

    const totalRequirements = rows.length;
    const coveredRequirements = rows.filter(row => row.covered).length;
    const testedRequirements = rows.filter(row => row.tested).length;

    const coverage = totalRequirements
        ? Math.round((coveredRequirements / totalRequirements) * 100)
        : 0;

    setText("trace-total-requirements", totalRequirements);
    setText("trace-covered-requirements", coveredRequirements);
    setText("trace-tested-requirements", testedRequirements);
    setText("trace-coverage-percentage", `${coverage}%`);

    setText(
        "trace-coverage-label",
        `${coveredRequirements} of ${totalRequirements} requirements covered`
    );

    const progress = getElement("trace-coverage-fill");

    if (progress) {
        progress.style.width = `${coverage}%`;
    }

    const search = (getElement("trace-search")?.value || "").toLowerCase();
    const coverageFilter = getElement("trace-coverage-filter")?.value || "";
    const executionFilter = getElement("trace-execution-filter")?.value || "";

    const filteredRows = rows.filter(row => {

        const requirementText = `${row.requirement.id} ${row.requirement.title}`.toLowerCase();

        const matchesSearch = requirementText.includes(search);

        const matchesCoverage =
            !coverageFilter ||
            (coverageFilter === "covered" && row.covered) ||
            (coverageFilter === "not-covered" && !row.covered);

        const matchesExecution = !executionFilter ||
            (executionFilter === "Not Executed" && row.executions.length === 0) ||
            row.executions.some(execution => execution.status === executionFilter);

        return matchesSearch && matchesCoverage && matchesExecution;
    });

    const tbody = getElement("traceability-table-body");

    if (!tbody) return;

    tbody.innerHTML = filteredRows.map(row => `
        <tr>
            <td>
                <div class="trace-requirement-cell">
                    <strong>${escapeHTML(row.requirement.id)}</strong>
                    <span>${escapeHTML(row.requirement.title)}</span>
                    <small>${escapeHTML(row.requirement.type || "")} · ${escapeHTML(row.requirement.priority || "")}</small>
                </div>
            </td>

            <td>
                ${renderTraceItems(row.scenarios, "id", "title")}
            </td>

            <td>
                ${renderTraceItems(row.testCases, "id", "title")}
            </td>

            <td>
                ${renderTraceExecutions(row.executions)}
            </td>

            <td>
                ${renderTraceBugs(row.bugs)}
            </td>

            <td>
                ${row.covered
                    ? `<span class="trace-coverage-badge covered">Covered</span>`
                    : `<span class="trace-coverage-badge not-covered">Not Covered</span>`
                }
                ${row.tested
                    ? `<span class="trace-coverage-badge covered">Tested</span>`
                    : `<span class="trace-coverage-badge not-covered">Not Tested</span>`
                }
            </td>
        </tr>
    `).join("");

    const empty = getElement("no-traceability");

    if (empty) {
        empty.hidden = filteredRows.length > 0;
    }
}

function initializeTraceability() {
    getElement("trace-search")?.addEventListener(
        "input",
        displayTraceabilityMatrix
    );

    getElement("trace-coverage-filter")?.addEventListener(
        "change",
        displayTraceabilityMatrix
    );

    getElement("trace-execution-filter")?.addEventListener(
        "change",
        displayTraceabilityMatrix
    );

    getElement("refresh-traceability-btn")?.addEventListener("click", () => {
        displayTraceabilityMatrix();
    });

    displayTraceabilityMatrix();
}

/* ==========================================
   11. REFRESH RELATED DROPDOWNS
========================================== */

function refreshRelatedDropdowns() {
    populateRequirementDropdown();
    populateScenarioDropdown();
    populateExecutionDropdown();
    populateBugExecutionDropdown();
}

/* ==========================================
   12. CURRENT DATE
========================================== */

function displayCurrentDate() {
    const element = getElement("current-date");

    if (element) {
        element.textContent = new Date().toLocaleDateString(
            undefined,
            {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }
}

/* ==========================================
   13. CLOSE MODALS
========================================== */

function initializeModalClosing() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.classList.remove("active");
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach(modal => {
                modal.classList.remove("active");
            });
        }
    });
}

/* ==========================================
   14. APPLICATION INITIALIZATION
========================================== */

function initializeApplication() {
    loadData();

    displayCurrentDate();

    initializeNavigation();
    initializeRequirements();
    initializeScenarios();
    initializeTestCases();
    initializeExecution();
    initializeBugs();
    initializeTraceability();
    initializeModalClosing();

    refreshRelatedDropdowns();

    displayDashboard();
    displayRequirements();
    displayScenarios();
    displayTestCases();
    displayExecutions();
    displayBugs();
    displayTraceabilityMatrix();

    navigateTo("Dashboard");

    console.log("Q-Track initialized successfully.");
}

document.addEventListener("DOMContentLoaded", initializeApplication);
