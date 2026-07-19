const API_BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  if (typeof window === "undefined") return null; // guards against server-side rendering
  return localStorage.getItem("uzima_token");
}

async function apiRequest(path, { method = "GET", body = null, isFormData = false, auth = true } = {}) {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export default apiRequest;