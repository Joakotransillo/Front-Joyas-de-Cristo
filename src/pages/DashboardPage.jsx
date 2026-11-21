import { Navigate, useOutletContext } from 'react-router-dom';
import DashboardConquiPage from './DashboardConquiPage';
import DirectorDashboardPage from './DirectorDashboardPage';

// El inicio depende del rol: conquistador, consejero (su unidad) o dirección y secretaría (métricas).
export default function DashboardPage() {
  const contexto = useOutletContext() || {};
  if (contexto.usuario?.rol === 'CONQUISTADOR') {
    return <DashboardConquiPage />;
  }
  if (contexto.usuario?.rol === 'CONSEJERO') {
    return <Navigate to="/unidad" replace />;
  }
  return <DirectorDashboardPage />;
}
