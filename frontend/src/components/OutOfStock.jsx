import React from "react";

const OutOfStock = ({ products }) => {
    return (
        <div className="card">
            <h3 className="card-title">Out of Stock Products</h3>
            <ul className="list">
                {products.map((p) => (
                    <li key={p.id} className="list-item out-of-stock">
                        {p.name} - SKU: {p.sku}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default OutOfStock;
