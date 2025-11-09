import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import PrivateRoute from "./PrivateRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Signup from "./pages/Signup";
import { ToastContainer } from "react-toastify";
import ViagemDetalhes from "./pages/ViagemDetalhes";
import {
  FaHome,
  FaSignOutAlt,
  FaUserCircle,
  FaUserShield,
} from "react-icons/fa";

function NavBar() {
  const { user, loading, logout, isAdmin } = useAuth();
  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top mb-4">
      <div className="container py-3">
        <div className="d-flex align-items-center">
          <img
            src={"/logo.png"}
            alt="OxeViajei Logo"
            className="rounded-circle me-2"
            style={{ width: 60, height: 45 }}
          />
          <h1 className="m-0 fs-4 fw-bold text-primary">OxeViajei</h1>
        </div>

        <nav className="d-flex align-items-center">
          {!loading && user ? (
            <div className="d-flex align-items-center gap-3">
              <div className="d-none d-md-flex align-items-center text-secondary me-2">
                {" "}
                {/* Ocultar em telas pequenas */}
                <FaUserCircle className="me-2" size={20} />
                <span className="small fw-semibold">{user.email}</span>
              </div>

              {/* Link: Início */}
              <Link
                to="/"
                className="nav-link text-dark fw-semibold d-flex align-items-center"
              >
                <FaHome className="me-1" /> Início
              </Link>

              {/* Link: Admin (se for admin) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="nav-link text-info fw-semibold d-flex align-items-center"
                >
                  <FaUserShield className="me-1" /> Admin
                </Link>
              )}

              {/* Botão: Sair */}
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                onClick={logout}
              >
                <FaSignOutAlt className="me-1" /> Sair
              </button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div>
      <ToastContainer />
      <NavBar />
      <div className="container">
        <Routes>
          {/* Login e cadastro livres */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Apenas usuários logados acessam */}
          <Route
            path="/"
            element={
              <PrivateRoute adminOnly={false}>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly={true}>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/viagem/:id"
            element={
              <PrivateRoute adminOnly={false}>
                <ViagemDetalhes />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
