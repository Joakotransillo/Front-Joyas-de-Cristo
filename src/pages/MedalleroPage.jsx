import { useEffect, useState } from 'react';
import { Medal, RefreshCw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Parche from '../components/Parche';
import { obtenerPerfil } from '../services/authService';
import './EspecialidadesPage.css';
import './MedalleroPage.css';

function fechaCorta(valor) {
  if (!valor) return '';
  const fecha = new Date(String(valor).slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha).replace('.', '');
}

/**
 * Medallero: lo que el conquistador ganó. Por ahora muestra los parches de especialidades completadas;
 * las medallas por logros (avance del cuadernillo, avanzada, etc.) se suman cuando se definan sus reglas.
 */
export default function MedalleroPage() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    obtenerPerfil()
      .then((usuario) => { if (activo) setPerfil(usuario); })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar tu medallero. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  if (cargando || error || !perfil) {
    return (
      <AppShell perfil={perfil}>
        <div className="esp esp--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="esp-spinner" aria-hidden="true" />
              <p>Cargando tu medallero...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir el medallero</h1>
              <p role="alert">{error || 'No encontramos los datos de tu cuenta.'}</p>
              <button type="button" className="esp-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const parches = (Array.isArray(perfil.especialidades) ? perfil.especialidades : [])
    .map((item) => ({ ...item, completada: true }))
    .sort((a, b) => String(b.fecha_completado || '').localeCompare(String(a.fecha_completado || '')));

  return (
    <AppShell perfil={perfil}>
      <div className="esp med">
        <header className="esp-head">
          <h1>Medallero</h1>
          <p>Todo lo que fuiste ganando en el club.</p>
        </header>

        <section className="med-section" aria-labelledby="med-medallas">
          <h2 id="med-medallas">Medallas</h2>
          <div className="med-soon">
            <span className="med-soon__icon"><Trophy size={22} aria-hidden="true" /></span>
            <div>
              <strong>Muy pronto</strong>
              <p>Acá vas a ver las medallas por tus logros: el avance del cuadernillo, la clase avanzada y más.</p>
            </div>
          </div>
        </section>

        <section className="med-section" aria-labelledby="med-parches">
          <h2 id="med-parches">
            Parches de especialidades
            <small>{parches.length}</small>
          </h2>
          {parches.length === 0 ? (
            <div className="esp-empty">
              <Medal size={22} aria-hidden="true" />
              <p>
                Todavía no tenés parches. Elegí una en <Link to="/especialidades">Especialidades</Link> y,
                cuando tu consejero la apruebe, aparece acá.
              </p>
            </div>
          ) : (
            <ul className="esp-grid">
              {parches.map((item) => (
                <li key={item.id}>
                  <Link className="esp-item" to={'/especialidades/' + item.id}>
                    <Parche especialidad={item} />
                    <strong>{item.nombre}</strong>
                    {item.fecha_completado && <small>{fechaCorta(item.fecha_completado)}</small>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
