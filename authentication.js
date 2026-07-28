function fieldValue(form, name) {
  return form.elements[name]?.value.trim() || "";
}

async function handleRegistration(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const message = form.querySelector("[data-form-message]");
  message.hidden = true;

  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirm_password.value;
  if (password !== confirmPassword) {
    showMessage(message, "The passwords do not match.");
    return;
  }

  setLoading(submit, true, "Creating account…");
  try {
    const data = await apiRequest("/patients/register/", {
      method: "POST",
      body: JSON.stringify({
        username: fieldValue(form, "username"),
        first_name: fieldValue(form, "first_name"),
        last_name: fieldValue(form, "last_name"),
        email: fieldValue(form, "email"),
        mobile_no: fieldValue(form, "mobile_no"),
        password,
        confirm_password: confirmPassword,
      }),
    });

    if (data.requires_verification) {
      form.reset();
      showMessage(message, data.message, "success");
      return;
    }

    authStore.setSession(data.token, data.user);
    window.location.href = "userDetail.html?welcome=1";
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(submit, false);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const message = form.querySelector("[data-form-message]");
  message.hidden = true;
  setLoading(submit, true, "Signing in…");

  try {
    const data = await apiRequest("/patients/login/", {
      method: "POST",
      body: JSON.stringify({
        identifier: fieldValue(form, "identifier"),
        password: form.elements.password.value,
      }),
    });
    authStore.setSession(data.token, data.user);
    const returnTo = sessionStorage.getItem("wellness_return_to");
    sessionStorage.removeItem("wellness_return_to");
    window.location.href = returnTo || "userDetail.html";
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(submit, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (authStore.isAuthenticated) {
    const authForm = document.querySelector("[data-auth-form]");
    if (authForm) {
      showMessage(
        authForm.querySelector("[data-form-message]"),
        "You are already signed in.",
        "success"
      );
    }
  }

  const params = new URLSearchParams(window.location.search);
  const message = document.querySelector("[data-form-message]");
  if (params.get("verified") === "1") {
    showMessage(message, "Email verified. You can now sign in.", "success");
  } else if (params.get("verified") === "0") {
    showMessage(message, "That verification link is invalid or expired.");
  } else if (params.get("signed_out") === "1") {
    showMessage(message, "You have been signed out safely.", "success");
  }
});
