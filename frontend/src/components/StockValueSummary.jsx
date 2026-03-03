import React from "react";
import { useSettings } from "../context/SettingsContext";

const StockValueSummary = ({ cost, price, profit }) => {
    const { currency } = useSettings()
    return (
        <div className="cards-grid">
            <div className="stat-card">
                <h4 className="stat-title">Total Cost</h4>
                <p className="stat-value">{currency}{cost}</p>
            </div>
            <div className="stat-card">
                <h4 className="stat-title">Total Price</h4>
                <p className="stat-value">{currency}{price}</p>
            </div>
            <div className="stat-card">
                <h4 className="stat-title">Potential Profit</h4>
                <p className="stat-value">{currency}{profit}</p>
            </div>
        </div>
    );
};

export default StockValueSummary;
