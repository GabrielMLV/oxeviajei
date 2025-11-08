import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';

export default function ViagemDetalhes() {
  const { id } = useParams();
  const viagemId = id as string;
  const [viagem, setViagem] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState(0);
  const { user } = useAuth();

  const alertError = (msg: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: msg,
    });
  };

  // 🔹 Carrega viagem e contas
  useEffect(() => {
    if (!viagemId) return;

    // Carregar dados da viagem (para saber quem criou)
    const viagemRef = doc(db, 'viagens', viagemId);
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
    if (!user) return alertError('É necessário estar logado.');
    if (viagem?.criadoPor !== user.uid)
      return alertError('Somente o criador da viagem pode adicionar contas.');
    if (!titulo.trim() || !valor || valor <= 0)
      return alertError('Preencha título e valor corretamente.');

    await addDoc(collection(db, `viagens/${viagemId}/contas`), {
      titulo: titulo.trim(),
      descricao: '',
      valorTotal: Number(valor),
      valorPago: 0,
      status: 'pendente',
      criadoPor: user?.uid || null,
      criadoPorNome: user?.displayName || user?.email || 'Usuário',
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    setTitulo('');
    setValor(0);
    Swal.fire('Sucesso!', 'Conta criada com sucesso!', 'success');
  };

  const abrirPagamento = async (conta: any) => {
    const { value: amount } = await Swal.fire({
      title: 'Valor a pagar',
      input: 'number',
      inputLabel: 'Informe o valor a pagar',
      inputValue: 0,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
    });

    if (!amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0)
      return Swal.fire('Erro', 'Informe um valor válido', 'error');

    try {
      await runTransactionOperation(conta, num);
      Swal.fire('Sucesso!', 'Pagamento registrado', 'success');
    } catch (e: any) {
      console.error(e);
      Swal.fire('Erro', e.message, 'error');
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
      if (!snap.exists()) throw new Error('Conta não encontrada');

      const data: any = snap.data();
      const atualPago = Number(data.valorPago || 0);
      const total = Number(data.valorTotal || 0);
      const novoPago = atualPago + amount;

      let novoStatus = 'pendente';
      if (novoPago >= total) novoStatus = 'quitada';
      else if (novoPago > 0) novoStatus = 'parcial';

      // registrar pagamento
      t.set(pagamentoRef, {
        valor: amount,
        usuarioId: user?.uid || null,
        usuarioNome: user?.displayName || user?.email || 'Usuário',
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
  const ehCriador = user && viagem?.criadoPor === user.uid;

  return (
    <div className="card p-4">
      <h3>Viagem: {viagem?.nome || viagemId}</h3>
      {viagem && (
        <div className="text-muted mb-3" style={{ fontSize: 14 }}>
          Criado por: {viagem.nomeCriador || viagem.criadoPor}
        </div>
      )}

      {/* 🔹 Criar conta apenas se for o criador */}
      {ehCriador && (
        <div className="mb-3">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Título da conta"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <input
              className="form-control"
              type="number"
              placeholder="Valor da Conta"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
            />
            <button className="btn btn-primary" onClick={criarConta}>
              Adicionar Conta
            </button>
          </div>
        </div>
      )}

      <div className="list-group">
        {contas.map((c) => (
          <div
            key={c.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{c.titulo}</strong>
              <div className="text-muted">
                Total: R$ {Number(c.valorTotal).toFixed(2)} — Pago: R${' '}
                {Number(c.valorPago || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 13 }}>
                Status: <strong>{c.status}</strong>
              </div>
            </div>
            <div>
              <button
                className="btn btn-sm btn-success me-2"
                onClick={() => abrirPagamento(c)}
              >
                Registrar Pagamento
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h5>Pagamentos</h5>
        {contas.map((c) => (
          <div key={c.id} id={`pagamentos-${c.id}`} className="mb-3">
            <h6>{c.titulo}</h6>
            <PagamentosList viagemId={viagemId} contaId={c.id} />
          </div>
        ))}
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
    <div>
      {items.length === 0 && <div className="text-muted">Sem pagamentos.</div>}
      {items.map((it) => (
        <div
          key={it.id}
          className="border p-2 rounded mb-2 d-flex justify-content-between align-items-center"
        >
          <div>
            <div>
              <strong>R$ {Number(it.valor).toFixed(2)}</strong> — {it.usuarioNome}
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {it.data?.toDate ? it.data.toDate().toLocaleString() : '-'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
