document.addEventListener("DOMContentLoaded", async () => {
  const target = document.querySelector("#all-services");
  try {
    const services = listOf(await apiRequest("/services/?page_size=100"));
    target.innerHTML = services.map(serviceCard).join("");
    if (!services.length) {
      target.innerHTML = '<div class="empty-state">Services are being updated.</div>';
    }
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHTML(error.message)}</div>`;
  }
});
