import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ConfiguracionPage from '../pages/ConfiguracionPage';
import EspecialidadesPage from '../pages/EspecialidadesPage';
import EspecialidadDetallePage from '../pages/EspecialidadDetallePage';
import MedalleroPage from '../pages/MedalleroPage';
import DashboardPage from '../pages/DashboardPage';
import CuadernilloPage from '../pages/CuadernilloPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

const ROLES_PLATAFORMA = ['DIRECTOR', 'CONSEJERO', 'SECRETARIA', 'CONQUISTADOR'];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-cuenta" element={<RegisterPage />} />

      {/* Vistas privadas: sesión y rol validados contra el backend. */}
      <Route element={<ProtectedRoute rolesPermitidos={ROLES_PLATAFORMA} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/perfil" element={<Navigate to="/configuracion" replace />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/especialidades/:id" element={<EspecialidadDetallePage />} />
        <Route path="/medallero" element={<MedalleroPage />} />
      </Route>

      {/* Cuadernillo privado para conquistadores. */}
      <Route element={<ProtectedRoute rolesPermitidos={['CONQUISTADOR']} />}>
        <Route path="/cuadernillo" element={<CuadernilloPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Ruta 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}