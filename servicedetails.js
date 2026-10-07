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
      <a class="button button-primary" href="index.html#doctors">Book an appointment</a>
      <a class="button button-secondary" href="services.html">All services</a>
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = serviceIdFromUrl();
  const target = document.querySelector("#service-detail");
  if (!id || !/^\d+$/.test(id)) {
    target.innerHTML = '<div class="error-state">That service link is invalid.</div>';
    return;
  }
  try {
    renderService(await apiRequest(`/services/${id}/`));
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
});
