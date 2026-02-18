const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;

window.db = { accounts: [], departments: [], employees: [], requests: [] };

/* ========================= STORAGE ========================= */

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data) throw "No data";
        // Ensure arrays exist
        window.db = {
            accounts: data.accounts || [],
            departments: data.departments || [],
            employees: data.employees || [],
            requests: data.requests || []
        };
    } catch {
        window.db = {
            accounts: [
                { firstName: "Admin", lastName: "User", email: "admin@example.com", password: "Password123!", role: "admin", verified: true }
            ],
            departments: [
                { id: 1, name: "Engineering", description: "Software team" },
                { id: 2, name: "HR", description: "Human Resources" }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* ========================= TOAST ========================= */

function showToast(message, type = "success") {
    const color = type === "success" ? "bg-success" : type === "danger" ? "bg-danger" : "bg-warning text-dark";
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white ${color} border-0 show mb-2`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button></div>`;
    document.getElementById("toastContainer").appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

/* ========================= ROUTING ========================= */

function navigateTo(hash) {
    window.location.hash = hash;
}

const protectedRoutes = ["#/profile", "#/my-requests"];
const adminRoutes = ["#/employees", "#/accounts", "#/departments"];

function handleRouting() {
    const hash = window.location.hash || "#/";

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    if (protectedRoutes.includes(hash) && !currentUser) {
        navigateTo("#/login");
        return;
    }

    if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== "admin")) {
        navigateTo("#/");
        showToast("Access denied.", "danger");
        return;
    }

    const routes = {
        "#/": () => showPage("home-page"),
        "#/register": () => showPage("register-page"),
        "#/login": () => showPage("login-page"),
        "#/verify-email": () => {
            showPage("verify-email-page");
            const email = localStorage.getItem("unverified_email") || "";
            document.getElementById("verifyMessage").textContent = `A verification link has been sent to ${email}`;
        },
        "#/profile": () => { showPage("profile-page"); renderProfile(); },
        "#/employees": () => { showPage("employees-page"); renderEmployeesTable(); },
        "#/accounts": () => { showPage("accounts-page"); renderAccountsList(); },
        "#/departments": () => { showPage("departments-page"); renderDeptsList(); },
        "#/my-requests": () => { showPage("my-requests-page"); renderMyRequests(); }
    };

    const handler = routes[hash] || routes["#/"];
    handler();
}

function showPage(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
}

window.addEventListener("hashchange", handleRouting);

/* ========================= AUTH STATE ========================= */

function setAuthState(isAuth, user = null) {
    const body = document.body;
    if (isAuth && user) {
        currentUser = user;
        body.classList.remove("not-authenticated");
        body.classList.add("authenticated");
        if (user.role === "admin") body.classList.add("is-admin");
        else body.classList.remove("is-admin");
        document.getElementById("nav-username").textContent = user.firstName + " " + user.lastName;
    } else {
        currentUser = null;
        body.classList.remove("authenticated", "is-admin");
        body.classList.add("not-authenticated");
        document.getElementById("nav-username").textContent = "User";
    }
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    showToast("Logged out successfully.");
    navigateTo("#/");
}

/* ========================= REGISTRATION ========================= */

document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const first = document.getElementById("regFirst").value.trim();
    const last = document.getElementById("regLast").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const errEl = document.getElementById("registerError");
    errEl.textContent = "";

    if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
    if (window.db.accounts.find(a => a.email === email)) { errEl.textContent = "Email already exists."; return; }

    window.db.accounts.push({ firstName: first, lastName: last, email, password, role: "user", verified: false });
    saveToStorage();
    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});

/* ========================= VERIFY EMAIL ========================= */

function simulateVerify() {
    const email = localStorage.getItem("unverified_email");
    const user = window.db.accounts.find(a => a.email === email);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem("unverified_email");
        showToast("✅ Email verified! You may now log in.");
        // Show success on login page
        navigateTo("#/login");
        setTimeout(() => {
            const s = document.getElementById("loginSuccess");
            s.textContent = "✅ Email verified! You may now log in.";
            s.classList.remove("d-none");
        }, 100);
    }
}

/* ========================= LOGIN ========================= */

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    errEl.textContent = "";

    const user = window.db.accounts.find(a => a.email === email && a.password === password && a.verified === true);
    if (!user) { errEl.textContent = "Invalid credentials or email not verified."; return; }

    localStorage.setItem("auth_token", email);
    setAuthState(true, user);
    showToast("Welcome back, " + user.firstName + "!");
    navigateTo("#/profile");
});

