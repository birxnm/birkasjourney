/*
 * auth.js — Login and registration on index.html.
 */

const alertBox = document.getElementById("alert");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

function showError(message) {
  alertBox.textContent = message;
  alertBox.className = "alert alert-error";
  alertBox.hidden = false;
}

function clearError() {
  alertBox.hidden = true;
}

// Already signed in? Skip the form.
if (Auth.isLoggedIn) {
  window.location.href = "/dashboard";
}

// Bounced here by an expired token.
if (new URLSearchParams(window.location.search).has("expired")) {
  showError("Your session expired. Please log in again.");
}

// ─── Tab switching ──────────────────────────────────────────────────────────

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    clearError();
  });
});

// ─── Submit handling ────────────────────────────────────────────────────────

/** Run an auth call with the submit button locked, then land on the dashboard. */
async function submitAuth(form, call) {
  const button = form.querySelector("button[type=submit]");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Please wait…";
  clearError();

  try {
    const result = await call();
    Auth.token = result.access_token;
    window.location.href = "/dashboard";
  } catch (error) {
    showError(error.message);
    button.disabled = false;
    button.textContent = originalText;
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth(loginForm, () =>
    API.login({
      email: document.getElementById("login-email").value.trim(),
      password: document.getElementById("login-password").value,
    })
  );
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = document.getElementById("register-password").value;
  if (password.trim().length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }

  const username = document.getElementById("register-username").value.trim();
  submitAuth(registerForm, () =>
    API.register({
      email: document.getElementById("register-email").value.trim(),
      password,
      username: username || null,
    })
  );
});
