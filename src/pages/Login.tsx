import React, { useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export default function Login(){
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handle = async (e:React.FormEvent)=>{
    e.preventDefault();
    try{ await signInWithEmailAndPassword(auth, email, password); nav('/'); }
    catch(e:any){ setError(e.message); }
  };

  const handleGoogle = async ()=>{
    try{ await signInWithPopup(auth, googleProvider); nav('/'); }
    catch(e:any){ setError(e.message); }
  };

  const handleResetPassword = async ()=>{
    await Swal.fire({
       title: 'Esqueci a senha',
       input: 'text',
       inputLabel: 'Informe o email para recuperação de senha',
       inputValue: '',
       confirmButtonText: 'Enviar',
       cancelButtonText: 'Cancelar',
       showCancelButton: true,
       showLoaderOnConfirm: true,
      preConfirm: async (email) => {
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
          console.error(error);
          toast.error("Ocorreu um erro no envio do email.");
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      }
    });
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: 900 }}>
      <div className="row g-0">
        <div className="col-md-6 p-4 d-flex flex-column justify-content-center align-items-center text-center">
          <img src={'/logo.png'} alt="OxeViajei" className="mb-3" style={{ width: 230, height: 160 }} />
          <h3 className="mb-3">Entrar</h3>
          {error && <div className="alert alert-danger w-100">{error}</div>}
          <form onSubmit={handle} className="w-100" style={{ maxWidth: 300 }}>
            <input className="form-control mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" className="form-control mb-2" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="btn btn-primary w-100 mb-2">Entrar</button>
          </form>
          <div className="text-center mb-2">ou</div>
          <button className="btn btn-outline-danger w-100" style={{ maxWidth: 300 }} onClick={handleGoogle}>
            Continuar com Google
          </button>
          <div className="mt-3">Novo? <Link to="/signup">Cadastre-se</Link></div>
          <button className="mt-2 btn btn-link p-0" onClick={handleResetPassword}>
            Esqueci a senha
          </button>
        </div>

        <div className="col-md-6 p-4 border-start d-none d-md-flex flex-column justify-content-center">
          <h4>Bem-vindo ao <span className="text-primary">OxeViajei</span></h4>
          <p className="text-muted">Organize viagens, contas e registre pagamentos em equipe de forma simples e prática.</p>
        </div>
      </div>
    </div>
  );
}
