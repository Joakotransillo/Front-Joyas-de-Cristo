import { useEffect, useMemo, useState } from 'react';
import { Medal, RefreshCw, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Parche from '../components/Parche';
import { obtenerPerfil } from '../services/authService';
import { obtenerEspecialidades } from '../services/especialidadesService';
import './EspecialidadesPage.css';

// Ignora mayúsculas y tildes al buscar ("nudos" encuentra "Nudos", "aves" encuentra "Áves").
const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function EspecialidadesPage() {
  const [perfil, setPerfil] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([obtenerEspecialidades(), obtenerPerfil().catch(() => null)])
      .then(([lista, usuario]) => {
        if (!activo) return;
        setEspecialidades(lista);
        setPerfil(usuario);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar las especialidades. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  const esConquistador = perfil?.rol === 'CONQUISTADOR';
  const completadas = especialidades.filter((item) => item.completada).length;

  const grupos = useMemo(() => {
    const texto = normalizar(busqueda.trim());
    const visibles = especialidades.filter((item) => {
      if (filtro === 'mias' && !item.completada) return false;
      if (!texto) return true;
      return normalizar(item.nombre).includes(texto) || normalizar(item.codigo || '').includes(texto);
    });
    const porArea = new Map();
    for (const item of visibles) {
      if (!porArea.has(item.categoria)) porArea.set(item.categoria, []);
      porArea.get(item.categoria).push(item);
    }
    return [...porArea.entries()];
  }, [especialidades, busqueda, filtro]);

  if (cargando || error) {
    return (
      <AppShell perfil={perfil}>
        <div className="esp esp--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="esp-spinner" aria-hidden="true" />
              <p>Cargando especialidades...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir las especialidades</h1>
              <p role="alert">{error}</p>
              <button type="button" className="esp-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell perfil={perfil}>
      <div className="esp">
        <header className="esp-head">
          <h1>Especialidades</h1>
          {esConquistador && (
            <p>
              {completadas === 0
                ? 'Todavía no completaste ninguna. ¡Elegí la primera!'
                : `Completaste ${completadas} de ${especialidades.length}`}
            </p>
          )}
        </header>

        <div className="esp-tools">
          <label className="esp-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar especialidad</span>
            <input
              type="search"
              placeholder="Buscar por nombre o código"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>
          {esConquistador && (
            <div className="esp-filter" role="group" aria-label="Mostrar">
              <button type="button" className={filtro === 'todas' ? 'is-on' : ''} aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
                Todas
              </button>
              <button type="button" className={filtro === 'mias' ? 'is-on' : ''} aria-pressed={filtro === 'mias'} onClick={() => setFiltro('mias')}>
                Mis especialidades
              </button>
            </div>
          )}
        </div>

        {especialidades.length === 0 ? (
          <div className="esp-empty">
            <Medal size={22} aria-hidden="true" />
            <p>Todavía no hay especialidades cargadas. Cuando la dirección las suba, las vas a ver acá.</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="esp-empty">
            <Search size={22} aria-hidden="true" />
            <p>
              {filtro === 'mias' && !busqueda
                ? 'Todavía no completaste ninguna especialidad.'
                : `No encontramos especialidades con "${busqueda}".`}
            </p>
          </div>
        ) : (
          grupos.map(([area, lista]) => (
            <section className="esp-area" key={area} aria-labelledby={'area-' + area}>
              <h2 id={'area-' + area}>
                {area}
                <small>{lista.length}</small>
              </h2>
              <ul className="esp-grid">
                {lista.map((item) => (
                  <li key={item.id}>
                    <Link className="esp-item" to={'/especialidades/' + item.id}>
                      <Parche especialidad={item} />
                      <strong>{item.nombre}</strong>
                      {item.codigo && <small>{item.codigo}</small>}
                      <span className="sr-only">{item.completada ? ' (completada)' : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
