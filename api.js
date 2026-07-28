const API_BASE_URL =
  window.WELLNESS_API_URL ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://127.0.0.1:8000"
    : "https://wellness-oasis-clinic-api.onrender.com");

const AUTH_TOKEN_KEY = "wellness_auth_token";
const USER_KEY = "wellness_user";

const authStore = {
  get token() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("patient_id");
  },
  get isAuthenticated() {
    return Boolean(this.token);
  },
};

function listOf(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

function firstError(value) {
  if (!value) return "Something went wrong. Please try again.";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstError(value[0]);
  if (typeof value === "object") {
    const firstValue = Object.values(value)[0];
    return firstError(firstValue);
  }
  return String(value);
}

function httpErrorMessage(status) {
  const messages = {
    400: "The server could not process that request.",
    403: "You do not have permission to perform that action.",
    404: "This feature is temporarily unavailable while the clinic server updates.",
    429: "Too many requests were sent. Please wait a moment and try again.",
    500: "The clinic server encountered an error. Please try again shortly.",
    502: "The clinic server is temporarily unavailable.",
    503: "The clinic server is temporarily unavailable.",
    504: "The clinic server took too long to respond.",
  };
  return messages[status] || "Something went wrong. Please try again.";
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authStore.token) {
    headers.set("Authorization", `Token ${authStore.token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "We could not reach the clinic server. Check your connection and try again."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data =
    response.status === 204
      ? null
      : isJson
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    if (response.status === 401 && authStore.token) {
      authStore.clear();
      window.dispatchEvent(new CustomEvent("wellness:session-expired"));
    }
    const error = new Error(
      isJson ? firstError(data?.errors || data) : httpErrorMessage(response.status)
    );
    error.status = response.status;
    error.details = isJson ? data?.errors || data : null;
    throw error;
  }
  return data;
}
