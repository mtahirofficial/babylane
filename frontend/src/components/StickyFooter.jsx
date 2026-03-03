import React, { useState } from 'react'
import { useSettings } from '../context/SettingsContext';

const StickyFooter = ({ children }) => {
    const { rightPanelRef } = useSettings()
    const [show, setShow] = useState(false)

    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
        rightPanel.addEventListener("scroll", () => {
            const footer = document.querySelector(".sticky-footer")
            if (footer && !show && rightPanel.scrollTop > 10) {
                footer.classList.add("show");
                setShow(true)
            }

            if (footer && show && rightPanel.scrollTop === 0) {
                footer.classList.remove("show");
                setShow(false)
            }
        });
    }

    return (
        <div className='sticky-footer'>
            {children}
        </div>
    )
}

export default StickyFooter