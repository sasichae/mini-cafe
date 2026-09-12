import { useState, useEffect } from "react";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const params = { page: currentPage, limit: 12 };
      if (debouncedSearch) params.q = debouncedSearch;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      try {
        const result = await getProducts(params);
        if (!cancelled) {
          setProducts(result.data);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "ไม่สามารถโหลดเมนูได้");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, minPrice, maxPrice, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  if (loading && products.length === 0) return <Loading />;

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <h1 className="page-title">เมนูเครื่องดื่ม</h1>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="ค้นหาเมนู..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="price-filter">
          <input
            type="number"
            className="price-input"
            placeholder="ราคาต่ำสุด"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
          />
          <span>-</span>
          <input
            type="number"
            className="price-input"
            placeholder="ราคาสูงสุด"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
          />
        </div>
        {(search || minPrice || maxPrice) && (
          <button className="btn btn-secondary" onClick={clearFilters}>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {pagination && (
        <p className="result-count">
          พบ {pagination.total} รายการ
        </p>
      )}

      {products.length === 0 ? (
        <p className="empty-message">ไม่พบสินค้าที่ค้นหา</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => setCurrentPage(pagination.page - 1)}
          >
            ก่อนหน้า
          </button>
          <span className="page-info">
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setCurrentPage(pagination.page + 1)}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
