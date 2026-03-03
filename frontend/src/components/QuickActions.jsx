import React from "react";

const QuickActions = ({ actions }) => {
    return (
        <div className="card quick-actions">
            {actions.map((action) => (
                <button key={action.label} className="btn btn-primary action-btn" onClick={action.onClick}>
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export default QuickActions;
