import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/cards/Card";
import PageLayout from "../components/PageLayout";
import ProductPicker from "../components/ProductPicker";
import Dropdown from "../components/Dropdown";
import { useSettings } from "../context/SettingsContext";
import Input from "../components/Input";
import StickyFooter from "../components/StickyFooter";
import { useToast } from "../context/ToastContext";

export default function OrderCreate() {
    const navigate = useNavigate();
    const { toast } = useToast()
    const { currency } = useSettings()

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("")
    const [options, setOptions] = useState([])
    const [order, setOrder] = useState({
        notes: "",
        customer: {
            name: "",
            phone: "",
            email: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: ""
        },
        items: []
    })

    useEffect(() => {
        const opt = products.map(p => ({ label: p.title, value: p.id, Variants: p.Variants?.map(v => ({ label: v.title, value: v.id })) }))
        setOptions([...opt])
    }, [products])

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            const doSearch = async () => {
                try {
                    if (!search) {
                        setProducts([]);
                        return;
                    }
                    const res = await api.get(`/products?q=${encodeURIComponent(search)}`, { signal: controller.signal });
                    setProducts(res.data);
                } catch (err) {
                    // ignore cancellations
                    if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
                    console.error("Search error:", err);
                }
            };
            doSearch();
        }, 400); // wait 400ms after user stops typing

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search]);

    const addItem = ids => {
        const selectedIds = (Array.isArray(ids) ? ids : [ids]).map(String);

        setOrder(order => {
            let items = [...order.items];

            selectedIds.forEach((id) => {
                // Try to find product by product id first
                let product = products.find((p) => String(p.id) === id || p.id === id);
                let variant = null;

                if (product) {
                    // If the id is actually a variant id inside this product, use that variant
                    const variantsList = product.variants || product.Variants || [];
                    const matchedVariant = variantsList.find((v) => String(v.id) === id);
                    variant = matchedVariant || variantsList[0] || null;
                } else {
                    // Maybe the id is a variant id; find the product that contains this variant
                    const productWithVariant = products.find((p) => (p.variants || p.Variants || []).some((v) => String(v.id) === id));
                    if (productWithVariant) {
                        product = productWithVariant;
                        variant = (productWithVariant.variants || productWithVariant.Variants || []).find((v) => String(v.id) === id) || null;
                    }
                }

                if (!product) return;

                const exists = variant
                    ? items.some((i) => String(i.variantId) === String(variant?.id))
                    : items.some((i) => String(i.productId) === String(product.id));
                if (exists) return;

                const price = variant?.price ?? product.price ?? 0;
                items.push({
                    productId: product.id,
                    variantId: variant?.id ?? null,
                    title: variant ? `${product.title} - ${variant.title}` : product.title,
                    price,
                    quantity: 1,
                    total: price,
                });
            });

            // Remove any items whose product/variant is NOT in the selected ids
            items = items.filter((i) => selectedIds.includes(String(i.productId)) || (i.variantId !== null && selectedIds.includes(String(i.variantId))));
            return {
                ...order,
                items: [...items]
            }
        })
    };

    const updateQty = (idx, qty) => {
        setOrder(order => {
            const items = [...order.items];
            items[idx].quantity = qty;
            items[idx].total = qty * items[idx].price;
            return {
                ...order,
                items: [...items]
            }
        })
    };

    const total = order.items.reduce((s, i) => s + i.total, 0);

    const onChangeCustomer = e => {
        setOrder(order => ({
            ...order,
            customer: {
                ...order.customer,
                [e.target.name]: e.target.value
            }
        }));
    }


    const saveOrder = async () => {
        const payload = {
            ...order,
        };
        console.log("payload", payload);
        try {
            const response = await api.post("/orders", payload);
            if (response.data) {
                toast(response.data.message)
            }

        } catch (error) {
            console.log("error", error.message);
            toast(error.message, "error")
        }
        // navigate("/orders");
    };

    return (
        <>
            <PageLayout
                title="Orders"
                subtitle="Manage all your orders efficiently"
                action={{ text: "Save", onClick: saveOrder }}
            >

                <div className="lr-container">
                    <div className="lr-left">
                        {/* Add Products */}
                        <Card title={"Add Products"}>
                            <Dropdown
                                search={search}
                                setSearch={setSearch}
                                options={options}
                                onSelect={addItem}
                            />
                        </Card>

                        {/* ORDER SUMMARY */}
                        <Card title={"Order Summary"}>
                            {
                                order.items.length ? <>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "45%" }}>Product</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {order.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.title}</td>
                                                    <td>
                                                        <Input label={""} min={1} type="number" name={idx} value={item.quantity} onChange={(e) => updateQty(idx, Number(e.target.value))} />
                                                    </td>
                                                    <td>{currency}{item.price}</td>
                                                    <td>{currency}{item.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="oc-total">
                                        <span>Total</span>
                                        <b>{currency}{total}</b>
                                    </div>
                                </> : "Add items to place order"
                            }
                        </Card>
                    </div>
                    <div className="lr-right">
                        <Card title={"Order Notes"}>
                            <div className="oc-form">
                                <label>Notes</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={order.notes}
                                    onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                                />
                            </div>
                        </Card>
                        <Card className="" title={"Customer Info"}>
                            <div className="oc-form">
                                <Input label={"Name"} name={"name"} value={order.customer.name} onChange={onChangeCustomer} />
                                <Input label={"Phone"} name={"phone"} value={order.customer.phone} onChange={onChangeCustomer} />
                                <Input label={"Email"} name={"email"} value={order.customer.email} onChange={onChangeCustomer} />
                                <Input label={"Adress"} name={"address"} value={order.customer.address} onChange={onChangeCustomer} />
                                <Input label={"City"} name={"city"} value={order.customer.city} onChange={onChangeCustomer} />
                                <Input label={"State"} name={"state"} value={order.customer.state} onChange={onChangeCustomer} />
                                <Input label={"Postal Code"} name={"postalCode"} value={order.customer.postalCode} onChange={onChangeCustomer} />
                                <Input label={"Country"} name={"country"} value={order.customer.country} onChange={onChangeCustomer} />
                            </div>

                        </Card>
                    </div>
                </div>
            </PageLayout>
            <StickyFooter>
                <div className="footer-actions">
                    <button className="btn btn-primary" onClick={saveOrder}>
                        Save
                    </button>
                    <button className="btn btn-light" onClick={() => navigate("/orders")}>
                        Cancel
                    </button>
                </div>
            </StickyFooter>
        </>
    );

}