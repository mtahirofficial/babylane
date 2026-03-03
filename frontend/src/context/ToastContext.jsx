import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toastData, setToastData] = useState(null);

    const toast = useCallback((message, type = "success") => {
        console.log({ message, type });

        setToastData({ message, type });
        // auto close after 3 sec
        setTimeout(() => {
            setToastData(null);
        }, 3000);
    }, []);
    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {toastData && (
                <Toast
                    message={toastData.message}
                    type={toastData.type}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
