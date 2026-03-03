import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/cards/Card";
import { useSettings } from "../context/SettingsContext";

export default function OrdersList() {
    const { currency } = useSettings()
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/orders").then(res => setOrders(res.data));
    }, []);

    const handleOrderCreate = () => { navigate("add") }

    return (
        <div className="page-container">
            <PageHeader title="Orders" onPrimaryClick={handleOrderCreate} primaryLabel="Add Order" />
            {/* <div className="card">
                <table className="theme-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
                                <td>#{o.id}</td>
                                <td>{o.customerName}</td>
                                <td>${o.totalAmount}</td>
                                <td>{o.status}</td>
                                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}
            <Card className={"no-pad"}>
                <table className="order-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-orders">No orders found</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.customer.name}</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>{currency}{order.total}</td>
                                    <td>
                                        <div className="badge badge-muted">{order.status}</div>
                                    </td>
                                    <td>
                                        <div className="order-actions">
                                            <button className="btn view">View</button>
                                            <button className="btn edit">Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
