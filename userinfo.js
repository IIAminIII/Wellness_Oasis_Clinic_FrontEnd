let portalAppointments = [];
let portalWaitlist = [];

function appointmentItem(appointment) {
  const doctor = appointment.doctor_detail;
  const canCancel = !appointment.cancel && !["Completed", "Cancelled"].includes(
    appointment.appointment_status
  );
  return `
    <article class="appointment-item">
      <div class="appointment-doctor">
        <strong>Dr. ${escapeHTML(doctor?.full_name || "Clinic doctor")}</strong>
        <span>${escapeHTML(
          doctor?.specialization?.[0]?.name || appointment.appointment_type
        )}</span>
      </div>
      <div class="appointment-date">
        <strong>${escapeHTML(formatDate(appointment.scheduled_date))}</strong>
        <small>${escapeHTML(appointment.time_detail?.name || "")} · ${escapeHTML(
          appointment.appointment_type
        )}</small>
      </div>
      <div>
        <span class="status ${escapeHTML(appointment.appointment_status)}">${escapeHTML(
          appointment.appointment_status
        )}</span>
        ${
          canCancel
            ? `<button class="button button-danger button-small" data-cancel="${appointment.id}" type="button">Cancel</button>`
            : ""
        }
      </div>
    </article>`;
}

function renderProfile(user) {
  document.querySelector("#profile-card").innerHTML = `
    <span class="avatar profile-avatar">${escapeHTML(initials(user.full_name))}</span>
    <h2>${escapeHTML(user.full_name || user.username)}</h2>
    <p>${escapeHTML(user.email)}</p>
    <p>${escapeHTML(user.mobile_no || "No mobile number added")}</p>
    <button class="button button-secondary button-block" data-edit-profile type="button">Edit profile</button>`;
  document.querySelector("#welcome-name").textContent =
    user.first_name || user.username;
  document
    .querySelector("[data-edit-profile]")
    ?.addEventListener("click", openProfileModal);
}

function renderAppointments() {
  const target = document.querySelector("#appointment-list");
  target.innerHTML = portalAppointments.map(appointmentItem).join("");
  if (!portalAppointments.length) {
    target.innerHTML = `
      <div class="empty-state">
        <h3>No appointments yet</h3>
        <p>Find a doctor and choose a time that works for you.</p>
        <a class="button button-primary button-small" href="index.html#doctors">Find a doctor</a>
      </div>`;
  }
  target.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => cancelAppointment(button.dataset.cancel));
  });

  const active = portalAppointments.filter(
    (item) => !item.cancel && !["Completed", "Cancelled"].includes(item.appointment_status)
  ).length;
  const completed = portalAppointments.filter(
    (item) => item.appointment_status === "Completed"
  ).length;
  document.querySelector("#stat-upcoming").textContent = active;
  document.querySelector("#stat-completed").textContent = completed;
  document.querySelector("#stat-total").textContent = portalAppointments.length;
}

function waitlistItem(entry) {
  const offered = entry.status === "Offered";
  return `
    <article class="appointment-item">
      <div class="appointment-doctor">
        <strong>Dr. ${escapeHTML(entry.doctor_detail?.full_name || "Clinic doctor")}</strong>
        <span>${escapeHTML(
          entry.doctor_detail?.specialization?.[0]?.name || "Waitlisted"
        )}</span>
      </div>
      <div class="appointment-date">
        <strong>${escapeHTML(formatDate(entry.requested_date))}</strong>
        <small>${escapeHTML(entry.time_detail?.name || "")}</small>
      </div>
      <div>
        <span class="status ${escapeHTML(entry.status)}">${escapeHTML(
          entry.status
        )}</span>
        ${
          offered
            ? `<button class="button button-primary button-small" data-accept="${entry.id}" type="button">Accept place</button>`
            : ""
        }
        <button class="button button-secondary button-small" data-leave="${entry.id}" type="button">
          ${offered ? "Decline" : "Leave"}
        </button>
      </div>
    </article>`;
}

