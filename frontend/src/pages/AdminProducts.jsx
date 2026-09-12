import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import Loading from "../components/Loading";

const emptyForm = { name: "", description: "", price: "", image: "" };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getProducts({ limit: 100 });
        if (!cancelled) setProducts(result.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      image: product.image || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          image: form.image || null,
        });
      } else {
        await createProduct({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          image: form.image || null,
        });
      }
      closeForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`ต้องการลบ "${name}" ออกจากรายการ?`)) return;
    try {
      await deleteProduct(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading && products.length === 0) return <Loading />;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="page-title">จัดการสินค้า</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          + เพิ่มสินค้า
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => setError(null)}>ปิด</button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ชื่อสินค้า *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ราคา (บาท) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL รูปภาพ</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>฿{product.price}</td>
                <td className="table-actions">
                  <button className="btn btn-small btn-edit" onClick={() => openEdit(product)}>
                    แก้ไข
                  </button>
                  <button
                    className="btn btn-small btn-delete"
                    onClick={() => handleDelete(product.id, product.name)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
