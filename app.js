const homeState = {
  doctors: [],
  searchTimer: null,
};

function serviceCard(service) {
  const image = service.image
    ? `<img src="${escapeHTML(service.image)}" alt="" loading="lazy">`
    : "✦";
  return `
    <article class="service-card">
      <div class="service-icon">${image}</div>
      <h3>${escapeHTML(service.name)}</h3>
      <p>${escapeHTML(service.description).slice(0, 145)}${
        service.description.length > 145 ? "…" : ""
      }</p>
      <a class="text-link" href="services.html">Explore service →</a>
    </article>`;
}

function doctorCard(doctor) {
  const specialties = doctor.specialization || [];
  const photo = doctor.image
    ? `<img src="${escapeHTML(doctor.image)}" alt="${escapeHTML(
        doctor.full_name
      )}" loading="lazy">`
    : `<div class="empty-state">${escapeHTML(initials(doctor.full_name))}</div>`;
  return `
    <article class="doctor-card">
      <div class="doctor-photo">
        ${photo}
        ${
          doctor.is_accepting_patients
            ? '<span class="doctor-availability">Accepting patients</span>'
            : ""
        }
      </div>
      <div class="doctor-body">
        <h3>Dr. ${escapeHTML(doctor.full_name)}</h3>
        <p>${escapeHTML(doctor.designation?.[0]?.name || "Medical specialist")}</p>
        <div class="tag-row">
          ${specialties
            .slice(0, 2)
            .map((item) => `<span class="tag">${escapeHTML(item.name)}</span>`)
            .join("")}
        </div>
        <div class="doctor-meta">
          <div class="doctor-fee">
            <small>Consultation</small>
            <strong>৳${Number(doctor.fee).toLocaleString("en-BD")}</strong>
          </div>
          <a class="button button-primary button-small" href="docdetails.html?doctorId=${
            doctor.id
          }">View profile</a>
        </div>
      </div>
    </article>`;
}

function reviewCard(review) {
  return `
    <article class="review-card">
      <div class="review-stars" aria-label="${review.rating} out of 5 stars">${"★".repeat(
        review.rating
      )}${"☆".repeat(5 - review.rating)}</div>
      <blockquote>“${escapeHTML(review.body).slice(0, 180)}”</blockquote>
      <div class="reviewer">
        <span class="avatar">${escapeHTML(initials(review.reviewer_name))}</span>
        <span>${escapeHTML(review.reviewer_name || "Verified patient")}</span>
      </div>
    </article>`;
}

async function loadServices() {
  const target = document.querySelector("#service-container");
  if (!target) return;
  try {
    const services = listOf(await apiRequest("/services/?page_size=6"));
    target.innerHTML = services.slice(0, 6).map(serviceCard).join("");
    if (!services.length) {
      target.innerHTML = '<div class="empty-state">Services are being updated.</div>';
    }
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
}

async function loadDoctors(search = "") {
  const target = document.querySelector("#doctor-list");
  if (!target) return;
  target.innerHTML = '<div class="loading-state">Finding available doctors…</div>';
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    homeState.doctors = listOf(await apiRequest(`/doctors/list/${query}`));
    target.innerHTML = homeState.doctors.map(doctorCard).join("");
    if (!homeState.doctors.length) {
      target.innerHTML =
        '<div class="empty-state">No doctors match that search. Try a speciality or name.</div>';
    }
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
}

async function loadReviews() {
  const target = document.querySelector("#review-container");
  if (!target) return;
  try {
    const reviews = listOf(await apiRequest("/doctors/reviews/?page_size=3"));
    target.innerHTML = reviews.slice(0, 3).map(reviewCard).join("");
    if (!reviews.length) {
      target.closest("section")?.remove();
    }
  } catch {
    target.closest("section")?.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadServices();
  loadDoctors();
  loadReviews();

  const search = document.querySelector("#doctor-search");
  search?.addEventListener("input", (event) => {
    clearTimeout(homeState.searchTimer);
    homeState.searchTimer = setTimeout(
      () => loadDoctors(event.target.value.trim()),
      280
    );
  });
});
