const API_URL = import.meta.env.VITE_API_URL || "";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody.message || message;
    } catch {}
    throw new Error(message);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function getProducts(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_URL}/api/products${qs}`);
  return handleResponse(res);
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const data = await handleResponse(res);
  return data.data;
}

export async function createProduct(product) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(product),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function updateProduct(id, product) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function createOrder(customerName, items) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ customer_name: customerName, items }),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function getOrders(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_URL}/api/orders${qs}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getOrderById(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function deleteOrder(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getAdminStats() {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function getActiveOrders() {
  const res = await fetch(`${API_URL}/api/admin/active-orders`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function getMe() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return data.data;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await handleResponse(res);
  return data.data;
}
