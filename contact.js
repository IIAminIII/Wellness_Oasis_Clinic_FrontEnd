async function handleContact(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = form.querySelector("[data-form-message]");
  message.hidden = true;
  setLoading(button, true, "Sending request…");

  try {
    await apiRequest("/contact_us/", {
      method: "POST",
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        problem: form.elements.problem.value.trim(),
      }),
    });
    form.reset();
    showMessage(
      message,
      "Thank you. Our care desk will contact you shortly.",
      "success"
    );
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
}
