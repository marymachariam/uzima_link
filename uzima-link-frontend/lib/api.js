export const API_BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  if (typeof window === "undefined") return null; 
  return localStorage.getItem("uzima_token");
}
function getAdminApiKey() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("uzima_admin_key");
}

async function apiRequest(path, { method = "GET", body = null, isFormData = false, auth = true, isAdmin = false } = {}) {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const isadminRoute = isAdmin || path.startsWith("/admin");

  if (isadminRoute) {
    const adminKey = getAdminApiKey();
    if (adminKey) {
      headers["x-admin-key"] = adminKey; 
    }
  } else if (auth) {
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
    let message = `Request failed with status ${response.status}`;

    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((e) => {
            const field = (e.loc || []).slice(1).join(".");
            return field ? `${field}: ${e.msg}` : e.msg;
          })
          .join(", ");
      }
    }

    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

export default apiRequest;