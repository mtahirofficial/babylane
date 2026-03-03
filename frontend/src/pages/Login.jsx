import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import Alert from "../components/Alert";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login } = useAuth()
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false)
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/login", { email, password });
            const accessToken = res.data?.data?.accessToken;
            if (accessToken) {
                login(accessToken, res.data?.data?.user)
                setMessage("Login successful!");
                navigate("/");
            } else {
                setError(true);
                setMessage("No access token received");
            }
        } catch (err) {
            setError(true)
            setMessage(err.response?.data?.message || err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Login</h2>

            {message &&
                <Alert
                    type={error ? "error" : "success"}
                    message={message}
                    onClose={() => {
                        setMessage("")
                        setError(false)
                    }}
                />
            }

            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    type="email"
                    placeholder="your.mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    required
                />

                <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    required
                />

                <button type="submit" className="btn btn-primary auth-btn">
                    Login
                </button>
            </form>
            <p className="auth-switch">
                Don't have an account? <Link to="/signup" className="switch-link">Signup</Link>
            </p>
        </div>

    );
};

export default Login;
