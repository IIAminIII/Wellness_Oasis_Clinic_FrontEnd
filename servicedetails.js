function serviceIdFromUrl() {
  return new URLSearchParams(window.location.search).get("serviceId");
}

function renderService(service) {
  const target = document.querySelector("#service-detail");
  document.title = `${service.name} | Wellness Oasis Clinic`;
  target.innerHTML = `
    <div class="detail-photo">
      ${
        service.image
          ? `<img src="${escapeHTML(service.image)}" alt="${escapeHTML(service.name)}">`
          : '<div class="empty-state">✦</div>'
      }
    </div>
    <div class="detail-content">
      <span class="eyebrow">Clinical service</span>
      <h1>${escapeHTML(service.name)}</h1>
      <p class="lead">${escapeHTML(service.description)}</p>
      <a class="button button-primary" data-book-service href="index.html#doctors">Book an appointment</a>
      <a class="button button-secondary" href="services.html">All services</a>
    </div>`;
}

async function loadServiceDoctors(service) {
  const section = document.querySelector("#service-doctors-section");
  const target = document.querySelector("#service-doctors");
  const slugs = (service.specializations || []).map((item) => item.slug);
  if (!slugs.length) return;

  try {
    const doctors = listOf(
      await apiRequest(
        `/doctors/list/?specialization=${encodeURIComponent(slugs.join(","))}&page_size=100`
      )
    );
    if (!doctors.length) {
      target.innerHTML =
        '<div class="empty-state">Specialists for this service are joining soon — ask the care desk to be matched with a doctor.</div>';
    } else {
      target.innerHTML = doctors.map(doctorCard).join("");
      // Book straight from here: the modal carries a doctor picker preloaded
      // with this service's specialists.
      const bookable = doctors.filter((doctor) => doctor.is_accepting_patients);
      if (bookable.length) {
        configureBookingDoctorChoices(bookable);
        const bookButton = document.querySelector("[data-book-service]");
        bookButton?.addEventListener("click", (event) => {
          event.preventDefault();
          openBooking();
        });
      }
    }
    section.hidden = false;
  } catch {
    // The service itself rendered; missing specialists are not fatal.
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = serviceIdFromUrl();
  const target = document.querySelector("#service-detail");
  if (!id || !/^\d+$/.test(id)) {
    target.innerHTML = '<div class="error-state">That service link is invalid.</div>';
    return;
  }
  try {
    const service = await apiRequest(`/services/${id}/`);
    renderService(service);
    loadServiceDoctors(service);
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
});
