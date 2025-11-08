import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './PrivateRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Signup from './pages/Signup';
import { ToastContainer } from 'react-toastify';
import ViagemDetalhes from './pages/ViagemDetalhes';

function NavBar(){
  const { user, loading, logout, isAdmin } = useAuth();
  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <img 
            src={'/logo.png'} 
            alt="OxeViajei" 
            className="rounded" 
            style={{ width: 40, height: 40 }}
          />
          <h1 className="m-0 fs-4">OxeViajei</h1>
        </div>

        <nav>
          {!loading && user ? (
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted small">{user.email}</span>
              <Link to="/" className="nav-link d-inline">Home</Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link d-inline">Admin</Link>
              )}
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>
                Sair
              </button>
            </div>
          ) : null}
        </nav>
      </header>
    </div>
  );
}

export default function App(){
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
        <Route path="/" element={<PrivateRoute adminOnly={false}><Home /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute adminOnly={true}><Admin /></PrivateRoute>} />
        <Route path="/viagem/:id" element={<PrivateRoute adminOnly={false}><ViagemDetalhes /></PrivateRoute>} />

      </Routes>
      </div>
    </div>
  );
}
