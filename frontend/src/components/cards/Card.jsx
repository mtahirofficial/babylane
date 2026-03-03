import React from "react";

export default function Card({ title, className, children }) {
    return (
        <div className={`card${className ? ` ${className}` : ""}`}>
            {title && <h3 className="card-title">{title}</h3>}
            <div className="card-content">{children}</div>
        </div>
    );
}
