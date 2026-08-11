let currentDoctor = null;
// Slots returned for the currently selected date, including full ones so the
// patient can be offered the waitlist rather than a dead end.
let currentSlots = [];

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
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
}

async function loadAvailability(dateValue) {
  const select = document.querySelector("#appointment-time");
  const hint = document.querySelector("[data-slot-hint]");
  hideWaitlistPrompt();
  currentSlots = [];

  if (!currentDoctor || !dateValue) {
    select.innerHTML = '<option value="">Pick a date first</option>';
    hint.textContent = "";
    return;
  }

  select.innerHTML = '<option value="">Loading times…</option>';
  try {
    const result = await apiRequest(
      `/doctors/list/${currentDoctor.id}/availability/?from=${dateValue}&days=1`
    );
    const day = result.days?.[0] || { slots: [], on_leave: false };
    currentSlots = day.slots || [];

    if (day.on_leave) {
      select.innerHTML = '<option value="">Doctor is on leave</option>';
      hint.textContent = "Dr. " + currentDoctor.full_name + " is away on this date.";
      return;
    }
    if (!currentSlots.length) {
      select.innerHTML = '<option value="">No clinic on this day</option>';
      hint.textContent = "This doctor does not hold a clinic on that weekday.";
      return;
    }

    select.innerHTML =
      '<option value="">Choose an available time</option>' +
      currentSlots
        .map((slot) => {
          const suffix = slot.bookable
            ? ` — ${slot.remaining} of ${slot.capacity} left`
            : " — full";
          return `<option value="${slot.time}" ${
            slot.bookable ? "" : "disabled"
          }>${escapeHTML(slot.label)}${suffix}</option>`;
        })
        .join("");

    const full = currentSlots.filter((slot) => !slot.bookable);
    hint.textContent = full.length
      ? `${full.length} of ${currentSlots.length} times are already full.`
      : "";
    if (full.length === currentSlots.length) showWaitlistPrompt(full[0]);
  } catch (error) {
    select.innerHTML = '<option value="">Could not load times</option>';
    hint.textContent = error.message;
  }
}

function showWaitlistPrompt(slot) {
  const prompt = document.querySelector("[data-waitlist-prompt]");
  if (!prompt || !slot) return;
  prompt.dataset.slotId = slot.time;
  prompt.querySelector("[data-waitlist-text]").textContent =
    `Every time on this date is full. Join the waitlist for ${slot.label} and ` +
    "we will offer you the place if it frees up.";
  prompt.hidden = false;
}

function hideWaitlistPrompt() {
  const prompt = document.querySelector("[data-waitlist-prompt]");
  if (prompt) prompt.hidden = true;
}

async function joinWaitlist() {
  if (!requireAuthentication()) return;
  const prompt = document.querySelector("[data-waitlist-prompt]");
  const form = document.querySelector("#booking-modal form");
  const message = form.querySelector("[data-form-message]");
  const button = prompt.querySelector("[data-join-waitlist]");
  message.hidden = true;
  setLoading(button, true, "Joining…");

  try {
    await apiRequest("/appointments/waitlist/", {
      method: "POST",
      body: JSON.stringify({
        doctor: currentDoctor.id,
        time: Number(prompt.dataset.slotId),
        requested_date: form.elements.scheduled_date.value,
        symptoms: form.elements.symptoms.value.trim(),
      }),
    });
    window.location.href = "userDetail.html?waitlisted=1";
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
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
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
    dateInput.addEventListener("change", () => loadAvailability(dateInput.value));
  }
  document
    .querySelector("[data-join-waitlist]")
    ?.addEventListener("click", joinWaitlist);
  document.querySelector("[data-close-booking]")?.addEventListener("click", closeBooking);
  document.querySelector("#booking-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "booking-modal") closeBooking();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBooking();
  });
});