/* ========================= PROFILE ========================= */

function renderProfile() {
    if (!currentUser) return;
    document.getElementById("profileInfo").innerHTML = `
        <div class="card p-4 shadow-sm">
            <h5>${currentUser.firstName} ${currentUser.lastName}</h5>
            <p class="mb-1"><strong>Email:</strong> ${currentUser.email}</p>
            <p class="mb-3"><strong>Role:</strong> ${capitalize(currentUser.role)}</p>
            <button class="btn btn-outline-primary btn-sm" onclick="openEditProfile()">Edit Profile</button>
        </div>
    `;
}

function openEditProfile() {
    document.getElementById("editFirst").value = currentUser.firstName;
    document.getElementById("editLast").value = currentUser.lastName;
    document.getElementById("editEmail").value = currentUser.email;
    document.getElementById("editProfileError").textContent = "";
    new bootstrap.Modal(document.getElementById("editProfileModal")).show();
}

function saveProfile() {
    const first = document.getElementById("editFirst").value.trim();
    const last = document.getElementById("editLast").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const errEl = document.getElementById("editProfileError");
    errEl.textContent = "";

    if (!first || !last || !email) { errEl.textContent = "All fields are required."; return; }

    const emailTaken = window.db.accounts.find(a => a.email === email && a.email !== currentUser.email);
    if (emailTaken) { errEl.textContent = "That email is already in use."; return; }

    const acc = window.db.accounts.find(a => a.email === currentUser.email);
    if (acc) {
        if (acc.email !== email) localStorage.setItem("auth_token", email);
        acc.firstName = first;
        acc.lastName = last;
        acc.email = email;
        saveToStorage();
        currentUser = acc;
        document.getElementById("nav-username").textContent = acc.firstName + " " + acc.lastName;
    }

    bootstrap.Modal.getInstance(document.getElementById("editProfileModal")).hide();
    showToast("Profile updated successfully!");
    renderProfile();
}

/* ========================= EMPLOYEES ========================= */

