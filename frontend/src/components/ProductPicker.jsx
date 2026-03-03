import { useState } from "react";

export default function ProductPicker({ products }) {
    const [expanded, setExpanded] = useState({});
    const [selected, setSelected] = useState({});

    const toggleExpand = (id) => {
        setExpanded((p) => ({ ...p, [id]: !p[id] }));
    };

    const toggleSelect = (id) => {
        setSelected((p) => ({
            ...p,
            [id]: !p[id]
        }));
    };

    return (
        <div className="p-4 space-y-3">
            {products.map((p) => (
                <div
                    key={p.id}
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                >
                    {/* Product Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selected[p.id] || false}
                                onChange={() => toggleSelect(p.id)}
                            />

                            <img
                                src={p.image}
                                className="w-12 h-12 rounded-md object-cover border"
                            />

                            <div>
                                <p className="font-medium text-gray-800">{p.title}</p>
                                <p className="text-xs text-gray-500">{p.Variants?.length} variants</p>
                            </div>
                        </div>

                        {/* Expand button */}
                        {p.Variants?.length > 1 && (
                            <button
                                onClick={() => toggleExpand(p.id)}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                {expanded[p.id] ? "Hide Variants" : "Show Variants"}
                            </button>
                        )}
                    </div>

                    {/* Variant List */}
                    {expanded[p.id] && (
                        <div className="mt-3 ml-8 space-y-2">
                            {p.Variants.map((v) => (
                                <label
                                    key={v.id}
                                    className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected[v.id] || false}
                                        onChange={() => toggleSelect(v.id)}
                                    />

                                    <div>
                                        <p className="text-sm font-medium">{v.title}</p>
                                        <p className="text-xs text-gray-500">
                                            SKU: {v.sku} — Price: {v.price}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