function renderWaitlist() {
  const panel = document.querySelector("#waitlist-panel");
  const target = document.querySelector("#waitlist-list");
  if (!panel || !target) return;

  const open = portalWaitlist.filter((entry) =>
    ["Waiting", "Offered"].includes(entry.status)
  );
  panel.hidden = open.length === 0;
  target.innerHTML = open.map(waitlistItem).join("");

  target.querySelectorAll("[data-accept]").forEach((button) => {
    button.addEventListener("click", () => acceptWaitlistOffer(button.dataset.accept));
  });
  target.querySelectorAll("[data-leave]").forEach((button) => {
    button.addEventListener("click", () => leaveWaitlist(button.dataset.leave));
  });
}

async function acceptWaitlistOffer(id) {
  try {
    await apiRequest(`/appointments/waitlist/${id}/accept/`, { method: "POST" });
    toast("The place is yours — the appointment is booked.");
    await loadPortal();
  } catch (error) {
    toast(error.message);
    await loadPortal();
  }
}

async function leaveWaitlist(id) {
  try {
    await apiRequest(`/appointments/waitlist/${id}/leave/`, { method: "POST" });
    await loadPortal();
  } catch (error) {
    toast(error.message);
  }
}

async function loadPortal() {
  if (!requireAuthentication()) return;
  try {
    const [profileResponse, appointmentsResponse, waitlistResponse] =
      await Promise.all([
        apiRequest("/patients/me/"),
        apiRequest("/appointments/list/?page_size=100"),
        apiRequest("/appointments/waitlist/?page_size=100"),
      ]);
    authStore.setUser(profileResponse.user);
    renderProfile(profileResponse.user);
    portalAppointments = listOf(appointmentsResponse);
    portalWaitlist = listOf(waitlistResponse);
    renderAppointments();
    renderWaitlist();
  } catch (error) {
    renderPortalFailure(error);
  }
}

function renderPortalFailure(error) {
  document.querySelector("#profile-card").innerHTML = `
    <div class="error-state">
      <h3>Profile unavailable</h3>
      <p>The clinic server could not load your details.</p>
    </div>`;
  ["#stat-upcoming", "#stat-completed", "#stat-total"].forEach((selector) => {
    document.querySelector(selector).textContent = "—";
  });
  const target = document.querySelector("#appointment-list");
  target.innerHTML = `
    <div class="error-state">
      <h3>Portal temporarily unavailable</h3>
      <p>${escapeHTML(error.message)}</p>
      <button class="button button-primary button-small" data-retry-portal type="button">
        Try again
      </button>
    </div>`;
  target
    .querySelector("[data-retry-portal]")
    ?.addEventListener("click", loadPortal);
}

async function cancelAppointment(id) {
  if (!window.confirm("Cancel this appointment? The slot will become available again.")) {
    return;
  }
  try {
    await apiRequest(`/appointments/list/${id}/cancel/`, { method: "POST" });
    toast("Appointment cancelled.");
    await loadPortal();
  } catch (error) {
    toast(error.message, "error");
  }
}

function openProfileModal() {
  const user = authStore.user;
  const form = document.querySelector("#profile-form");
  form.elements.first_name.value = user.first_name || "";
  form.elements.last_name.value = user.last_name || "";
  form.elements.email.value = user.email || "";
  form.elements.mobile_no.value = user.mobile_no || "";
  document.querySelector("#profile-modal").classList.add("is-open");
}

function closeProfileModal() {
  document.querySelector("#profile-modal").classList.remove("is-open");
}

async function updateProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = form.querySelector("[data-form-message]");
  message.hidden = true;
  setLoading(button, true, "Saving…");
  try {
    const response = await apiRequest("/patients/me/", {
      method: "PATCH",
      body: JSON.stringify({
        first_name: form.elements.first_name.value.trim(),
        last_name: form.elements.last_name.value.trim(),
        email: form.elements.email.value.trim(),
        mobile_no: form.elements.mobile_no.value.trim(),
      }),
    });
    authStore.setUser(response.user);
    renderProfile(response.user);
    closeProfileModal();
    toast("Profile updated.");
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("welcome") === "1") toast("Welcome to Wellness Oasis.");
  if (params.get("booked") === "1") toast("Your appointment is confirmed.");
  if (params.get("waitlisted") === "1")
    toast("You are on the waitlist. We will offer you a place if one frees up.");
  loadPortal();
  document.querySelector("[data-close-profile]")?.addEventListener("click", closeProfileModal);
});
