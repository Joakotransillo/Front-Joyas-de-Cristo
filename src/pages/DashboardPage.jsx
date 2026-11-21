import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { CircleUserRound } from 'lucide-react';
import DashboardConquiPage from './DashboardConquiPage';

export default function DashboardPage() {
  const contexto = useOutletContext() || {};
  if (contexto.usuario?.rol === 'CONQUISTADOR') {
    return <DashboardConquiPage />;
  }
  // El inicio del consejero es el panel de su unidad.
  if (contexto.usuario?.rol === 'CONSEJERO') {
    return <Navigate to="/unidad" replace />;
  }

  return (
    <main className="min-h-screen bg-[#f5f0df] p-6 sm:p-8">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel Principal</h1>
          <p className="mt-1 text-sm text-slate-500">Bienvenido al sistema de gestión.</p>
        </div>
        <Link
          to="/configuracion"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d7c9a8] bg-[#fffdf5] px-4 text-sm font-semibold text-[#31523f] shadow-sm transition hover:border-[#9eaa8e] hover:bg-white"
        >
          <CircleUserRound size={17} aria-hidden="true" />
          Configuración
        </Link>
      </div>
    </main>
  );
}