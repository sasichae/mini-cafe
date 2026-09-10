const API_URL = import.meta.env.VITE_API_URL || "";

export async function getProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
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

export async function getOrders() {
  const res = await fetch(`${API_URL}/api/orders`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getOrderById(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}
