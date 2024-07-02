const handleRegistration = (event) => {
  event.preventDefault();
  const username = getValue("username");
  const first_name = getValue("first_name");
  const last_name = getValue("last_name");
  const email = getValue("email");
  const password = getValue("password");
  const confirm_password = getValue("confirm_password");
  const info = {
    username,
    first_name,
    last_name,
    email,
    password,
    confirm_password,
  };
  if (password == confirm_password) {
    if (
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        password
      )
    ) {
      fetch(
        "https://wellness-oasis-clinic-api.onrender.com/patients/register/",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(info),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          alert("Check your email for verification.!");
        });
    } else {
      document.getElementById("error").innerText =
        "pass must contain eight characters, at least one letter, one number and one special character:";
    }
  } else {
    document.getElementById("error").innerText =
      "password and confirm password do not match";
    alert("password and confirm password do not match");
  }
  if (data && data.success) {
    window.location.href = "login.html";
  }
};

const getValue = (id) => {
  const value = document.getElementById(id).value;
  return value;
};

const handleLogin = (event) => {
  event.preventDefault();
  const username = getValue("login-username");
  const password = getValue("login-password");

  fetch("https://wellness-oasis-clinic-api.onrender.com/patients/login/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token && data.user_id) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        // Redirect to main page after successful login
        window.location.href = "index.html";
        alert("Login successful");
      } else {
        document.getElementById("error").innerText = "Invalid Username or Password";
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      document.getElementById("error").innerText = "Login failed. Please try again.";
    });
};

const handleLogout = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return; // Already logged out
  }

  try {
    const response = await fetch("https://wellness-oasis-clinic-api.onrender.com/patients/logout", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      // Redirect to login page after successful logout
      window.location.href = "login.html";
      alert("Logout successful");
    } else {
      console.error("Logout Error:", response.statusText);
      // Handle logout error (optional: display message)
    }
  } catch (error) {
    console.error("Logout Error:", error);
    // Handle logout error (optional: display message)
  }
};

