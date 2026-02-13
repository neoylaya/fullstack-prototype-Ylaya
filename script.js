const STORAGE_KEY = "ipt_demo_v1";
let currentUser = null;

window.db = {
    accounts: [],
    departments: []
};

/* =========================
   STORAGE
========================= */

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!data) throw "No data";

        window.db = data;

    } catch {
        // Seed default data
        window.db = {
            accounts: [
                {
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    password: "Password123!",
                    role: "admin",
                    verified: true
                }
            ],
            departments: [
                { id: 1, name: "Engineering", description: "Tech Department" },
                { id: 2, name: "HR", description: "Human Resources" }
            ]
        };

        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

/* =========================
   ROUTING
========================= */

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || "#/";

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    // Protect profile
    if (!currentUser && hash.startsWith("#/profile")) {
        navigateTo("#/login");
        return;
    }

    // Admin protection
    if (hash.startsWith("#/employees") && (!currentUser || currentUser.role !== "admin")) {
        navigateTo("#/");
        return;
    }

    if (hash === "#/register") showPage("register-page");
    else if (hash === "#/login") showPage("login-page");
    else if (hash === "#/verify-email") showPage("verify-email-page");
    else if (hash === "#/profile") {
        showPage("profile-page");
        renderProfile();
    }
    else showPage("home-page");
}

function showPage(id) {
    document.getElementById(id).classList.add("active");
}

window.addEventListener("hashchange", handleRouting);

/* =========================
   AUTH STATE
========================= */

function setAuthState(isAuth, user = null) {
    const body = document.body;

    if (isAuth) {
        currentUser = user;

        body.classList.remove("not-authenticated");
        body.classList.add("authenticated");

        if (user.role === "admin") {
            body.classList.add("is-admin");
        }

        document.getElementById("nav-username").innerText = user.firstName;

    } else {
        currentUser = null;
        body.classList.remove("authenticated", "is-admin");
        body.classList.add("not-authenticated");
    }
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    navigateTo("#/");
}

/* =========================
   REGISTRATION
========================= */

document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const first = regFirst.value.trim();
    const last = regLast.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;

    if (password.length < 6) {
        registerError.innerText = "Password must be at least 6 characters.";
        return;
    }

    if (window.db.accounts.find(acc => acc.email === email)) {
        registerError.innerText = "Email already exists.";
        return;
    }

    const newUser = {
        firstName: first,
        lastName: last,
        email,
        password,
        role: "user",
        verified: false
    };

    window.db.accounts.push(newUser);
    saveToStorage();

    localStorage.setItem("unverified_email", email);
    navigateTo("#/verify-email");
});

/* =========================
   VERIFY EMAIL
========================= */

function simulateVerification() {
    const email = localStorage.getItem("unverified_email");
    const user = window.db.accounts.find(acc => acc.email === email);

    if (user) {
        user.verified = true;
        saveToStorage();
        navigateTo("#/login");
    }
}

/* =========================
   LOGIN
========================= */

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    const user = window.db.accounts.find(acc =>
        acc.email === email &&
        acc.password === password &&
        acc.verified === true
    );

    if (!user) {
        loginError.innerText = "Invalid credentials or email not verified.";
        return;
    }

    localStorage.setItem("auth_token", email);
    setAuthState(true, user);
    navigateTo("#/profile");
});

/* =========================
   PROFILE
========================= */

function renderProfile(){
  let info = `
    <div class="card p-4 shadow-sm">
      <h5>${currentUser.first} ${currentUser.last}</h5>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Role:</strong> ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</p>
      <button class="btn btn-outline-primary btn-sm">Edit Profile</button>
    </div>
  `;

  document.getElementById("profileInfo").innerHTML = info;

  document.getElementById("nav-username").innerText =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
}

/* =========================
   INIT
========================= */

loadFromStorage();

if (!window.location.hash) {
    navigateTo("#/");
}

handleRouting();

