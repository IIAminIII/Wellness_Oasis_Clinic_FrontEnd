// Shared appointment-booking modal. Pages include the #booking-modal markup,
// call setBookingDoctor() (or configureBookingDoctorChoices() when the patient
// picks between several doctors) and openBooking().
let bookingDoctor = null;
// Slots returned for the currently selected date, including full ones so the
// patient can be offered the waitlist rather than a dead end.
let currentSlots = [];

function activeClinicSlots(doctor = bookingDoctor) {
  return (doctor?.available_time || []).filter((slot) => slot.is_active !== false);
}

// Doctor weekdays use Monday=0 (Python); JS Date.getDay() uses Sunday=0.
function toDoctorWeekday(jsDay) {
  return (jsDay + 6) % 7;
}

function clinicDaysLabel(doctor = bookingDoctor) {
  const byWeekday = new Map(
    activeClinicSlots(doctor).map((slot) => [slot.weekday, slot.weekday_label])
  );
  const labels = [...byWeekday.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, label]) => label);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function nextClinicDate(fromDate = new Date()) {
  const weekdays = new Set(activeClinicSlots().map((slot) => slot.weekday));
  if (!weekdays.size) return "";
  const candidate = new Date(fromDate);
  for (let i = 0; i < 14; i += 1) {
    if (weekdays.has(toDoctorWeekday(candidate.getDay()))) {
      return candidate.toLocaleDateString("en-CA");
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  return "";
}

function setBookingDoctor(doctor) {
  bookingDoctor = doctor;
  currentSlots = [];
  hideWaitlistPrompt();
  const dateInput = document.querySelector("#appointment-date");
  const select = document.querySelector("#appointment-time");
  if (dateInput) dateInput.value = "";
  if (select) select.innerHTML = '<option value="">Pick a date first</option>';
}

// Populate the optional #booking-doctor select so a patient booking from a
// service page can choose between the specialists who deliver it.
function configureBookingDoctorChoices(doctors) {
  const select = document.querySelector("#booking-doctor");
  if (!select || !doctors.length) return;
  select.innerHTML = doctors
    .map(
      (doctor) =>
        `<option value="${doctor.id}">Dr. ${escapeHTML(doctor.full_name)} — ৳${Number(
          doctor.fee
        ).toLocaleString("en-BD")}</option>`
    )
    .join("");
  select.onchange = () => {
    const chosen = doctors.find((doctor) => String(doctor.id) === select.value);
    if (!chosen) return;
    setBookingDoctor(chosen);
    prefillNextClinicDay();
  };
  setBookingDoctor(doctors[0]);
}

function prefillNextClinicDay() {
  const dateInput = document.querySelector("#appointment-date");
  if (!dateInput) return;
  const suggested = nextClinicDate();
  if (suggested) {
    dateInput.value = suggested;
    loadAvailability(suggested);
  }
}

async function loadAvailability(dateValue) {
  const select = document.querySelector("#appointment-time");
  const hint = document.querySelector("[data-slot-hint]");
  hideWaitlistPrompt();
  currentSlots = [];

  if (!bookingDoctor || !dateValue) {
    select.innerHTML = '<option value="">Pick a date first</option>';
    hint.textContent = "";
    return;
  }

  select.innerHTML = '<option value="">Loading times…</option>';
  try {
    const result = await apiRequest(
      `/doctors/list/${bookingDoctor.id}/availability/?from=${dateValue}&days=1`
    );
    const day = result.days?.[0] || { slots: [], on_leave: false };
    currentSlots = day.slots || [];

    if (day.on_leave) {
      select.innerHTML = '<option value="">Doctor is on leave</option>';
      hint.textContent = "Dr. " + bookingDoctor.full_name + " is away on this date.";
      return;
    }
    if (!currentSlots.length) {
      const chosenDay = new Date(`${dateValue}T00:00:00`).toLocaleDateString(
        "en-US",
        { weekday: "long" }
      );
      const days = clinicDaysLabel();
      select.innerHTML = '<option value="">No clinic on this day</option>';
      hint.textContent = days
        ? `No clinic on ${chosenDay}s — Dr. ${bookingDoctor.full_name} holds clinics on ${days}. Pick one of those days.`
        : "This doctor does not hold a clinic on that weekday.";
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
        doctor: bookingDoctor.id,
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

  // Start the form on the doctor's next clinic day instead of a blind pick.
  const dateInput = document.querySelector("#appointment-date");
  if (dateInput && !dateInput.value) prefillNextClinicDay();
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
        doctor: bookingDoctor.id,
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
