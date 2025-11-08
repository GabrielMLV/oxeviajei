import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import Swal from "sweetalert2";

export default function Admin() {
  const { isAdmin } = useAuth();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [viagens, setViagens] = useState<any[]>([]);

  const alertError = (msg: string) => {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: msg,
    });
  };

  useEffect(() => {
    const q = query(collection(db, "viagens"));
    const unsub = onSnapshot(q, (snap) =>
      setViagens(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => unsub();
  }, []);

  const criar = async () => {
    if (!isAdmin) return alertError("Apenas admins");
    if (!nome.trim()) return alertError("Informe nome");
    await addDoc(collection(db, "viagens"), {
      nome: nome.trim(),
      descricao: descricao.trim(),
      criadoEm: serverTimestamp(),
    });
    setNome("");
    setDescricao("");
  };

  const remover = async (id: string) => {
    if (!isAdmin) return alertError("Apenas admins");
    if (!confirm("Excluir viagem?")) return;
    await deleteDoc(doc(db, "viagens", id));
  };

  return (
    <div className="card p-4">
      <h3>Painel Admin</h3>
      <div className="row g-2 my-3">
        <div className="col">
          <input
            className="form-control"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="col">
          <input
            className="form-control"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" onClick={criar}>
            Criar
          </button>
        </div>
      </div>
      <div className="list-group">
        {viagens.map((v) => (
          <div
            key={v.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{v.nome}</strong>
              <div className="text-muted">{v.descricao}</div>
            </div>
            <div>
              <a
                className="btn btn-sm btn-outline-primary me-2"
                href={`/viagem/${v.id}`}
              >
                Abrir
              </a>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => remover(v.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
