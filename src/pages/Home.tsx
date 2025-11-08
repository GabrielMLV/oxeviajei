import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  FaCheck,
  FaCopy,
  FaKey,
  FaMoneyBillWave,
  FaPlusCircle,
  FaRegSadCry,
  FaRoute,
  FaUserCircle,
} from "react-icons/fa";

function generateCode(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export default function Home() {
  const { user } = useAuth();
  const [viagens, setViagens] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "viagens")); // we'll filter client side by participation
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const mine = all.filter((v) =>
        (v.participantes || []).includes(user.uid)
      );
      setViagens(mine);
    });
    return () => unsub();
  }, [user]);
  console.log(user);
  const criarViagem = async () => {
    if (!user) return alert("Faça login");
    const nome = prompt("Nome da viagem");
    if (!nome) return;
    const codigo = generateCode(6);
    await addDoc(collection(db, "viagens"), {
      nome: nome.trim(),
      codigo,
      criadoPor: user.uid,
      nomeCriador: user.displayName,
      criadoEm: serverTimestamp(),
      participantes: [user.uid],
    });
    alert("Viagem criada! Código: " + codigo);
  };

  const entrarPorCodigo = async () => {
    if (!user) return alert("Faça login");
    const codigo = prompt("Cole o código da viagem");
    if (!codigo) return;
    // procura viagem com esse código
    const q = query(
      collection(db, "viagens"),
      where("codigo", "==", codigo.trim().toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) return alert("Código inválido");
    const docSnap = snap.docs[0];
    const v = docSnap.data() as any;
    if ((v.participantes || []).includes(user.uid))
      return alert("Você já participa dessa viagem");
    await updateDoc(doc(db, "viagens", docSnap.id), {
      participantes: arrayUnion(user.uid),
    });
    alert("Agora você faz parte da viagem: " + v.nome);
  };

  const [copiedId, setCopiedId] = useState(null);

  const copyCodeToClipboard = (e, code, id) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="container">
      <div className="card p-4 shadow-lg border-0">
        {/* --- 1. CABEÇALHO E AÇÕES --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h3 className="mb-3 mb-md-0 text-primary fw-bold d-flex align-items-center">
            <FaRoute className="me-2" /> Minhas Viagens
          </h3>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={criarViagem}
            >
              <FaPlusCircle className="me-1" /> Criar Nova Viagem
            </button>

            <button
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={entrarPorCodigo}
            >
              <FaKey className="me-1" /> Participar de uma Viagem
            </button>
          </div>
        </div>

        {/* --- 2. LISTA DE VIAGENS --- */}
        <div className="row row-cols-1 g-3">
          {viagens.length === 0 && (
            <div className="col-12">
              <div className="alert alert-light text-center border p-4">
                <FaRegSadCry size={30} className="text-secondary mb-2" />
                <p className="mb-0 text-muted">
                  Você não participa de nenhuma viagem. Crie uma nova ou entre
                  com um código!
                </p>
              </div>
            </div>
          )}

          {viagens.map((v) => (
            <div className="col" key={v.id}>
              <Link
                to={`/viagem/${v.id}`}
                className="card card-body h-100 shadow-sm list-group-item-action text-decoration-none border-0"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title text-dark mb-0">
                    {v.nome.toUpperCase()}
                  </h5>
                  {v.criadorNome && (
                    <small className="text-muted d-flex align-items-center flex-shrink-0">
                      <FaUserCircle className="me-1" /> {v.criadorNome}
                    </small>
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <div className="d-flex align-items-center">
                    <strong className="text-primary me-2">
                      Código de acesso:
                    </strong>
                    <span
                      className="badge bg-light text-dark fw-bold border border-primary p-2"
                      style={{ fontSize: "1em", letterSpacing: "1px" }}
                    >
                      {v.codigo}
                    </span>
                  </div>

                  <button
                    className={`btn btn-sm ${
                      copiedId === v.id ? "btn-success" : "btn-outline-primary"
                    }`}
                    onClick={(e) => copyCodeToClipboard(e, v.codigo, v.id)}
                    title="Copiar código de acesso"
                  >
                    {copiedId === v.id ? (
                      <FaCheck className="me-1" />
                    ) : (
                      <FaCopy className="me-1" />
                    )}
                    {copiedId === v.id ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
