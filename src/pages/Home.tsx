import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function generateCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export default function Home(){
  const { user } = useAuth();
  const [viagens,setViagens] = useState<any[]>([]);

  useEffect(()=>{
    if(!user) return;
    const q = query(collection(db,'viagens')); // we'll filter client side by participation
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d=>({id:d.id, ...(d.data() as any)}));
      const mine = all.filter(v=> (v.participantes || []).includes(user.uid));
      setViagens(mine);
    });
    return ()=>unsub();
  },[user]);
  console.log(user);
  const criarViagem = async ()=>{
    if(!user) return alert('Faça login');
    const nome = prompt('Nome da viagem');
    if(!nome) return;
    const codigo = generateCode(6);
    await addDoc(collection(db,'viagens'), {
      nome: nome.trim(),
      codigo,
      criadoPor: user.uid,
      nomeCriador: user.displayName,
      criadoEm: serverTimestamp(),
      participantes: [user.uid]
    });
    alert('Viagem criada! Código: ' + codigo);
  };

  const entrarPorCodigo = async ()=>{
    if(!user) return alert('Faça login');
    const codigo = prompt('Cole o código da viagem');
    if(!codigo) return;
    // procura viagem com esse código
    const q = query(collection(db,'viagens'), where('codigo','==', codigo.trim().toUpperCase()));
    const snap = await getDocs(q);
    if(snap.empty) return alert('Código inválido');
    const docSnap = snap.docs[0];
    const v = docSnap.data() as any;
    if((v.participantes || []).includes(user.uid)) return alert('Você já participa dessa viagem');
    await updateDoc(doc(db,'viagens',docSnap.id), {
      participantes: arrayUnion(user.uid)
    });
    alert('Agora você faz parte da viagem: ' + v.nome);
  };

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Viagens</h3>
        <div>
          <button className="btn btn-sm btn-primary me-2" onClick={criarViagem}>Criar Viagem</button>
          <button className="btn btn-sm btn-outline-primary" onClick={entrarPorCodigo}>Entrar com código</button>
        </div>
      </div>

      <div className="list-group mt-3">
        {viagens.length === 0 && <div className="text-muted">Você não participa de nenhuma viagem.</div>}
        {viagens.map(v=> (
          <Link key={v.id} to={`/viagem/${v.id}`} className="list-group-item list-group-item-action">{v.nome} <small className="text-muted">Código de acesso <b>({v.codigo})</b></small></Link>
        ))}
      </div>
    </div>
  );
}
