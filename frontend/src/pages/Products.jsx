import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "../components/ProductCard";
import PageHeader from "../components/PageHeader";

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("active");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    navigate("/products/add");
  };

  const getStatusMeta = (product) => {
    const normalizedStatus = (product?.status || "").toLowerCase();
    const isPublished = product?.published === true || normalizedStatus === "publish";
    const isDeleted = normalizedStatus === "trash" || normalizedStatus === "deleted";
    const isActive = !isDeleted && (isPublished || normalizedStatus === "active");

    if (isDeleted) return "deleted";
    if (isActive) return "active";
    return "draft";
  };

  const filteredProducts =
    selectedFilter === "all"
      ? products
      : products.filter((product) => getStatusMeta(product) === selectedFilter);

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "deleted", label: "Deleted" },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Products" onPrimaryClick={handleAddProduct} primaryLabel="Add Product" />
      <div className="product-filters">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`filter-btn ${selectedFilter === tab.key ? "filter-btn--active" : ""}`}
            onClick={() => setSelectedFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <svg
            className="empty-image"
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="No products"
          >
            <rect x="20" y="20" width="200" height="140" rx="16" fill="#F8FAFC" />
            <rect x="38" y="42" width="164" height="96" rx="12" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="54" y="58" width="58" height="58" rx="8" fill="#E2E8F0" />
            <path d="M74 86l10 10 20-22" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
            <rect x="124" y="64" width="56" height="8" rx="4" fill="#CBD5E1" />
            <rect x="124" y="80" width="44" height="8" rx="4" fill="#E2E8F0" />
            <rect x="124" y="96" width="36" height="8" rx="4" fill="#E2E8F0" />
            <circle cx="184" cy="118" r="22" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M175 118h18M184 109v18" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="empty-text">No products found.</p>
          <p className="empty-subtext">
            {products.length === 0
              ? "Add new products to see them here."
              : `No ${selectedFilter} products found.`}
          </p>
          <button
            className="btn btn-primary empty-btn-width"
            onClick={handleAddProduct}
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductPage;
