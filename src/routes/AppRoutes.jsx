import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

const ROLES_PLATAFORMA = ['DIRECTOR', 'CONSEJERO', 'SECRETARIA', 'CONQUISTADOR'];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-cuenta" element={<RegisterPage />} />

      {/* Las vistas privadas validan la sesión y el rol contra el backend. */}
      <Route element={<ProtectedRoute rolesPermitidos={ROLES_PLATAFORMA} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Ruta 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}