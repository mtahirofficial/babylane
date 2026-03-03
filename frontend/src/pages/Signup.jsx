import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import Alert from "../components/Alert";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, seterror] = useState(false)
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/register", { "user": { name, email, password } });
            setMessage("Signup successful!");
            navigate("/login");
        } catch (err) {
            seterror(true)
            setMessage(err.response?.data?.error || "Signup failed");
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Signup</h2>

            {message &&
                <Alert
                    type={error ? "error" : "success"}
                    message={message}
                    onClose={() => {
                        setMessage("")
                        seterror(false)
                    }} />
            }

            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                />

                <button type="submit" className="btn btn-primary auth-btn">
                    Signup
                </button>
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/login" className="switch-link">Login</Link>
            </p>
        </div>

    );
};

export default Signup;
