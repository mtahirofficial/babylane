import React from "react";
import { useSettings } from "../context/SettingsContext";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
    const { currency } = useSettings();

    const image =
        product.featured_image ||
        (Array.isArray(product.gallery_images) ? product.gallery_images[0] : null) ||
        product.mainImage ||
        product.image ||
        "/placeholder.png";

    const price = Number(product.price);
    const hasPrice = !Number.isNaN(price) && price > 0;
    const stock = Number(product.stock_quantity);
    const safeStock = Number.isNaN(stock) ? 0 : stock;
    const summary = (product.short_description || "")
        .replace(/<[^>]*>/g, "")
        .trim();

    const siteUrl = "https://babylane.pk";
    const normalizedStatus = (product.status || "").toLowerCase();
    const isPublished = product.published === true || normalizedStatus === "publish";
    const isDeleted = normalizedStatus === "trash" || normalizedStatus === "deleted";
    const isActive = !isDeleted && (isPublished || normalizedStatus === "active");
    const badge = isDeleted
        ? { label: "Deleted", className: "product-badge--deleted" }
        : isActive
            ? { label: "Active", className: "product-badge--active" }
            : { label: "Draft", className: "product-badge--draft" };
    const productPath = isPublished
        ? `/product/${product.slug}`
        : `/wp-admin/post.php?post=${product.id}&action=edit`;
    const productUrl = `${siteUrl}${productPath}`;

    return (
        <div className="product-card">
            <Link to={`${product.id}`}>
                <img
                    src={image}
                    alt={product.title || "Product"}
                    className="product-image"
                />
            </Link>
            <div className="product-info">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <a href={productUrl} target="_blank" rel="noreferrer">
                        <h3 className="product-name">{product.title}</h3>
                    </a>
                    <a
                        href={`${siteUrl}/wp-admin/post.php?post=${product.id}&action=edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                    >
                        Edit
                    </a>
                </div>
                <span className={`product-badge ${badge.className}`}>{badge.label}</span>
                <p className="product-sku">SKU: {product.sku}</p>
                <p className="product-price">{hasPrice ? `${currency}${price.toFixed(2)}` : "Price: N/A"}</p>
                <p className="product-inventory">
                    Inventory: {safeStock} ({product.stock_status || "unknown"})
                </p>
                {/* <p className="product-tags">Status: {product.status || "draft"}</p> */}
                {/* {summary ? <p className="product-weight">{summary}</p> : null} */}
            </div>
        </div>
    );
};

export default ProductCard;
