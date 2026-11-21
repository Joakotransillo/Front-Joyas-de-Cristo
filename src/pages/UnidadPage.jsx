import { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardCheck, RefreshCw, Users } from 'lucide-react';
import AppShell, { iniciales } from '../components/AppShell';
import EvaluacionModal from '../components/EvaluacionModal';
import { obtenerPerfil } from '../services/authService';
import { obtenerMiUnidad } from '../services/consejeroService';
import { colorDeClase } from '../styles/temaClase';
import './UnidadPage.css';

/**
 * Panel del consejero: los conquistadores de su unidad con su avance,
 * y acceso a la evaluación presencial del sábado.
 */
export default function UnidadPage() {
  const [perfil, setPerfil] = useState(null);
  const [unidad, setUnidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [evaluando, setEvaluando] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([obtenerMiUnidad(), obtenerPerfil().catch(() => null)])
      .then(([datos, usuario]) => {
        if (!activo) return;
        setUnidad(datos);
        setPerfil(usuario);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar tu unidad. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  // Recarga el avance después de firmar, sin mostrar la pantalla de carga.
  const recargar = useCallback(() => {
    obtenerMiUnidad().then(setUnidad).catch(() => {});
  }, []);

  const cerrarEvaluacion = useCallback(() => setEvaluando(null), []);

  const alFirmar = useCallback(({ conquistador, cantidad }) => {
    setEvaluando(null);
    const nombre = conquistador.nombre_completo?.trim().split(/\s+/)[0] || 'el conquistador';
    setAviso(cantidad === 0
      ? `Esos requisitos de ${nombre} ya estaban firmados.`
      : `Firmaste ${cantidad} ${cantidad === 1 ? 'requisito' : 'requisitos'} de ${nombre}.`);
    recargar();
  }, [recargar]);

  if (cargando || error || !unidad) {
    return (
      <AppShell perfil={perfil}>
        <div className="uni uni--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="uni-spinner" aria-hidden="true" />
              <p>Cargando tu unidad...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir tu unidad</h1>
              <p role="alert">{error || 'No encontramos los datos de tu unidad.'}</p>
              <button type="button" className="uni-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const conquistadores = Array.isArray(unidad.conquistadores) ? unidad.conquistadores : [];
  const conRequisitos = conquistadores.filter((item) => item.avance?.total_requisitos > 0);
  const promedio = conRequisitos.length
    ? Math.round(conRequisitos.reduce((suma, item) => suma + (item.avance.porcentaje || 0), 0) / conRequisitos.length)
    : 0;

  return (
    <AppShell perfil={perfil}>
      <div className="uni">
        <header className="uni-head">
          <span className="uni-head__eyebrow"><Users size={16} aria-hidden="true" />Mi unidad</span>
          <h1>Unidad {unidad.unidad?.nombre}</h1>
          <div className="uni-stats">
            <div><strong>{conquistadores.length}</strong><span>{conquistadores.length === 1 ? 'conquistador' : 'conquistadores'}</span></div>
            <div><strong>{promedio}%</strong><span>avance promedio</span></div>
          </div>
        </header>

        {aviso && (
          <p className="uni-aviso" role="status">
            <Check size={18} aria-hidden="true" />{aviso}
            <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">×</button>
          </p>
        )}

        {conquistadores.length === 0 ? (
          <div className="uni-empty">
            <Users size={22} aria-hidden="true" />
            <p>Tu unidad todavía no tiene conquistadores. Cuando la dirección asigne a alguien, aparece acá.</p>
          </div>
        ) : (
          <ul className="uni-grid">
            {conquistadores.map((item) => {
              const color = colorDeClase(item.clase);
              const avance = item.avance || {};
              const tieneRequisitos = avance.total_requisitos > 0;
              return (
                <li key={item.id} className="uni-card" style={{ '--clase': color }}>
                  <div className="uni-card__top">
                    <span className="uni-avatar" aria-hidden="true">{iniciales(item.nombre_completo)}</span>
                    <div className="uni-card__who">
                      <strong>{item.nombre_completo}</strong>
                      <span><i aria-hidden="true" />{item.clase ? 'Clase ' + item.clase.nombre : 'Sin clase asignada'}</span>
                    </div>
                    <span className="uni-card__pct">{avance.porcentaje || 0}%</span>
                  </div>
                  <div
                    className="uni-bar"
                    role="progressbar"
                    aria-label={'Avance de ' + item.nombre_completo}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={avance.porcentaje || 0}
                  >
                    <span style={{ width: `${avance.porcentaje || 0}%` }} />
                  </div>
                  {tieneRequisitos ? (
                    <div className="uni-card__foot">
                      <small>{avance.requisitos_completados} de {avance.total_requisitos} requisitos firmados</small>
                      <button type="button" className="uni-button uni-button--small" onClick={() => { setAviso(''); setEvaluando(item); }}>
                        <ClipboardCheck size={17} aria-hidden="true" />Evaluar
                      </button>
                    </div>
                  ) : (
                    <small className="uni-card__note">
                      {item.clase ? `El cuadernillo de ${item.clase.nombre} todavía no tiene requisitos cargados.` : 'Necesita una clase asignada para evaluarlo.'}
                    </small>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {evaluando && (
        <EvaluacionModal conquistador={evaluando} onCerrar={cerrarEvaluacion} onFirmado={alFirmar} />
      )}
    </AppShell>
  );
}
