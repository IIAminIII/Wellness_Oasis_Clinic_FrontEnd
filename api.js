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
  const data =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    if (response.status === 401 && authStore.token) {
      authStore.clear();
      window.dispatchEvent(new CustomEvent("wellness:session-expired"));
    }
    const error = new Error(firstError(data?.errors || data));
    error.status = response.status;
    error.details = data?.errors || data;
    throw error;
  }
  return data;
}
