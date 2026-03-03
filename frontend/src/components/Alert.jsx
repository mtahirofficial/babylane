// components/Alert.jsx
import React from "react";

const Alert = ({ type = "success", message, onClose }) => {
    return (
        <div className={`alert alert-${type}`}>
            <span>{message}</span>
            <button className="alert-close" onClick={onClose}>×</button>
        </div>
    );
};

export default Alert;
