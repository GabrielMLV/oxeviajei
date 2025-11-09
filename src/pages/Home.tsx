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
  FaPlusCircle,
  FaRegSadCry,
  FaRoute,
  FaUserCircle,
  FaUserFriends,
} from "react-icons/fa";
import Swal from "sweetalert2";
import CurrencyInput from "react-currency-input-field";
import ReactDOM from "react-dom/client";

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

    // 1. Cria a query com a cláusula where
    const q = query(
      collection(db, "viagens"),
      where("participantes", "array-contains", user.uid)
    );

    // 2. Assina o snapshot para receber as atualizações em tempo real
    const unsub = onSnapshot(q, (snap) => {
      // Mapeia apenas os documentos filtrados
      const minhasViagens = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setViagens(minhasViagens);
    });

    return () => unsub();
  }, [user]); // Dependência em user

  const criarViagem = async () => {
    if (!user) return alert("Faça login");
    // Referência para armazenar o valor do CurrencyInput
    // Referência para armazenar o valor do Orçamento
    const orcamentoRef = { valor: 0 };

    const { value: formValues } = await Swal.fire({
      title: "Detalhes da Nova Viagem",
      width: "800px",
      html:
        `<input id="swal-input-titulo" required={true} style="width: 92% !important; box-sizing: border-box !important;" class="swal2-input form-control-sm" placeholder="Nome da Viagem">` +
        `<textarea id="swal-input-descricao" required={true} style="width: 92% !important; box-sizing: border-box !important;" class="swal2-textarea form-control-sm" placeholder="Descrição da Viagem (Opcional)"></textarea>` +
        `<span id="react-orcamento-container" style="display: grid; margin-bottom: 1.25em;"></span>`,

      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Criar Viagem",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3f068a",

      didOpen: () => {
        const container = document.getElementById("react-orcamento-container");
        if (container) {
          ReactDOM.createRoot(container).render(
            <CurrencyInput
              id="swal-input-orcamento"
              name="input-orcamento"
              className="swal2-input form-control-sm"
              placeholder="Orçamento R$ 0,00 (Opcional)"
              intlConfig={{ locale: "pt-BR", currency: "BRL" }}
              decimalsLimit={2}
              prefix="R$"
              onValueChange={(value) => {
                orcamentoRef.valor = Number(value) || 0;
              }}
            />
          );
        }
      },

      didClose: () => {
        const container = document.getElementById("react-orcamento-container");
        if (container) {
          ReactDOM.createRoot(container).unmount();
        }
      },

      preConfirm: () => {
        const titulo = (
          document.getElementById("swal-input-titulo") as HTMLInputElement
        ).value;
        const descricao = (
          document.getElementById("swal-input-descricao") as HTMLTextAreaElement
        ).value;
        const orcamentoNumerico = orcamentoRef.valor;

        if (!titulo.trim()) {
          Swal.showValidationMessage("O nome da viagem é obrigatório!");
          return false;
        }

        return {
          titulo: titulo.trim(),
          orcamento: orcamentoNumerico,
          descricao: descricao.trim(),
        };
      },
    });
    if (formValues) {
      const { titulo, orcamento, descricao } = formValues;
      const codigo = generateCode(6);
      await addDoc(collection(db, "viagens"), {
        nome: titulo.trim(),
        descricao: descricao ?? "---",
        orcamentoInicial: orcamento ?? null,
        codigo,
        criadoPor: user.uid,
        nomeCriador: user.displayName,
        criadoEm: serverTimestamp(),
        participantes: [user.uid],
      });

      Swal.fire({
        title: `Viagem "${titulo}" criada com sucesso!`,
        html: `Seu código de acesso é: 
                   <div class="mt-3">
                       <strong style="color: #3f068a; font-size: 1.5rem;">${codigo}</strong>
                   </div>
                   Compartilhe-o com seus amigos!`,
        icon: "success",
        confirmButtonText: "Entendi",
        confirmButtonColor: "#3f068a",
      });
    }
  };

  const entrarPorCodigo = async () => {
    // 1. VERIFICAÇÃO INICIAL (Usuário Logado)
    if (!user) {
      return Swal.fire({
        icon: "error",
        title: "Acesso Negado",
        text: "Você precisa estar logado para entrar em uma viagem.",
        confirmButtonColor: "#3f068a",
      });
    }

    // 2. INPUT DO CÓDIGO (SweetAlert2)
    const { value: codigo } = await Swal.fire({
      title: "Informe o código da viagem",
      input: "text",
      inputLabel: "Código de Acesso",
      inputPlaceholder: "Ex: OXE1234",
      showCancelButton: true,
      confirmButtonText: "Entrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3f068a",
      inputValidator: (value) => {
        if (!value) {
          return "Você precisa informar um código.";
        }
      },
    });

    if (!codigo) return; // Se o usuário cancelar ou o input for vazio

    const codigoLimpo = codigo.trim().toUpperCase();

    try {
      // 3. PROCURA VIAGEM COM ESSE CÓDIGO NO FIRESTORE
      const q = query(
        collection(db, "viagens"),
        where("codigo", "==", codigoLimpo)
      );
      const snap = await getDocs(q);

      // 4. CÓDIGO INVÁLIDO
      if (snap.empty) {
        return Swal.fire({
          icon: "error",
          title: "Código Inválido",
          text: "Nenhuma viagem encontrada com este código.",
          confirmButtonColor: "#dc3545", // Cor de erro Bootstrap
        });
      }

      const docSnap = snap.docs[0];
      const v = docSnap.data() as any;

      // 5. JÁ PARTICIPA
      if ((v.participantes || []).includes(user.uid)) {
        return Swal.fire({
          icon: "info",
          title: "Você já está aqui!",
          text: `Você já faz parte da viagem "${v.nome}".`,
          confirmButtonColor: "#ffc107", // Cor de info Bootstrap
        });
      }

      // 6. ADICIONA PARTICIPANTE
      await updateDoc(doc(db, "viagens", docSnap.id), {
        participantes: arrayUnion(user.uid),
      });

      // 7. SUCESSO
      Swal.fire({
        icon: "success",
        title: "Bem-vindo(a)!",
        text: `Agora você faz parte da viagem: ${v.nome}`,
        confirmButtonColor: "#3f068a",
      });
    } catch (error) {
      console.error("Erro ao entrar na viagem:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de Sistema",
        text: "Ocorreu um erro inesperado ao tentar entrar na viagem.",
        confirmButtonColor: "#dc3545",
      });
    }
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
              className="btn btn-success d-flex align-items-center"
              onClick={criarViagem}
            >
              <FaPlusCircle className="me-1" /> Criar Nova Viagem
            </button>

            <button
              className="btn btn-outline-primary d-flex align-items-center"
              onClick={entrarPorCodigo}
            >
              <FaUserFriends className="me-1" /> Participar de uma Viagem
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
                  Você não participa de nenhuma viagem.
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
