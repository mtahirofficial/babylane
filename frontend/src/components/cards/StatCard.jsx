import React from "react";
import { useNavigate } from "react-router-dom";

const StatCard = ({ title, value, icon, path }) => {
    const navigate = useNavigate()
    
    return (
        <div className="stat-card" onClick={() => { if (path) navigate(`/${path}`) }}>
            <div className="stat-left">
                <h4 className="stat-title">{title}</h4>
                <p className="stat-value">{value}</p>
            </div>
            <div className="stat-icon">{icon}</div>
        </div>
    );
};

export default StatCard;
