let currentDoctor = null;

function doctorIdFromUrl() {
  return new URLSearchParams(window.location.search).get("doctorId");
}

function renderDoctor(doctor) {
  const target = document.querySelector("#doctor-detail");
  const specialities = doctor.specialization || [];
  target.innerHTML = `
    <div class="detail-photo">
      ${
        doctor.image
          ? `<img src="${escapeHTML(doctor.image)}" alt="Dr. ${escapeHTML(
              doctor.full_name
            )}">`
          : `<div class="empty-state">${escapeHTML(initials(doctor.full_name))}</div>`
      }
    </div>
    <div class="detail-content">
      <span class="eyebrow">Doctor profile</span>
      <h1>Dr. ${escapeHTML(doctor.full_name)}</h1>
      <p>${escapeHTML(doctor.designation?.[0]?.name || "Medical specialist")}</p>
      <div class="tag-row">
        ${specialities
          .map((item) => `<span class="tag">${escapeHTML(item.name)}</span>`)
          .join("")}
      </div>
      <p class="lead">${escapeHTML(
        doctor.bio ||
          "Dedicated to clear communication, evidence-based treatment, and care plans shaped around each patient."
      )}</p>
      <div class="fact-grid">
        <div class="fact"><small>Consultation fee</small><strong>৳${Number(
          doctor.fee
        ).toLocaleString("en-BD")}</strong></div>
        <div class="fact"><small>Availability</small><strong>${
          doctor.is_accepting_patients ? "Accepting patients" : "Currently unavailable"
        }</strong></div>
      </div>
      <button class="button button-primary" data-open-booking ${
        doctor.is_accepting_patients ? "" : "disabled"
      }>Book an appointment</button>
      <a class="button button-secondary" href="index.html#doctors">Back to doctors</a>
    </div>`;

  target.querySelector("[data-open-booking]")?.addEventListener("click", openBooking);
}

async function loadDoctor() {
  const id = doctorIdFromUrl();
  const target = document.querySelector("#doctor-detail");
  if (!id || !/^\d+$/.test(id)) {
    target.innerHTML = '<div class="error-state">That doctor profile is invalid.</div>';
    return;
  }
  try {
    currentDoctor = await apiRequest(`/doctors/list/${id}/`);
    renderDoctor(currentDoctor);
    populateTimes(currentDoctor.available_time || []);
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
}

function populateTimes(times) {
  const select = document.querySelector("#appointment-time");
  select.innerHTML =
    '<option value="">Choose an available time</option>' +
    times
      .map(
        (time) =>
          `<option value="${time.id}">${escapeHTML(time.name)}</option>`
      )
      .join("");
}

function openBooking() {
  if (!requireAuthentication()) return;
  document.querySelector("#booking-modal").classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeBooking() {
  document.querySelector("#booking-modal").classList.remove("is-open");
  document.body.style.overflow = "";
}

async function handleAppointment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const message = form.querySelector("[data-form-message]");
  message.hidden = true;
  setLoading(submit, true, "Confirming appointment…");

  try {
    await apiRequest("/appointments/list/", {
      method: "POST",
      body: JSON.stringify({
        doctor: currentDoctor.id,
        appointment_type: form.elements.appointment_type.value,
        symptoms: form.elements.symptoms.value.trim(),
        scheduled_date: form.elements.scheduled_date.value,
        time: Number(form.elements.time.value),
      }),
    });
    window.location.href = "userDetail.html?booked=1";
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(submit, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDoctor();
  const dateInput = document.querySelector("#appointment-date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
  document.querySelector("[data-close-booking]")?.addEventListener("click", closeBooking);
  document.querySelector("#booking-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "booking-modal") closeBooking();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBooking();
  });
});
