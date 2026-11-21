import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Lock, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Parche from '../components/Parche';
import { obtenerPerfil } from '../services/authService';
import { obtenerEspecialidad } from '../services/especialidadesService';
import './EspecialidadesPage.css';
import './EspecialidadDetallePage.css';

function fechaCorta(valor) {
  if (!valor) return '';
  const fecha = new Date(String(valor).slice(0, 10) + 'T12:00:00');
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
}

export default function EspecialidadDetallePage() {
  const { id } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [especialidad, setEspecialidad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [vista, setVista] = useState('preguntas');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    setVista('preguntas');
    Promise.all([obtenerEspecialidad(id), obtenerPerfil().catch(() => null)])
      .then(([detalle, usuario]) => {
        if (!activo) return;
        setEspecialidad(detalle);
        setPerfil(usuario);
      })
      .catch((fallo) => {
        if (activo) {
          setError(fallo?.response?.status === 404
            ? 'No encontramos esa especialidad.'
            : fallo?.response?.data?.mensaje || 'No pudimos cargar la especialidad. Revisá la conexión e intentá de nuevo.');
        }
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id, intento]);

  const volver = (
    <Link className="espd-back" to="/especialidades">
      <ArrowLeft size={18} aria-hidden="true" />Especialidades
    </Link>
  );

  if (cargando || error || !especialidad) {
    return (
      <AppShell perfil={perfil}>
        <div className="esp esp--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="esp-spinner" aria-hidden="true" />
              <p>Cargando especialidad...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir la especialidad</h1>
              <p role="alert">{error}</p>
              <div className="espd-actions">
                <button type="button" className="esp-button" onClick={() => setIntento((actual) => actual + 1)}>
                  <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
                </button>
                {volver}
              </div>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // El servidor solo manda "desarrollada" a consejeros y dirección.
  const veDesarrollo = typeof especialidad.desarrollada === 'boolean';
  const preguntas = Array.isArray(especialidad.preguntas) ? especialidad.preguntas : [];
  const esConquistador = perfil?.rol === 'CONQUISTADOR';

  return (
    <AppShell perfil={perfil}>
      <div className="esp espd">
        {volver}

        <header className="espd-head">
          <Parche especialidad={especialidad} tamano={112} />
          <h1>{especialidad.nombre}</h1>
          <p>{[especialidad.codigo, especialidad.categoria].filter(Boolean).join(' · ')}</p>
          {esConquistador && (
            especialidad.completada ? (
              <span className="espd-state is-done"><Check size={15} strokeWidth={3} aria-hidden="true" />Completada el {fechaCorta(especialidad.fecha_completado)}</span>
            ) : (
              <span className="espd-state">Todavía no la completaste</span>
            )
          )}
        </header>

        {veDesarrollo && (
          <div className="espd-switch" role="group" aria-label="Qué mostrar">
            <button type="button" className={vista === 'preguntas' ? 'is-on' : ''} aria-pressed={vista === 'preguntas'} onClick={() => setVista('preguntas')}>
              Preguntas
            </button>
            <button type="button" className={vista === 'desarrollada' ? 'is-on' : ''} aria-pressed={vista === 'desarrollada'} onClick={() => setVista('desarrollada')}>
              <Lock size={14} aria-hidden="true" />Desarrollada
            </button>
          </div>
        )}

        {vista === 'desarrollada' && veDesarrollo && (
          <p className="espd-note">
            <Lock size={15} aria-hidden="true" />
            {especialidad.desarrollada
              ? 'Solo consejeros y dirección ven las respuestas.'
              : 'Esta especialidad todavía no está desarrollada. Las preguntas se muestran sin respuesta.'}
          </p>
        )}

        {preguntas.length === 0 ? (
          <div className="esp-empty">
            <p>Esta especialidad todavía no tiene preguntas cargadas.</p>
          </div>
        ) : (
          <ol className="espd-list">
            {preguntas.map((item) => (
              <li key={item.id} className="espd-q">
                <span className="espd-q__num" aria-hidden="true">{item.numero}</span>
                <div className="espd-q__body">
                  <p>{item.pregunta}</p>
                  {vista === 'desarrollada' && veDesarrollo && (
                    item.desarrollo
                      ? <div className="espd-answer">{item.desarrollo}</div>
                      : <div className="espd-answer espd-answer--empty">Sin desarrollar todavía.</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </AppShell>
  );
}
