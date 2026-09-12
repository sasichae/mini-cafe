const API_URL = import.meta.env.VITE_API_URL || "";

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

export async function getProducts(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_URL}/api/products${qs}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createProduct(product) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateProduct(id, product) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function createOrder(items) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getOrders(params = {}) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_URL}/api/orders${qs}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function getOrderById(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

export async function deleteOrder(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}
