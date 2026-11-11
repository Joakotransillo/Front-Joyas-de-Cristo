import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';
import './ProtectedRoute.css';

const ROLES_VALIDOS = Object.freeze([
  'DIRECTOR',
  'CONSEJERO',
  'SECRETARIA',
  'CONQUISTADOR'
]);
const ROLES_VALIDOS_SET = new Set(ROLES_VALIDOS);

/**
 * Verifica la sesión en el backend y, opcionalmente, limita el acceso por rol.
 * rolesPermitidos acepta una lista de roles; si se omite, permite todos los roles válidos.
 */
export default function ProtectedRoute({ rolesPermitidos, children }) {
  const location = useLocation();
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState({ tipo: 'verificando', usuario: null });

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();
    const token = window.localStorage.getItem('token');

    if (!token) {
      setEstado({ tipo: 'sin-sesion', usuario: null });
      return () => {
        cancelado = true;
        controller.abort();
      };
    }

    setEstado({ tipo: 'verificando', usuario: null });
    api.get('/auth/me', { signal: controller.signal })
      .then(({ data }) => {
        if (cancelado) return;

        const usuario = data?.usuario;
        if (!usuario || !ROLES_VALIDOS_SET.has(usuario.rol)) {
          setEstado({ tipo: 'sin-sesion', usuario: null });
          return;
        }

        setEstado({ tipo: 'autenticado', usuario });
      })
      .catch((error) => {
        if (cancelado || error?.code === 'ERR_CANCELED') return;

        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          setEstado({ tipo: 'sin-sesion', usuario: null });
          return;
        }

        setEstado({
          tipo: 'error',
          usuario: null,
          mensaje: 'No pudimos verificar tu sesión. Revisá la conexión con el servidor e intentá de nuevo.'
        });
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [intento]);

  if (estado.tipo === 'verificando') {
    return (
      <main className="protected-route__screen" role="status" aria-live="polite">
        <span className="protected-route__spinner" aria-hidden="true" />
        <p>Verificando tu sesión...</p>
      </main>
    );
  }

  if (estado.tipo === 'sin-sesion') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (estado.tipo === 'error') {
    return (
      <main className="protected-route__screen">
        <section className="protected-route__message" role="alert">
          <h1>No pudimos validar el acceso</h1>
          <p>{estado.mensaje}</p>
          <button type="button" onClick={() => setIntento((actual) => actual + 1)}>
            Intentar de nuevo
          </button>
        </section>
      </main>
    );
  }

  const rolesPermitidosEfectivos = rolesPermitidos === undefined
    ? ROLES_VALIDOS
    : Array.isArray(rolesPermitidos)
      ? rolesPermitidos.filter((rol) => ROLES_VALIDOS_SET.has(rol))
      : [];
  const tienePermiso = rolesPermitidosEfectivos.includes(estado.usuario.rol);

  if (!tienePermiso) {
    return (
      <main className="protected-route__screen">
        <section className="protected-route__message" role="alert">
          <h1>Acceso restringido</h1>
          <p>Tu cuenta tiene el rol {estado.usuario.rol}, que no está habilitado para esta sección.</p>
          <Link to="/login">Volver al inicio de sesión</Link>
        </section>
      </main>
    );
  }

  return children || <Outlet context={{ usuario: estado.usuario }} />;
}