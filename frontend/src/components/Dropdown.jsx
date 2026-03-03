import { useState, useRef, useEffect } from "react";

export default function Dropdown({
    search,
    setSearch,
    placeholder = "Search products...",
    onSelect,
    options = [],
}) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState([])
    const ref = useRef();

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
    }, []);

    const toggle = (value) => {
        let updated;
        if (selected.indexOf(value) > -1) {
            updated = selected.filter((v) => v.toString() !== value.toString());
        } else {
            updated = [...selected, value];
        }
        setSelected([...updated])
        onSelect?.([...updated]);
    };

    return (
        <div className="ddc-wrapper" ref={ref}>
            <div className="product-search">
                <input
                    className="input-field"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => {
                        if (!open) setOpen(true);
                        setSearch(e.target.value);
                    }}
                    onFocus={() => { if (!open && selected.length) setOpen(true); }}
                />
            </div>

            {open && (
                <div className="ddc-menu">
                    {/* PRODUCT ROW */}
                    {options.map((opt) => {
                        const checked = selected.indexOf(opt.value) > -1;
                        return (
                            <div key={opt.value} className="ddc-product">
                                <div
                                    className="ddc-item"
                                    onClick={() => toggle(opt.value)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            toggle(opt.value);
                                        }}
                                    />
                                    <span>{opt.label}</span>
                                </div>

                                {/* VARIANTS LIST */}
                                {opt.Variants && opt.Variants.length > 0 && (
                                    <div className="ddc-variants">
                                        {opt.Variants.map((v) => {
                                            const variantChecked = selected.indexOf(v.value) > -1;
                                            return (
                                                <div
                                                    key={v.value}
                                                    className="ddc-item ddc-variant"
                                                    onClick={() => toggle(v.value)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={variantChecked}
                                                        onChange={() => toggle(v.value)}
                                                    />
                                                    <span>{v.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
