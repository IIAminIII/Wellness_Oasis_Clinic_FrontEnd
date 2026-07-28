function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]
  );
}

function renderShell() {
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");
  const user = authStore.user;

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="container nav-wrap">
          <a class="brand" href="index.html" aria-label="Wellness Oasis home">
            <span class="brand-mark"><img src="assets/mainlogo.svg" alt=""></span>
            <span>Wellness <strong>Oasis</strong></span>
          </a>
          <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <nav class="site-nav" aria-label="Main navigation">
            <a href="index.html">Home</a>
            <a href="services.html">Services</a>
            <a href="index.html#doctors">Doctors</a>
            <a href="contactus.html">Contact</a>
            ${
              authStore.isAuthenticated
                ? `<a class="nav-user" href="userDetail.html">
                    <span class="avatar avatar-small">${escapeHTML(
                      initials(user?.full_name || user?.username)
                    )}</span>
                    ${escapeHTML(user?.first_name || "My portal")}
                  </a>
                  <button class="button button-ghost button-small" data-logout type="button">Sign out</button>`
                : `<a href="login.html">Sign in</a>
                  <a class="button button-primary button-small" href="signup.html">Create account</a>`
            }
          </nav>
        </div>
      </header>`;

    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".site-nav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    header.querySelector("[data-logout]")?.addEventListener("click", handleLogout);
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            <a class="brand brand-light" href="index.html">
              <span class="brand-mark"><img src="assets/mainlogo.svg" alt=""></span>
              <span>Wellness <strong>Oasis</strong></span>
            </a>
            <p>Thoughtful healthcare, made easier for every family.</p>
          </div>
          <div>
            <h3>Care</h3>
            <a href="services.html">Services</a>
            <a href="index.html#doctors">Find a doctor</a>
            <a href="contactus.html">Patient support</a>
          </div>
          <div>
            <h3>Portal</h3>
            <a href="userDetail.html">Appointments</a>
            <a href="userDetail.html">My profile</a>
            <a href="login.html">Secure sign in</a>
          </div>
          <div>
            <h3>Need help?</h3>
            <p>Our care desk responds to non-emergency enquiries.</p>
            <a class="footer-contact" href="contactus.html">Contact care desk →</a>
          </div>
        </div>
        <div class="container footer-bottom">
          <span>© ${new Date().getFullYear()} Wellness Oasis Clinic</span>
          <span>Privacy-first patient care</span>
        </div>
      </footer>`;
  }

  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const target = link.getAttribute("href")?.split("#")[0];
    if (target === current) link.setAttribute("aria-current", "page");
  });
}

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "WO"
  );
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function setLoading(button, loading, label = "Please wait…") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

function showMessage(target, message, type = "error") {
  const element =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
  element.hidden = false;
}

function toast(message, type = "success") {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  region.appendChild(item);
  window.setTimeout(() => item.remove(), 4200);
}

async function handleLogout() {
  try {
    await apiRequest("/patients/logout/", { method: "POST" });
  } catch {
    // Local session is still cleared if the server token has expired.
  } finally {
    authStore.clear();
    window.location.href = "login.html?signed_out=1";
  }
}

function requireAuthentication(returnTo = window.location.href) {
  if (authStore.isAuthenticated) return true;
  sessionStorage.setItem("wellness_return_to", returnTo);
  window.location.href = "login.html";
  return false;
}

window.addEventListener("wellness:session-expired", () => {
  toast("Your session has expired. Please sign in again.", "error");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
});

document.addEventListener("DOMContentLoaded", renderShell);
