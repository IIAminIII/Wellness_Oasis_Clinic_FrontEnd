const operationsState = {
  actor: null,
  dashboard: null,
  filter: "all",
};

const roleLabels = {
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  billing: "Billing",
  lab_technician: "Lab technician",
  pharmacist: "Pharmacist",
  administrator: "Administrator",
  patient: "Patient",
};

function activeRoleAssignments() {
  return operationsState.actor?.roles || [];
}

function activeRoleNames() {
  return activeRoleAssignments().map((assignment) => assignment.role);
}

function primaryOperationsRole() {
  const priority = [
    "administrator",
    "doctor",
    "nurse",
    "receptionist",
    "billing",
    "lab_technician",
    "pharmacist",
  ];
  return priority.find((role) => activeRoleNames().includes(role)) || "patient";
}

function renderOperationsIdentity() {
  const actor = operationsState.actor;
  const assignments = activeRoleAssignments();
  const primaryRole = primaryOperationsRole();
  const primaryAssignment =
    assignments.find((assignment) => assignment.role === primaryRole) ||
    assignments[0];
  const target = document.querySelector("#operations-identity");
  target.innerHTML = `
    <span class="avatar operations-avatar">${escapeHTML(
      initials(actor.full_name || actor.username)
    )}</span>
    <div>
      <span class="role-badge">${escapeHTML(
        roleLabels[primaryRole] || primaryRole
      )}</span>
      <h2>${escapeHTML(actor.full_name || actor.username)}</h2>
      <p>${escapeHTML(
        primaryAssignment?.department_name ||
          primaryAssignment?.facility_name ||
          "Wellness Oasis care team"
      )}</p>
    </div>`;
}

function renderOperationsStats() {
  const stats = operationsState.dashboard?.stats || {};
  ["today", "upcoming", "pending", "confirmed", "completed"].forEach((key) => {
    document.querySelector(`#ops-stat-${key}`).textContent = stats[key] ?? 0;
  });
}

function transitionOptions(appointment) {
  const role = primaryOperationsRole();
  const current = appointment.appointment_status;
  const doctorOwns = role === "doctor";

  if (role === "administrator") {
    return {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Running", "Cancelled"],
      Running: ["Completed", "Cancelled"],
    }[current] || [];
  }
  if (role === "receptionist") {
    return {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Cancelled"],
    }[current] || [];
  }
  if (role === "nurse") {
    return current === "Confirmed" ? ["Running"] : [];
  }
  if (doctorOwns) {
    return {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Running", "Cancelled"],
      Running: ["Completed", "Cancelled"],
    }[current] || [];
  }
  return [];
}

function transitionLabel(status) {
  return {
    Confirmed: "Confirm",
    Running: "Start visit",
    Completed: "Complete",
    Cancelled: "Cancel",
  }[status];
}

function operationsAppointmentItem(appointment) {
  const transitions = transitionOptions(appointment);
  const patient = appointment.patient_detail;
  const doctor = appointment.doctor_detail;
  const location =
    appointment.department_detail?.name ||
    appointment.facility_detail?.name ||
    appointment.appointment_type;

  return `
    <article class="operations-appointment" data-appointment-status="${escapeHTML(
      appointment.appointment_status
    )}">
      <div class="operations-time">
        <strong>${escapeHTML(appointment.time_detail?.name || "Time pending")}</strong>
        <span>${escapeHTML(formatDate(appointment.scheduled_date))}</span>
      </div>
      <div class="operations-person">
        <span class="avatar avatar-small">${escapeHTML(
          initials(patient?.full_name || patient?.username)
        )}</span>
        <div>
          <strong>${escapeHTML(
            patient?.full_name || patient?.username || "Patient"
          )}</strong>
          <span>${escapeHTML(location)}</span>
        </div>
      </div>
      <div class="operations-clinician">
        <small>Clinician</small>
        <strong>Dr. ${escapeHTML(doctor?.full_name || "Assigned doctor")}</strong>
      </div>
      <div class="operations-status-actions">
        <span class="status ${escapeHTML(appointment.appointment_status)}">${escapeHTML(
          appointment.appointment_status
        )}</span>
        <div class="workflow-actions">
          ${transitions
            .map(
              (status) => `
                <button
                  class="button ${
                    status === "Cancelled" ? "button-danger" : "button-secondary"
                  } button-small"
                  type="button"
                  data-transition-id="${appointment.id}"
                  data-transition-status="${escapeHTML(status)}"
                >${escapeHTML(transitionLabel(status))}</button>`
            )
            .join("")}
        </div>
      </div>
    </article>`;
}

function renderOperationsAppointments() {
  const target = document.querySelector("#operations-appointments");
  const appointments = operationsState.dashboard?.appointments || [];
  const filtered =
    operationsState.filter === "all"
      ? appointments
      : appointments.filter(
          (appointment) =>
            appointment.appointment_status === operationsState.filter
        );

  target.innerHTML = filtered.map(operationsAppointmentItem).join("");
  if (!filtered.length) {
    target.innerHTML = `
      <div class="empty-state">
        <h3>No appointments in this view</h3>
        <p>The queue will update as bookings move through care.</p>
      </div>`;
  }
  target.querySelectorAll("[data-transition-id]").forEach((button) => {
    button.addEventListener("click", () =>
      transitionAppointment(
        button.dataset.transitionId,
        button.dataset.transitionStatus,
        button
      )
    );
  });
}

async function transitionAppointment(id, status, button) {
  const confirmation =
    status === "Cancelled"
      ? "Cancel this appointment?"
      : `Move this appointment to ${status.toLowerCase()}?`;
  if (!window.confirm(confirmation)) return;

  setLoading(button, true, "Updating…");
  try {
    await apiRequest(`/appointments/list/${id}/transition/`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    toast(`Appointment moved to ${status.toLowerCase()}.`);
    await loadOperationsDashboard();
  } catch (error) {
    toast(error.message, "error");
    setLoading(button, false);
  }
}

async function loadOperationsDashboard() {
  if (!requireAuthentication()) return;
  const refresh = document.querySelector("#refresh-operations");
  setLoading(refresh, true, "Refreshing…");
  try {
    const [actorResponse, dashboardResponse] = await Promise.all([
      apiRequest("/operations/me/"),
      apiRequest("/operations/dashboard/"),
    ]);
    operationsState.actor = actorResponse.user;
    operationsState.dashboard = dashboardResponse;

    if (!activeRoleNames().some((role) => OPERATIONS_ROLES.has(role))) {
      window.location.replace("userDetail.html");
      return;
    }

    authStore.setUser({
      ...authStore.user,
      ...actorResponse.user,
      roles: activeRoleNames(),
    });
    renderOperationsIdentity();
    renderOperationsStats();
    renderOperationsAppointments();

    const scopeLabels = {
      administrator: "Organisation-wide appointment oversight",
      operations: "Facility-scoped appointment coordination",
      doctor: "Your assigned patient appointments",
      personal: "Your available operational workspace",
    };
    document.querySelector("#operations-context").textContent =
      scopeLabels[dashboardResponse.scope] || scopeLabels.personal;
  } catch (error) {
    document.querySelector("#operations-appointments").innerHTML = `
      <div class="error-state">
        <h3>Operations workspace unavailable</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>`;
    toast(error.message, "error");
  } finally {
    setLoading(refresh, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("#refresh-operations")
    ?.addEventListener("click", loadOperationsDashboard);

  document.querySelectorAll("[data-status-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      operationsState.filter = button.dataset.statusFilter;
      document.querySelectorAll("[data-status-filter]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderOperationsAppointments();
    });
  });

  loadOperationsDashboard();
});
