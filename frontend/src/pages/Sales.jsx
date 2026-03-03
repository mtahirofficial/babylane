import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "../components/PageLayout";
import Card from "../components/cards/Card";
import api from "../utils/api";
import { useSettings } from "../context/SettingsContext";

const PERIODS = ["day", "week", "month", "year", "custom"];

function formatDateInput(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function Sales() {
    const { currency } = useSettings();
    const today = useMemo(() => formatDateInput(new Date()), []);

    const [period, setPeriod] = useState("day");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [report, setReport] = useState({
        items: [],
        totals: {
            totalQuantity: 0,
            totalPurchase: 0,
            totalSales: 0,
            profitLoss: 0
        }
    });

    const fetchReport = async (selectedPeriod = period) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({ period: selectedPeriod });
            if (selectedPeriod === "custom") {
                params.set("startDate", startDate);
                params.set("endDate", endDate);
            }

            const res = await api.get(`/orders/sales-report?${params.toString()}`);
            setReport(res.data || { items: [], totals: {} });
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load sales report");
            setReport({
                items: [],
                totals: {
                    totalQuantity: 0,
                    totalPurchase: 0,
                    totalSales: 0,
                    profitLoss: 0
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (period !== "custom") {
            fetchReport(period);
        }
    }, [period]);

    const totalPurchase = Number(report?.totals?.totalPurchase || 0);
    const totalSales = Number(report?.totals?.totalSales || 0);
    const totalProfit = Number(report?.totals?.profitLoss || 0);

    return (
        <PageLayout title="Sales" subtitle="Track sold products by period with purchase, sales, and profit/loss">
            <Card>
                <div className="sales-filters">
                    <div className="sales-filter-buttons">
                        {PERIODS.map((p) => (
                            <button
                                type="button"
                                key={p}
                                className={`btn ${period === p ? "btn-primary" : "btn-light"}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p[0].toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>

                    {period === "custom" && (
                        <div className="sales-custom-dates">
                            <div className="sales-date-field">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="sales-date-field">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <button type="button" className="btn btn-primary" onClick={() => fetchReport("custom")}>
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            <div className="cards-grid">
                <Card>
                    <div className="sales-total-label">Total Purchase</div>
                    <div className="sales-total-value">{currency}{totalPurchase.toFixed(2)}</div>
                </Card>
                <Card>
                    <div className="sales-total-label">Total Sales</div>
                    <div className="sales-total-value">{currency}{totalSales.toFixed(2)}</div>
                </Card>
                <Card>
                    <div className="sales-total-label">Profit / Loss</div>
                    <div className={`sales-total-value ${totalProfit >= 0 ? "sales-profit" : "sales-loss"}`}>
                        {currency}{totalProfit.toFixed(2)}
                    </div>
                </Card>
            </div>

            <Card className="no-pad">
                {loading ? (
                    <div className="state-text">Loading sales report...</div>
                ) : error ? (
                    <div className="state-text">{error}</div>
                ) : report.items.length === 0 ? (
                    <div className="state-text">No sold products in the selected period.</div>
                ) : (
                    <table className="theme-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Qty Sold</th>
                                <th>Purchase Price</th>
                                <th>Sale Price</th>
                                <th>Purchase Total</th>
                                <th>Sales Total</th>
                                <th>Profit / Loss</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.items.map((item) => (
                                <tr key={item.key}>
                                    <td>{item.title}</td>
                                    <td>{item.sku || "-"}</td>
                                    <td>{item.quantity}</td>
                                    <td>{currency}{Number(item.purchasePrice || 0).toFixed(2)}</td>
                                    <td>{currency}{Number(item.salePrice || 0).toFixed(2)}</td>
                                    <td>{currency}{Number(item.purchaseTotal || 0).toFixed(2)}</td>
                                    <td>{currency}{Number(item.saleTotal || 0).toFixed(2)}</td>
                                    <td className={Number(item.profitLoss || 0) >= 0 ? "sales-profit" : "sales-loss"}>
                                        {currency}{Number(item.profitLoss || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colSpan="2">Totals</th>
                                <th>{report?.totals?.totalQuantity || 0}</th>
                                <th>-</th>
                                <th>-</th>
                                <th>{currency}{totalPurchase.toFixed(2)}</th>
                                <th>{currency}{totalSales.toFixed(2)}</th>
                                <th className={totalProfit >= 0 ? "sales-profit" : "sales-loss"}>
                                    {currency}{totalProfit.toFixed(2)}
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </Card>
        </PageLayout>
    );
}

