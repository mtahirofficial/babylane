import React from "react";

export default function PageHeader({ title, onPrimaryClick, primaryLabel = "Add", actions = null }) {
    return (
        <div className="title-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 className="page-title">{title}</h2>
                {actions}
            </div>
            <div>
                {onPrimaryClick && (
                    <button className="btn-primary btn small-btn" onClick={onPrimaryClick}>
                        {primaryLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
