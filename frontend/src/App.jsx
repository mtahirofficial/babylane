import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Products from "./pages/Products";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import "./theme.css";
import "./App.css";
import OrdersList from "./pages/OrdersList";
import OrderCreate from "./pages/OrderCreate";
import ProductAdd from "./pages/ProductAdd";
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Sales from "./pages/Sales";
import { useSettings } from "./context/SettingsContext";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // JWT stored on login
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { rightPanelRef } = useSettings()
  return (
    <div className="panel-container">
      <div className="left-panel">
        <Sidebar />
      </div>
      <div className="right-panel" ref={rightPanelRef}>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/add"
            element={
              <ProtectedRoute>
                <ProductAdd />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductAdd />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/add"
            element={
              <ProtectedRoute>
                <OrderCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </div>
  );
}

export default App;
