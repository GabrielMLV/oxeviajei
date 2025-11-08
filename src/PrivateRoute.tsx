import { useAuth } from "./hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, adminOnly }) {
const { user, isAdmin, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Se rota exigir admin
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}