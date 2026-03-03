import React, { useState } from "react";
import { Plus } from "lucide-react"; // modern icon
// import { FaPlus } from "react-icons/fa6";


const TagInput = ({ values, onChange, placeholder }) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (inputValue.trim() !== "") {
            onChange([...values, inputValue.trim()]);
            setInputValue("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const removeTag = (tag) => {
        onChange(values.filter((v) => v !== tag));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Input Row */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    background: "#fafafa",
                    border: "1px solid #e5e7eb",
                    padding: "8px 12px",
                    borderRadius: "10px",
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    placeholder={placeholder}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "14px",
                    }}
                />

                <button
                    type="button"
                    onClick={handleAdd}
                    style={{
                        background: "#3b82f6",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "0.2s",
                    }}
                >
                    {/* <FaPlus size={30} /> */}
                    <Plus size={18} color="#fff" />
                </button>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {values.map((tag, index) => (
                    <div
                        key={index}
                        style={{
                            background: "#eef2ff",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                    >
                        {tag}
                        <span
                            onClick={() => removeTag(tag)}
                            style={{
                                cursor: "pointer",
                                fontWeight: "bold",
                                color: "#6366f1",
                            }}
                        >
                            ×
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TagInput;
