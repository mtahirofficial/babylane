// src/pages/ProductAddShopify.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import TagInput from "../components/TagInput";
import VariantTable from "../components/VariantTable";
import { generateCombinations, mapVariantPayload, mergeVariants } from "../utils/variantUtils";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";

export default function ProductAdd() {
    const navigate = useNavigate();
    const { toast } = useToast()

    const [product, setProduct] = useState({
        title: "",
        description: "",
        sku: "",
        costPrice: "",
        dc: "",
        salePrice: "",
        markupPercentage: "",
        autoPriceEnabled: true,
        status: "active",
        tags: [],
        mainImage: "",
        // single: false
    });

    const [option1Name, setOption1Name] = useState("");
    const [option2Name, setOption2Name] = useState("");
    const [option3Name, setOption3Name] = useState("");

    const [option1Values, setOption1Values] = useState([]);
    const [option2Values, setOption2Values] = useState([]);
    const [option3Values, setOption3Values] = useState([]);

    const [variants, setVariants] = useState([]);
    const { id: productIdParam } = useParams();
    const [productNotFound, setProductNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // cleanup object URL when preview changes/unmounts
    useEffect(() => {
        return () => {
            if (imagePreview) {
                try { URL.revokeObjectURL(imagePreview); } catch (e) { }
            }
        };
    }, [imagePreview]);

    // If URL has id param, fetch product for edit
    useEffect(() => {
        if (!productIdParam) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get(`/products/${productIdParam}`);
                const p = res.data?.product || res.data;

                if (!p) {
                    setProductNotFound(true);
                    return;
                }
                if (cancelled) return;

                /* =========================
                   BASIC PRODUCT DATA
                ========================= */
                setProduct(prev => ({
                    ...prev,
                    title: p.title || "",
                    description: p.description || "",
                    sku: p.sku || "",
                    costPrice: p.costPrice ?? "",
                    dc: p.dc ?? "",
                    salePrice: p.salePrice ?? "",
                    markupPercentage: p.markupPercentage ?? "",
                    autoPriceEnabled:
                        typeof p.autoPriceEnabled === "boolean"
                            ? p.autoPriceEnabled
                            : true,
                    status: p.status || "active",
                    tags: Array.isArray(p.tags) ? p.tags : [],
                    mainImage: p.mainImage || "",
                    single: !!p.single
                }));

                if (p.mainImage) setImagePreview(p.mainImage);

                /* =========================
                   OPTIONS (FROM ProductOptions)
                ========================= */
                const productOptions = p.ProductOptions || [];

                const colorOption = productOptions.find(o => o.position === 1);
                const sizeOption = productOptions.find(o => o.position === 2);
                const thirdOption = productOptions.find(o => o.position === 3);

                // option names
                setOption1Name(colorOption?.name || "");
                setOption2Name(sizeOption?.name || "");
                setOption3Name(thirdOption?.name || "");

                // option values
                setOption1Values(
                    colorOption?.ProductOptionValues?.map(v => v.value) || []
                );
                setOption2Values(
                    sizeOption?.ProductOptionValues?.map(v => v.value) || []
                );
                setOption3Values(
                    thirdOption?.ProductOptionValues?.map(v => v.value) || []
                );

                /* =========================
                   VARIANTS
                ========================= */
                const variantsList = p.Variants || p.variants || [];

                const mappedVariants = variantsList.map(v => ({
                    id: v.id,
                    title:
                        v.title ||
                        [v.option1, v.option2, v.option3].filter(Boolean).join(" / "),
                    active: v.active,
                    sku: v.sku || "",
                    barcode: v.barcode || "",
                    option1: v.option1 || null,
                    option2: v.option2 || null,
                    option3: v.option3 || null,
                    cost: v.cost ?? 0,
                    price: v.price ?? 0,
                    markupPercentage: v.markupPercentage ?? 0,
                    autoPriceEnabled:
                        typeof v.autoPriceEnabled === "boolean"
                            ? v.autoPriceEnabled
                            : false,
                    stock: v.stock ?? 0,
                    lowStockThreshold: v.lowStockThreshold ?? null,
                    weight: v.weight ?? 0,
                    weightUnit: v.weightUnit || "kg",
                    requiresShipping: !!v.requiresShipping,
                    image: v.image || null
                }));

                setVariants(mappedVariants);

            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setProductNotFound(true);
                } else {
                    console.error('Error fetching product', err);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [productIdParam]);

    // Generate combinations
    const combos = useMemo(() => {
        return generateCombinations([
            option1Values.length ? option1Values : null,
            option2Values.length ? option2Values : null,
            option3Values.length ? option3Values : null
        ]);
    }, [option1Values, option2Values, option3Values]);

    useEffect(() => {
        setVariants(prev => mergeVariants(combos, prev, product));
    }, [combos]);

    const onProductChange = (key, value) => setProduct(prev => ({ ...prev, [key]: value }));

    const onChangeVariant = (index, updated) => {
        setVariants(prev => {
            const copy = [...prev];
            copy[index] = updated;
            return copy;
        });
    };

    const onRemoveVariant = (index) => setVariants(prev =>
        prev.map((v, i) =>
            i === index ? { ...v, active: !v.active } : v
        )
    );

    // Auto price
    useEffect(() => {
        const dc = parseFloat(product.dc || 0);
        const cost = parseFloat(product.costPrice || 0);
        const markup = parseFloat(product.markupPercentage || 0);
        const aditional = parseFloat(product.aditional || 0);
        const sale = Math.round(cost + (cost * markup / 100) + dc + aditional);
        onProductChange("salePrice", isNaN(sale) ? "" : sale);
    }, [product.costPrice, product.markupPercentage, product.dc, product.aditional]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            /* =========================
               PRODUCT FORM DATA
            ========================= */
            const form = new FormData();

            if (imageFile) {
                form.append("file", imageFile);
            }

            form.append("title", product.title || "");
            form.append("description", product.description || "");
            form.append("sku", product.sku || "");
            form.append("costPrice", String(product.costPrice || 0));
            form.append("salePrice", String(product.salePrice || 0));
            form.append("markupPercentage", String(product.markupPercentage || 0));
            form.append("dc", String(product.dc || 0));
            form.append("autoPriceEnabled", String(product.autoPriceEnabled));
            form.append("status", product.status || "active");
            form.append("tags", JSON.stringify(product.tags || []));
            form.append("single", String(!!product.single));

            if (!imageFile && product.mainImage) {
                form.append("mainImage", product.mainImage);
            }

            /* =========================
               OPTIONS
            ========================= */
            form.append("option1Name", option1Name || "");
            form.append("option2Name", option2Name || "");
            form.append("option3Name", option3Name || "");

            form.append("option1Values", JSON.stringify(option1Values || []));
            form.append("option2Values", JSON.stringify(option2Values || []));
            form.append("option3Values", JSON.stringify(option3Values || []));

            /* =========================
               CREATE / UPDATE PRODUCT
            ========================= */
            const res = productIdParam
                ? await api.put(`/products/${productIdParam}`, form)
                : await api.post("/products", form);

            const savedProduct = res.data?.product || res.data;
            const pid = savedProduct.id || productIdParam;

            /* =========================
               VARIANTS
            ========================= */
            const frontendVariantIds = variants.filter(v => v.id).map(v => v.id);

            /* =========================
               VARIANT DELETE (IMPORTANT)
            ========================= */
            if (productIdParam && frontendVariantIds.length) {
                await api.post(`/variants/sync`, {
                    productId: pid,
                    keepVariantIds: frontendVariantIds
                });
            }

            // const newVariants = variants
            //     .filter(v => !v.id)
            //     .map(v => ({
            //         productId: pid,
            //         title: [v.option1, v.option2, v.option3].filter(Boolean).join(" / "),
            //         active: v.active,
            //         sku: v.sku || "",
            //         option1: v.option1 || null,
            //         option2: v.option2 || null,
            //         option3: v.option3 || null,
            //         cost: Number(v.cost || 0),
            //         price: Number(v.price || 0),
            //         markupPercentage: Number(v.markupPercentage || 0),
            //         autoPriceEnabled: Boolean(v.autoPriceEnabled),
            //         stock: Number(v.stock || 0),
            //         weight: Number(v.weight || 0),
            //         weightUnit: v.weightUnit || "kg",
            //         requiresShipping: Boolean(v.requiresShipping),
            //         lowStockThreshold: v.lowStockThreshold ?? null,
            //         image: v.image || null
            //     }));

            // const updatedVariants = variants
            //     .filter(v => v.id)
            //     .map(v => ({
            //         id: v.id,
            //         title: [v.option1, v.option2, v.option3].filter(Boolean).join(" / "),
            //         active: v.active,
            //         sku: v.sku || "",
            //         option1: v.option1 || null,
            //         option2: v.option2 || null,
            //         option3: v.option3 || null,
            //         cost: Number(v.cost || 0),
            //         price: Number(v.price || 0),
            //         markupPercentage: Number(v.markupPercentage || 0),
            //         autoPriceEnabled: Boolean(v.autoPriceEnabled),
            //         stock: Number(v.stock || 0),
            //         weight: Number(v.weight || 0),
            //         weightUnit: v.weightUnit || "kg",
            //         requiresShipping: Boolean(v.requiresShipping),
            //         lowStockThreshold: v.lowStockThreshold ?? null,
            //         image: v.image || null
            //     }));

            const newVariants = variants
                .filter(v => !v.id)
                .map(v =>
                    mapVariantPayload(v, {
                        productId: pid
                    })
                );

            const updatedVariants = variants
                .filter(v => v.id)
                .map(v =>
                    mapVariantPayload(v, {
                        id: v.id
                    })
                );

            if (newVariants.length) {
                await api.post("/variants", { variants: newVariants });
            }

            if (updatedVariants.length) {
                await Promise.all(
                    updatedVariants.map(v => api.put(`/variants/${v.id}`, v))
                );
            }
            toast(productIdParam ? "Updated successfully!" : "Added successfully!", "success");
            if (!productIdParam) {
                navigate("/products");
            }
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || err.message || "Save failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const isEdit = Boolean(productIdParam);

    if (productNotFound) {
        return (
            <div className="page-container">
                <PageHeader title="Product Not Found" />
                <div className="card">
                    <h3 className="card-title">Product not found</h3>
                    <p className="text-muted">Product with id {productIdParam} was not found.</p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={() => navigate('/products')}>Back to Products</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/products/add')}>Create New Product</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <PageHeader title={isEdit ? "Edit Product" : "Add Product"} />

            <form onSubmit={handleSave}>
                {/* Basic Info */}
                <div className="card">
                    <h3 className="card-title">Basic Info</h3>
                    <div className="form-grid">
                        <input className="input-field" placeholder="Product title" value={product.title} onChange={e => onProductChange("title", e.target.value)} required />
                        <textarea className="input-field" placeholder="Description" value={product.description} onChange={e => onProductChange("description", e.target.value)} rows={4} />
                        <div style={{ marginTop: 8 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Upload image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    const f = e.target.files[0] || null;
                                    // revoke previous preview URL if any
                                    if (imagePreview) {
                                        try { URL.revokeObjectURL(imagePreview); } catch (e) { }
                                        setImagePreview(null);
                                    }
                                    setImageFile(f);
                                    if (f) {
                                        const url = URL.createObjectURL(f);
                                        setImagePreview(url);
                                    } else {
                                        setImagePreview(null);
                                    }
                                }}
                            />
                            {imagePreview && (
                                <div style={{ marginTop: 8 }}>
                                    <img loading="lazy" src={imagePreview} alt="preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
                        <TagInput values={product.tags} onChange={tags => onProductChange("tags", tags)} placeholder="Tags (comma separated)" />
                        {/* <label>
                            <input type="checkbox" checked={product.single} onChange={(e) => onProductChange("single", e.target.checked)} />
                            {" "}Has only default variant
                        </label> */}
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="card" style={{ marginTop: 16 }}>
                    <h3 className="card-title">Pricing & Inventory</h3>
                    <div className="form-grid" style={{ gap: 12 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <input type="number" className="input-field" placeholder="Cost (purchase)" value={product.costPrice} onChange={e => onProductChange("costPrice", e.target.value)} />
                            <input type="number" className="input-field" placeholder="Markup (%)" value={product.markupPercentage} onChange={e => onProductChange("markupPercentage", e.target.value)} />
                            <input type="number" className="input-field" placeholder="Delivery Charges" value={product.dc} onChange={e => onProductChange("dc", e.target.value)} />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <input type="number" className="input-field" placeholder="Additional Margin" value={product.aditional} onChange={e => onProductChange("aditional", e.target.value)} />
                            <input type="number" className="input-field" placeholder="Sale Price" value={product.salePrice} onChange={e => onProductChange("salePrice", e.target.value)} />
                        </div>
                    </div>
                </div>


                {/* Options using TagInput */}
                <div className="card" style={{ marginTop: 16 }}>
                    <h3 className="card-title">Options (up to 3)</h3>
                    <div className="form-grid" style={{ gap: 16 }}>
                        <div>
                            <input type="text" className="input-field" placeholder="Option 1 Name" value={option1Name} onChange={e => setOption1Name(e.target.value)} />
                            <TagInput values={option1Values} onChange={setOption1Values} placeholder="Add values for Option 1" />
                        </div>
                        <div>
                            <input type="text" className="input-field" placeholder="Option 2 Name" value={option2Name} onChange={e => setOption2Name(e.target.value)} />
                            <TagInput values={option2Values} onChange={setOption2Values} placeholder="Add values for Option 2" />
                        </div>
                        <div>
                            <input type="text" className="input-field" placeholder="Option 3 Name" value={option3Name} onChange={e => setOption3Name(e.target.value)} />
                            <TagInput values={option3Values} onChange={setOption3Values} placeholder="Add values for Option 3" />
                        </div>
                        <p className="text-muted" style={{ marginTop: 8 }}>
                            Variants will be generated automatically from the option values added above.
                        </p>
                    </div>
                </div>

                {/* Variants Table */}
                <div style={{ marginTop: 16 }}>
                    {variants.length > 0 ? (
                        <VariantTable variants={variants} onChangeVariant={onChangeVariant} onRemoveVariant={onRemoveVariant} />
                    ) : (
                        <p className="text-muted">No variants generated yet. Add option values above.</p>
                    )}
                </div>


                {/* Save/Cancel */}
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button type="submit" className="btn btn-primary">{loading ? "Saving..." : "Save Product"}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate("/products")}>Cancel</button>
                </div>
            </form >
        </div >
    );
}
