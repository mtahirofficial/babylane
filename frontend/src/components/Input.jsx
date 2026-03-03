import React from 'react'

const Input = ({ label, type = "text", min, max, value, name, onChange }) => {
    return (
        <label className="form-label">
            {label}
            <input
                autoComplete="off"
                className="input-field"
                type={type}
                value={value}
                name={name}
                onChange={onChange}
                min={min}
                max={max}
            />
        </label>

    )
}

export default Input