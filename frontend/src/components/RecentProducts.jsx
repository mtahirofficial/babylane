import React from "react";

const RecentProducts = ({ products }) => {
    return (
        <div className="card">
            <h3 className="card-title">Recent Products</h3>
            <ul className="list">
                {products.map((p) => (
                    <li key={p.id} className="list-item">
                        <span className="product-name">{p.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentProducts;
