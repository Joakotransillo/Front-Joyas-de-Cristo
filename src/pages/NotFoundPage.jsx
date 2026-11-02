import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-lg text-slate-600">Página no encontrada</p>
      <Link to="/" className="mt-4 text-sm font-medium text-slate-900 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
