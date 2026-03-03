import { createContext, useState, useEffect, useContext, useRef } from "react";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const rightPanelRef = useRef(null);

    const [currency, setCurrency] = useState("Rs.");

    return (
        <SettingsContext.Provider value={{ currency, rightPanelRef }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
