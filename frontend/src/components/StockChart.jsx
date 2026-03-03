import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const StockChart = ({ data }) => {
    return (
        <div className="card">
            <h3 className="card-title">Monthly Stock Movement</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stockIn" fill="#4F46E5" />
                    <Bar dataKey="stockOut" fill="#10B981" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockChart;
