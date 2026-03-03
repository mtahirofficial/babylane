import React from "react";

const ProductTable = ({ products }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                </tr>
            </thead>
            <tbody>
                {products.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.SKU}</td>
                        <td>{p.price}</td>
                        <td>{p.stock}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ProductTable;
