import { useEffect, useState } from 'react';
import { Check, Copy, Inbox, KeyRound, RefreshCw, UserPlus, X } from 'lucide-react';
import AppShell, { iniciales } from '../components/AppShell';
import { obtenerPerfil } from '../services/authService';
import { aprobarSolicitud, obtenerCatalogo, obtenerSolicitudes, rechazarSolicitud } from '../services/directorService';
import { calcularEdad } from '../validators/solicitudValidator';
import './SolicitudesPage.css';

function haceCuanto(valor) {
  if (!valor) return '';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return '';
  const dias = Math.round((fecha.getTime() - Date.now()) / 86_400_000);
  const formato = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });
  if (Math.abs(dias) < 1) return 'hoy';
  if (Math.abs(dias) < 30) return formato.format(dias, 'day');
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(fecha);
}

const primerNombre = (nombre = '') => nombre.trim().split(/\s+/)[0] || 'la persona';

function TarjetaSolicitud({ solicitud, catalogo, onResuelta }) {
  const [modo, setModo] = useState('inicio');
  const [claseId, setClaseId] = useState(solicitud.clase_sugerida?.id ? String(solicitud.clase_sugerida.id) : '');
  const [unidadId, setUnidadId] = useState(solicitud.unidad_sugerida?.id ? String(solicitud.unidad_sugerida.id) : '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const edad = solicitud.fecha_nacimiento ? calcularEdad(String(solicitud.fecha_nacimiento).slice(0, 10)) : null;
  const detalle = [edad !== null && edad >= 0 ? `${edad} años` : null, 'pidió ' + haceCuanto(solicitud.fecha_solicitud)].filter(Boolean).join(' · ');

  const aprobar = async (event) => {
    event.preventDefault();
    if (!claseId) {
      setError('Elegí la clase antes de aprobar.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const respuesta = await aprobarSolicitud(solicitud.id, {
        claseId: Number(claseId),
        unidadId: unidadId ? Number(unidadId) : null
      });
      setResultado(respuesta);
      setModo('aprobada');
    } catch (fallo) {
      setError(fallo?.response?.data?.mensaje || 'No pudimos aprobar la solicitud. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const rechazar = async () => {
    setEnviando(true);
    setError('');
    try {
      await rechazarSolicitud(solicitud.id);
      onResuelta(solicitud.id, `Rechazaste la solicitud de ${primerNombre(solicitud.nombre_completo)}.`);
    } catch (fallo) {
      setError(fallo?.response?.data?.mensaje || 'No pudimos rechazar la solicitud. Intentá de nuevo.');
      setEnviando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(resultado.contrasena_temporal);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  if (modo === 'aprobada' && resultado) {
    return (
      <li className="sol-card is-done">
        <div className="sol-done__head">
          <span className="sol-done__icon"><Check size={20} strokeWidth={3} aria-hidden="true" /></span>
          <div>
            <strong>Cuenta creada para {resultado.usuario?.nombre_completo}</strong>
            <span>{resultado.usuario?.email}</span>
          </div>
        </div>
        <div className="sol-pass">
          <span className="sol-pass__label"><KeyRound size={16} aria-hidden="true" />Contraseña temporal</span>
          <div className="sol-pass__row">
            <code>{resultado.contrasena_temporal}</code>
            <button type="button" className="sol-btn sol-btn--ghost" onClick={copiar}>
              {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copiado ? 'Copiada' : 'Copiar'}
            </button>
          </div>
          <p>Pasásela a la familia por un medio privado. <b>Solo se muestra esta vez.</b> Después la puede cambiar en Ajustes.</p>
        </div>
        <button
          type="button"
          className="sol-btn"
          onClick={() => onResuelta(solicitud.id, `Aprobaste la solicitud de ${primerNombre(solicitud.nombre_completo)}.`)}
        >
          Listo, ya la anoté
        </button>
      </li>
    );
  }

  return (
    <li className="sol-card">
      <div className="sol-card__top">
        <span className="sol-avatar" aria-hidden="true">{iniciales(solicitud.nombre_completo)}</span>
        <div className="sol-card__who">
          <strong>{solicitud.nombre_completo}</strong>
          <span>{detalle}</span>
          <span className="sol-card__mail">{solicitud.email}</span>
        </div>
      </div>

      <div className="sol-sugerido">
        <span>Pidió:</span>
        {solicitud.clase_sugerida ? (
          <span className="sol-chip" style={{ '--clase': solicitud.clase_sugerida.color_insignia || 'var(--jc-pino)' }}>
            <i aria-hidden="true" />Clase {solicitud.clase_sugerida.nombre}
          </span>
        ) : <span className="sol-chip">Sin clase</span>}
        <span className="sol-chip">{solicitud.unidad_sugerida ? 'Unidad ' + solicitud.unidad_sugerida.nombre : 'Sin unidad'}</span>
      </div>

      {modo === 'aprobando' && (
        <form className="sol-form" onSubmit={aprobar}>
          <div className="sol-field">
            <label htmlFor={`sol-clase-${solicitud.id}`}>Clase</label>
            <select id={`sol-clase-${solicitud.id}`} value={claseId} onChange={(event) => { setClaseId(event.target.value); setError(''); }}>
              <option value="">Elegí una clase</option>
              {catalogo.clases.map((clase) => <option key={clase.id} value={clase.id}>{clase.nombre}</option>)}
            </select>
          </div>
          <div className="sol-field">
            <label htmlFor={`sol-unidad-${solicitud.id}`}>Unidad</label>
            <select id={`sol-unidad-${solicitud.id}`} value={unidadId} onChange={(event) => setUnidadId(event.target.value)}>
              <option value="">Sin unidad por ahora</option>
              {catalogo.unidades.map((unidad) => <option key={unidad.id} value={unidad.id}>{unidad.nombre}</option>)}
            </select>
          </div>
          {error && <p className="sol-error" role="alert">{error}</p>}
          <div className="sol-actions">
            <button type="button" className="sol-btn sol-btn--ghost" onClick={() => { setModo('inicio'); setError(''); }} disabled={enviando}>Cancelar</button>
            <button type="submit" className="sol-btn" disabled={enviando}>
              {enviando ? 'Creando cuenta...' : 'Aprobar y crear cuenta'}
            </button>
          </div>
        </form>
      )}

      {modo === 'rechazando' && (
        <div className="sol-form">
          <p className="sol-warn">
            ¿Rechazar la solicitud de {primerNombre(solicitud.nombre_completo)}? Se borra y, si quiere, puede volver a pedir cuenta.
          </p>
          {error && <p className="sol-error" role="alert">{error}</p>}
          <div className="sol-actions">
            <button type="button" className="sol-btn sol-btn--ghost" onClick={() => { setModo('inicio'); setError(''); }} disabled={enviando}>Cancelar</button>
            <button type="button" className="sol-btn sol-btn--danger" onClick={rechazar} disabled={enviando}>
              {enviando ? 'Rechazando...' : 'Sí, rechazar'}
            </button>
          </div>
        </div>
      )}

      {modo === 'inicio' && (
        <div className="sol-actions">
          <button type="button" className="sol-btn sol-btn--ghost sol-btn--danger-text" onClick={() => setModo('rechazando')}>
            <X size={17} aria-hidden="true" />Rechazar
          </button>
          <button type="button" className="sol-btn" onClick={() => setModo('aprobando')}>
            <UserPlus size={17} aria-hidden="true" />Aprobar
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * Bandeja de solicitudes de registro para la dirección y la secretaría.
 */
export default function SolicitudesPage() {
  const [perfil, setPerfil] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [catalogo, setCatalogo] = useState({ clases: [], unidades: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([obtenerSolicitudes(), obtenerCatalogo(), obtenerPerfil().catch(() => null)])
      .then(([lista, datosCatalogo, usuario]) => {
        if (!activo) return;
        setSolicitudes(lista);
        setCatalogo(datosCatalogo);
        setPerfil(usuario);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar las solicitudes. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  const quitar = (id, mensaje) => {
    setSolicitudes((actuales) => actuales.filter((item) => item.id !== id));
    setAviso(mensaje);
  };

  if (cargando || error) {
    return (
      <AppShell perfil={perfil}>
        <div className="sol sol--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="sol-spinner" aria-hidden="true" />
              <p>Cargando solicitudes...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir las solicitudes</h1>
              <p role="alert">{error}</p>
              <button type="button" className="sol-btn" onClick={() => setIntento((actual) => actual + 1)}>
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
      <div className="sol">
        <header className="sol-head">
          <span className="sol-head__eyebrow"><Inbox size={16} aria-hidden="true" />Dirección</span>
          <h1>Solicitudes</h1>
          <p>
            {solicitudes.length === 0
              ? 'No hay solicitudes pendientes.'
              : `${solicitudes.length} ${solicitudes.length === 1 ? 'pendiente' : 'pendientes'}, de la más vieja a la más nueva.`}
          </p>
        </header>

        {aviso && (
          <p className="sol-aviso" role="status">
            <Check size={18} aria-hidden="true" />{aviso}
            <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">×</button>
          </p>
        )}

        {solicitudes.length === 0 ? (
          <div className="sol-empty">
            <Inbox size={22} aria-hidden="true" />
            <p>Cuando alguien pida cuenta desde "Pedí tu cuenta", su solicitud aparece acá para que la apruebes.</p>
          </div>
        ) : (
          <ul className="sol-list">
            {solicitudes.map((solicitud) => (
              <TarjetaSolicitud key={solicitud.id} solicitud={solicitud} catalogo={catalogo} onResuelta={quitar} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
