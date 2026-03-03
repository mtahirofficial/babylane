import React from "react";

export default function PageLayout({ title, subtitle, children, action }) {
    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    {title && <h1 className="page-title">{title}</h1>}
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
                {action && <div className="page-actions">
                    <button className="btn btn-primary" onClick={action.onClick}>{action.text}</button></div>}
            </header >
            <main className="page-content">{children}</main>
        </div >
    );
}
