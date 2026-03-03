import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOutIcon } from "lucide-react";

export default function Sidebar() {
    const { user, logout } = useAuth()
    const { pathname } = useLocation();

    const menu = [
        { label: "Dashboard", path: "/" },
        { label: "Products", path: "/products" },
        { label: "Orders", path: "/orders" },
        { label: "Sales", path: "/sales" },
    ];

    return (
        <aside className="sidebar">
            {/* TOP */}
            <div className="sidebar-top">
                <div className="sidebar-logo">BabyLane</div>
            </div>

            {/* MENU */}
            <nav className="sidebar-menu">
                {user ? (
                    menu.map((m) => (
                        <Link
                            key={m.path}
                            to={m.path}
                            className={`sidebar-link ${pathname === m.path ? "active" : ""}`}
                        >
                            {m.label}
                        </Link>
                    ))
                ) : (
                    <>
                        <Link to="/login" className="sidebar-link">
                            Login
                        </Link>
                        <Link to="/signup" className="sidebar-link">
                            Sign Up
                        </Link>
                    </>
                )}
            </nav>

            {/* FOOTER */}
            {user && (
                <div className="sidebar-footer">
                    <Link to="/profile" className="sidebar-user">
                        {user.name}
                    </Link>

                    <button className="sidebar-logout" onClick={logout} title="Sign out">
                        <LogOutIcon />
                    </button>
                </div>
            )}
        </aside>
    );
}
