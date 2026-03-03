// src/components/VariantTable.jsx
import React from "react";

/**
 * props:
 * - variants: array
 * - onChangeVariant(index, updatedVariant)
 * - onRemoveVariant(index)
 */
export default function VariantTable({ variants = [], onChangeVariant, onRemoveVariant }) {
    return (
        <div className="card">
            <h3 className="card-title">Variants ({variants.length})</h3>
            <div style={{ overflowX: "auto" }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Variant</th>
                            <th>SKU</th>
                            {/* <th>Cost</th> */}
                            <th>Price</th>
                            <th>Stock</th>
                            {/* <th>Barcode</th> */}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {variants.map((v, i) => (
                            <tr key={v.combKey || i}>
                                <td style={{ minWidth: 180 }}>{v.title}</td>
                                <td><input className="input-field" value={v.sku || ""} onChange={(e) => onChangeVariant(i, { ...v, sku: e.target.value })} /></td>
                                {/* <td><input className="input-field" type="number" value={v.cost} onChange={(e) => onChangeVariant(i, { ...v, cost: parseFloat(e.target.value) })} /></td> */}
                                <td><input className="input-field" type="number" value={v.price} onChange={(e) => onChangeVariant(i, { ...v, price: parseFloat(e.target.value) })} /></td>
                                <td><input className="input-field" type="number" value={v.stock} onChange={(e) => onChangeVariant(i, { ...v, stock: parseInt(e.target.value) })} /></td>
                                {/* <td><input className="input-field" value={v.barcode || ""} onChange={(e) => onChangeVariant(i, { ...v, barcode: e.target.value })} /></td> */}
                                <td>
                                    <button type="button" className="btn btn-secondary" onClick={() => onRemoveVariant(i)}>{v.active ? "Active" : "Draft"}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
