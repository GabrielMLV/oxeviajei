import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Informe seu nome");
      return;
    }
    if (password.length < 6) {
      setError("Senha precisa ter >=6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Senhas não conferem");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      toast.success("Sucesso!");
      nav("/");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: 480 }}>
      <div className="p-4">
        <h3>Cadastro</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <input
            className="form-control mb-2"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Confirme a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className="btn btn-success w-100">Criar conta</button>
        </form>
        <div className="mt-2">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
