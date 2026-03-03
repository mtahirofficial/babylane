import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose = null }) {
    useEffect(() => {
        if (onClose) {
            const timer = setTimeout(() => onClose(), 3000);
            return () => clearTimeout(timer);
        }
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
        </div>
    );
}
