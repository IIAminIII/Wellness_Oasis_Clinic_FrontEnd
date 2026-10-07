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
        ${
          clinicDaysLabel(doctor)
            ? `<div class="fact"><small>Clinic days</small><strong>${escapeHTML(
                clinicDaysLabel(doctor)
              )}</strong></div>`
            : ""
        }
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
    setBookingDoctor(currentDoctor);
    renderDoctor(currentDoctor);
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadDoctor);
