const API = "https://novastack-backend1.onrender.com";

window.addEventListener("load", () => {
  showUser();

  const msg = localStorage.getItem("toast");
  if (msg) {
    showToast(msg);
    localStorage.removeItem("toast");
  }

  if (document.getElementById("serviceName")) {
    document.getElementById("serviceName").innerText = localStorage.getItem("service");
  }

  if (document.getElementById("bookings")) {
    loadBookings();
  }
});

// ================= TOAST =================
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ================= USER =================
function showUser() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  const logoutLink = document.getElementById("logoutLink");

  if (token) {
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "block";

    if (userName) {
      const sidebar = document.querySelector(".sidebar");

      if (!document.getElementById("userTag")) {
        const tag = document.createElement("p");
        tag.id = "userTag";
        tag.innerText = "👋 " + userName;
        sidebar.appendChild(tag);
      }
    }
  } else {
    if (logoutLink) logoutLink.style.display = "none";
  }
}

// ================= AUTH =================
async function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  await fetch(API + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const loginRes = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await loginRes.json();

  localStorage.setItem("token", data.token);
  localStorage.setItem("userName", data.name);
  localStorage.setItem("toast", "Signup Successful 🎉");

  window.location.href = "index.html";
}

async function login() {
  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.name);
    window.location.href = "index.html";
  } else {
    showToast("Invalid Credentials");
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= BOOK SERVICE =================
function book(service) {
  localStorage.setItem("service", service);
  window.location.href = "booking.html";
}

// ================= CONFIRM BOOKING =================
async function confirmBooking() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(API + "/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      service: localStorage.getItem("service"),
      type: document.getElementById("type").value
    })
  });

  const data = await res.json();

  showToast(data.message || "Booked Successfully ✅");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

// ================= LOAD BOOKINGS =================
async function loadBookings() {
  const token = localStorage.getItem("token");

  const res = await fetch(API + "/my-bookings", {
    headers: {
      "Authorization": token
    }
  });

  const data = await res.json();

  const container = document.getElementById("bookings");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No bookings yet</p>";
    return;
  }

  data.forEach(b => {
    container.innerHTML += `
      <div class="card">
        <h3>${b.service}</h3>
        <p>${b.type || ""}</p>
      </div>
    `;
  });
}

// ================= ADMIN =================
async function loadAdmin() {
  const res = await fetch(API + "/admin/bookings");
  const data = await res.json();

  document.getElementById("adminData").innerHTML =
    data.map(b => `<div class="card">👤 ${b.name}<br>${b.service} - ${b.type}</div>`).join("");
}
