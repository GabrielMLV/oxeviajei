import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import Swal from "sweetalert2";
import CurrencyInput from "react-currency-input-field";
import {
  FaMoneyBillWave,
  FaClock,
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlusCircle,
  FaUserCircle,
  FaPlane,
  FaRoute,
} from "react-icons/fa"; // Exemplo de uso de ícones (React Icons)

export default function ViagemDetalhes() {
  const { id } = useParams();
  const viagemId = id as string;
  const [viagem, setViagem] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState(0);
  const { user } = useAuth();

  const alertError = (msg: string) => {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: msg,
    });
  };

  // 🔹 Carrega viagem e contas
  useEffect(() => {
    if (!viagemId) return;

    // Carregar dados da viagem (para saber quem criou)
    const viagemRef = doc(db, "viagens", viagemId);
    getDoc(viagemRef).then((snap) => {
      if (snap.exists()) setViagem({ id: snap.id, ...snap.data() });
    });

    // Observar contas em tempo real
    const q = query(collection(db, `viagens/${viagemId}/contas`));
    const unsub = onSnapshot(q, (snap) =>
      setContas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => unsub();
  }, [viagemId]);

  const criarConta = async () => {
    if (!user) return alertError("É necessário estar logado.");
    if (viagem?.criadoPor !== user.uid)
      return alertError("Somente o criador da viagem pode adicionar contas.");
    if (!titulo.trim() || !valor || valor <= 0)
      return alertError("Preencha título e valor corretamente.");

    await addDoc(collection(db, `viagens/${viagemId}/contas`), {
      titulo: titulo.trim(),
      descricao: "",
      valorTotal: Number(valor),
      valorPago: 0,
      status: "pendente",
      criadoPor: user?.uid || null,
      criadoPorNome: user?.displayName || user?.email || "Usuário",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    setTitulo("");
    setValor(0);
    Swal.fire("Sucesso!", "Conta criada com sucesso!", "success");
  };

  const abrirPagamento = async (conta: any) => {
    const { value: amount } = await Swal.fire({
      title: "Valor a pagar",
      input: "number",
      inputLabel: "Informe o valor a pagar",
      inputValue: 0,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
    });

    if (!amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0)
      return Swal.fire("Erro", "Informe um valor válido", "error");

    try {
      await runTransactionOperation(conta, num);
      Swal.fire("Sucesso!", "Pagamento registrado", "success");
    } catch (e: any) {
      console.error(e);
      Swal.fire("Erro", e.message, "error");
    }
  };

  const runTransactionOperation = async (conta: any, amount: number) => {
    const contaRef = doc(db, `viagens/${viagemId}/contas/${conta.id}`);
    const pagamentosCol = collection(
      db,
      `viagens/${viagemId}/contas/${conta.id}/pagamentos`
    );
    const pagamentoRef = doc(pagamentosCol);

    await runTransaction(db, async (t) => {
      const snap = await t.get(contaRef);
      if (!snap.exists()) throw new Error("Conta não encontrada");

      const data: any = snap.data();
      const atualPago = Number(data.valorPago || 0);
      const total = Number(data.valorTotal || 0);
      const novoPago = atualPago + amount;

      let novoStatus = "pendente";
      if (novoPago >= total) novoStatus = "quitada";
      else if (novoPago > 0) novoStatus = "parcial";

      // registrar pagamento
      t.set(pagamentoRef, {
        valor: amount,
        usuarioId: user?.uid || null,
        usuarioNome: user?.displayName || user?.email || "Usuário",
        data: serverTimestamp(),
      });

      // atualizar conta
      t.update(contaRef, {
        valorPago: novoPago,
        status: novoStatus,
        atualizadoEm: serverTimestamp(),
      });
    });
  };

  const statusMap = {
    aberta: {
      text: "Aberta",
      class: "badge bg-warning text-dark",
      icon: <FaExclamationTriangle className="me-1" />,
    },
    parcial: {
      text: "Parcialmente Paga",
      class: "badge bg-info text-dark",
      icon: <FaMoneyBillWave className="me-1" />,
    },
    quitada: {
      text: "Quitada",
      class: "badge bg-success",
      icon: <FaCheckCircle className="me-1" />,
    },
  };

  const ehCriador = user && viagem?.criadoPor === user.uid;

  return (
    <div className="card p-4 shadow-lg border-0">
      <div className="d-flex align-items-center mb-3 border-bottom pb-3">
        <FaRoute className="text-primary me-3" size={30} />
        <div>
          <h3 className="mb-0 text-dark">
            Viagem: {viagem?.nome.toUpperCase() ?? "---"}
          </h3>
          {viagem && (
            <div
              className="text-muted d-flex align-items-center"
              style={{ fontSize: 14 }}
            >
              <FaUserCircle className="me-1" />
              Criado por: {viagem.nomeCriador ?? "---"}
            </div>
          )}
        </div>
      </div>

      {/* 2. FORMULÁRIO DE NOVA CONTA (Apenas para o Criador) */}
      {ehCriador && (
        <div className="mb-4 p-3 bg-light rounded shadow-sm">
          <h5 className="mb-3 text-secondary">
            <FaPlusCircle className="me-2" /> Adicionar Nova Conta
          </h5>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              placeholder="Título da conta (Ex: Gasolina, Feira...)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <CurrencyInput
              id="valor"
              name="input-valor"
              className="form-control"
              placeholder="R$ 0,00"
              intlConfig={{ locale: "pt-BR", currency: "BRL" }}
              defaultValue={0}
              decimalsLimit={2}
              prefix="R$"
              onValueChange={(value) => setValor(Number(value))}
            />
            <button
              className="btn btn-primary text-nowrap"
              onClick={criarConta}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <h4 className="mt-2 mb-3 border-bottom pb-2 text-secondary">
        Contas e Pagamentos
      </h4>

      <div className="accordion" id="contasPagamentosAccordion">
        {contas.length === 0 && (
          <div className="alert alert-info text-center">
            Nenhuma conta registrada.
          </div>
        )}

        {contas.map((c) => {
          const statusInfo = statusMap[c.status] || statusMap.aberta;

          return (
            <div key={c.id} className="accordion-item mb-2 shadow-sm">
              <h2 className="accordion-header" id={`heading-${c.id}`}>
                <button
                  className={`accordion-button collapsed d-flex justify-content-between align-items-center ${
                    c.status === "quitada" ? "bg-light-success" : ""
                  }`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse-${c.id}`}
                  aria-expanded="false"
                  aria-controls={`collapse-${c.id}`}
                >
                  <div className="d-flex align-items-center flex-grow-1 me-3">
                    <div className="d-flex flex-column align-items-start me-4 flex-shrink-0">
                      {" "}
                      {/* flex-shrink-0 evita que encolha demais */}
                      <strong
                        className="h5 mb-1 text-dark text-truncate"
                        style={{ maxWidth: "180px" }}
                      >
                        {c.titulo}
                      </strong>
                      <span className={statusInfo.class}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>

                    <div className="text-start me-auto">
                      <div className="text-dark">
                        **Total: R$ {Number(c.valorTotal).toFixed(2)}**
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Pago: R$ {Number(c.valorPago || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center flex-shrink-0">
                    <button
                      disabled={c.status === "quitada"}
                      className={`btn btn-sm text-nowrap ${
                        c.status === "quitada"
                          ? "btn-outline-secondary"
                          : "btn-success"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirPagamento(c);
                      }}
                      style={{
                        pointerEvents: c.status === "quitada" ? "none" : "auto",
                        marginRight: "10px",
                      }} // Garantia extra para o click
                    >
                      Registrar Pagamento
                    </button>
                  </div>
                </button>
              </h2>

              <div
                id={`collapse-${c.id}`}
                className="accordion-collapse collapse"
                aria-labelledby={`heading-${c.id}`}
                data-bs-parent="#contasPagamentosAccordion"
              >
                <div className="accordion-body p-3 bg-light">
                  <h6 className="mb-3 text-secondary border-bottom pb-1">
                    Pagamentos Registrados para {c.titulo}
                  </h6>
                  <PagamentosList viagemId={viagemId} contaId={c.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PagamentosList({
  viagemId,
  contaId,
}: {
  viagemId: string;
  contaId: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const q = query(
      collection(db, `viagens/${viagemId}/contas/${contaId}/pagamentos`)
    );
    const unsub = onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => unsub();
  }, [viagemId, contaId]);

  return (
    <div className="list-group">
      {items.length === 0 && (
        <div className="text-muted p-3 text-center border rounded">
          Nenhum pagamento registrado ainda. 😴
        </div>
      )}

      {items.map((it) => (
        <div
          key={it.id}
          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center shadow-sm mb-2"
        >
          <div className="d-flex align-items-center me-3">
            <FaMoneyBillWave className="text-success me-3" size={24} />

            <div>
              <h5 className="mb-0 text-success">
                R$ {Number(it.valor).toFixed(2)}
              </h5>
              <small className="text-muted">Valor Pago</small>
            </div>
          </div>

          <div className="text-end">
            <div className="d-flex align-items-center justify-content-end mb-1">
              <FaUser className="text-primary me-2" size={14} />
              <strong className="text-dark">{it.usuarioNome}</strong>
            </div>

            <div
              className="d-flex align-items-center justify-content-end text-muted"
              style={{ fontSize: 13 }}
            >
              <FaClock className="me-1" size={12} />
              <span>
                {it.data?.toDate
                  ? it.data.toDate().toLocaleString("pt-BR")
                  : "Data Indisponível"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