function renderEmployeesTable() {
    const tbody = document.getElementById("employeesTableBody");
    if (!window.db.employees || window.db.employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No employees.</td></tr>`;
        return;
    }
    tbody.innerHTML = window.db.employees.map((emp, i) => {
        const dept = window.db.departments.find(d => d.id == emp.deptId);
        const user = window.db.accounts.find(a => a.email === emp.userEmail);
        const name = user ? `${user.firstName} ${user.lastName}` : emp.userEmail;
        return `<tr>
            <td>${emp.empId}</td>
            <td>${name}</td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : "—"}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="editEmployee(${i})">Edit</button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteEmployee(${i})">Delete</button>
            </td>
        </tr>`;
    }).join("");
}

function showEmployeeForm(i = null) {
    document.getElementById("employeeForm").classList.remove("d-none");
    document.getElementById("empError").textContent = "";
    // Populate dept dropdown
    const deptSel = document.getElementById("empDept");
    deptSel.innerHTML = window.db.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join("");

    if (i !== null) {
        const emp = window.db.employees[i];
        document.getElementById("empEditIndex").value = i;
        document.getElementById("empId").value = emp.empId;
        document.getElementById("empEmail").value = emp.userEmail;
        document.getElementById("empPosition").value = emp.position;
        document.getElementById("empDept").value = emp.deptId;
        document.getElementById("empHireDate").value = emp.hireDate;
        document.getElementById("employeeFormTitle").textContent = "Edit Employee";
    } else {
        document.getElementById("empEditIndex").value = "";
        document.getElementById("empId").value = "";
        document.getElementById("empEmail").value = "";
        document.getElementById("empPosition").value = "";
        document.getElementById("empHireDate").value = "";
        document.getElementById("employeeFormTitle").textContent = "Add Employee";
    }
}

function hideEmployeeForm() {
    document.getElementById("employeeForm").classList.add("d-none");
}

function saveEmployee() {
    const idx = document.getElementById("empEditIndex").value;
    const empId = document.getElementById("empId").value.trim();
    const userEmail = document.getElementById("empEmail").value.trim();
    const position = document.getElementById("empPosition").value.trim();
    const deptId = document.getElementById("empDept").value;
    const hireDate = document.getElementById("empHireDate").value;
    const errEl = document.getElementById("empError");
    errEl.textContent = "";

    if (!empId || !userEmail || !position) { errEl.textContent = "All fields are required."; return; }
    if (!window.db.accounts.find(a => a.email === userEmail)) { errEl.textContent = "No account found with that email."; return; }

    const data = { empId, userEmail, position, deptId, hireDate };
    if (idx !== "") window.db.employees[parseInt(idx)] = data;
    else window.db.employees.push(data);

    saveToStorage();
    hideEmployeeForm();
    renderEmployeesTable();
    showToast("Employee saved!");
}

function editEmployee(i) { showEmployeeForm(i); }

function deleteEmployee(i) {
    if (!confirm("Delete this employee?")) return;
    window.db.employees.splice(i, 1);
    saveToStorage();
    renderEmployeesTable();
    showToast("Employee deleted.", "danger");
}

/* ========================= DEPARTMENTS ========================= */

function renderDeptsList() {
    const tbody = document.getElementById("deptsTableBody");
    if (!window.db.departments || window.db.departments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No departments.</td></tr>`;
        return;
    }
    tbody.innerHTML = window.db.departments.map((d, i) => `
        <tr>
            <td>${d.name}</td>
            <td>${d.description}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="editDept(${i})">Edit</button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteDept(${i})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showDeptForm(i = null) {
    document.getElementById("deptForm").classList.remove("d-none");
    if (i !== null) {
        const d = window.db.departments[i];
        document.getElementById("deptEditIndex").value = i;
        document.getElementById("deptName").value = d.name;
        document.getElementById("deptDesc").value = d.description;
    } else {
        document.getElementById("deptEditIndex").value = "";
        document.getElementById("deptName").value = "";
        document.getElementById("deptDesc").value = "";
    }
}

function hideDeptForm() { document.getElementById("deptForm").classList.add("d-none"); }

function saveDept() {
    const idx = document.getElementById("deptEditIndex").value;
    const name = document.getElementById("deptName").value.trim();
    const desc = document.getElementById("deptDesc").value.trim();
    if (!name) { showToast("Department name is required.", "danger"); return; }

    if (idx !== "") {
        window.db.departments[parseInt(idx)].name = name;
        window.db.departments[parseInt(idx)].description = desc;
    } else {
        const newId = window.db.departments.length ? Math.max(...window.db.departments.map(d => d.id)) + 1 : 1;
        window.db.departments.push({ id: newId, name, description: desc });
    }
    saveToStorage();
    hideDeptForm();
    renderDeptsList();
    showToast("Department saved!");
}

function editDept(i) { showDeptForm(i); }

function deleteDept(i) {
    if (!confirm("Delete this department?")) return;
    window.db.departments.splice(i, 1);
    saveToStorage();
    renderDeptsList();
    showToast("Department deleted.", "danger");
}

/* ========================= ACCOUNTS ========================= */

function renderAccountsList() {
    const tbody = document.getElementById("accountsTableBody");
    if (!window.db.accounts || window.db.accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No accounts.</td></tr>`;
        return;
    }
    tbody.innerHTML = window.db.accounts.map((acc, i) => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${capitalize(acc.role)}</td>
            <td>${acc.verified ? "✅" : "—"}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="editAccount(${i})">Edit</button>
                <button class="btn btn-outline-warning btn-sm me-1" onclick="resetPassword(${i})">Reset Password</button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteAccount(${i})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showAccountForm(i = null) {
    document.getElementById("accountForm").classList.remove("d-none");
    document.getElementById("accError").textContent = "";
    if (i !== null) {
        const acc = window.db.accounts[i];
        document.getElementById("accEditEmail").value = acc.email;
        document.getElementById("accFirst").value = acc.firstName;
        document.getElementById("accLast").value = acc.lastName;
        document.getElementById("accEmail").value = acc.email;
        document.getElementById("accPassword").value = "";
        document.getElementById("accRole").value = acc.role;
        document.getElementById("accVerified").checked = acc.verified;
    } else {
        document.getElementById("accEditEmail").value = "";
        document.getElementById("accFirst").value = "";
        document.getElementById("accLast").value = "";
        document.getElementById("accEmail").value = "";
        document.getElementById("accPassword").value = "";
        document.getElementById("accRole").value = "user";
        document.getElementById("accVerified").checked = false;
    }
}

function hideAccountForm() { document.getElementById("accountForm").classList.add("d-none"); }

function saveAccount() {
    const oldEmail = document.getElementById("accEditEmail").value;
    const first = document.getElementById("accFirst").value.trim();
    const last = document.getElementById("accLast").value.trim();
    const email = document.getElementById("accEmail").value.trim();
    const password = document.getElementById("accPassword").value;
    const role = document.getElementById("accRole").value;
    const verified = document.getElementById("accVerified").checked;
    const errEl = document.getElementById("accError");
    errEl.textContent = "";

    if (!first || !last || !email) { errEl.textContent = "Name and email are required."; return; }

    if (oldEmail) {
        const acc = window.db.accounts.find(a => a.email === oldEmail);
        if (acc) {
            acc.firstName = first; acc.lastName = last; acc.email = email;
            if (password) acc.password = password;
            acc.role = role; acc.verified = verified;
        }
    } else {
        if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
        if (window.db.accounts.find(a => a.email === email)) { errEl.textContent = "Email already exists."; return; }
        window.db.accounts.push({ firstName: first, lastName: last, email, password, role, verified });
    }

    saveToStorage();
    hideAccountForm();
    renderAccountsList();
    showToast("Account saved!");
}

function editAccount(i) { showAccountForm(i); }

function resetPassword(i) {
    const newPw = prompt("Enter new password (min 6 chars):");
    if (!newPw) return;
    if (newPw.length < 6) { showToast("Password too short.", "danger"); return; }
    window.db.accounts[i].password = newPw;
    saveToStorage();
    showToast("Password reset!");
}

function deleteAccount(i) {
    if (window.db.accounts[i].email === currentUser?.email) { showToast("Cannot delete your own account.", "danger"); return; }
    if (!confirm("Delete this account?")) return;
    window.db.accounts.splice(i, 1);
    saveToStorage();
    renderAccountsList();
    showToast("Account deleted.", "danger");
}

/* ========================= REQUESTS ========================= */

function renderMyRequests() {
    if (!currentUser) return;
    const myReqs = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    const el = document.getElementById("requestsContent");

    if (myReqs.length === 0) {
        el.innerHTML = `<p class="text-muted">You have no requests yet.</p><button class="btn btn-success btn-sm" onclick="openRequestModal()">Create One</button>`;
        return;
    }

    const badgeMap = { Pending: "warning", Approved: "success", Rejected: "danger" };
    el.innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover">
                <thead class="table-dark"><tr><th>Date</th><th>Type</th><th>Items</th><th>Status</th></tr></thead>
                <tbody>
                    ${myReqs.map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${r.type}</td>
                            <td>${r.items.map(it => `${it.name} (x${it.qty})`).join(", ")}</td>
                            <td><span class="badge bg-${badgeMap[r.status] || 'secondary'}">${r.status}</span></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function openRequestModal() {
    document.getElementById("reqError").textContent = "";
    document.getElementById("reqItems").innerHTML = "";
    addRequestItem();
    const modal = new bootstrap.Modal(document.getElementById("requestModal"));
    modal.show();
}

function addRequestItem() {
    const container = document.getElementById("reqItems");
    const div = document.createElement("div");
    div.className = "d-flex gap-2 mb-2 align-items-center req-item";
    div.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name">
        <input type="number" class="form-control item-qty" value="1" min="1" style="width:80px">
        <button class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function submitRequest() {
    const type = document.getElementById("reqType").value;
    const itemEls = document.querySelectorAll(".req-item");
    const errEl = document.getElementById("reqError");
    errEl.textContent = "";

    if (itemEls.length === 0) { errEl.textContent = "Add at least one item."; return; }

    const items = [];
    let valid = true;
    itemEls.forEach(el => {
        const name = el.querySelector(".item-name").value.trim();
        const qty = el.querySelector(".item-qty").value;
        if (!name) { valid = false; return; }
        items.push({ name, qty: parseInt(qty) || 1 });
    });

    if (!valid || items.length === 0) { errEl.textContent = "All items must have a name."; return; }

    window.db.requests.push({
        type, items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    });
    saveToStorage();

    bootstrap.Modal.getInstance(document.getElementById("requestModal")).hide();
    showToast("Request submitted!");
    renderMyRequests();
}

/* ========================= HELPERS ========================= */

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/* ========================= INIT ========================= */

loadFromStorage();

// Restore session
const token = localStorage.getItem("auth_token");
if (token) {
    const user = window.db.accounts.find(a => a.email === token);
    if (user) setAuthState(true, user);
}

if (!window.location.hash) navigateTo("#/");
handleRouting();