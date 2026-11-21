import { useEffect, useState } from 'react';
import { ChevronRight, Inbox, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import useMomentoDelDia from '../hooks/useMomentoDelDia';
import { obtenerPerfil } from '../services/authService';
import { obtenerMetricas } from '../services/directorService';
import { colorDeClase } from '../styles/temaClase';
import './DirectorDashboardPage.css';

function sabadoCorto(texto) {
  const fecha = new Date(texto + 'T12:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(fecha).replace('.', '');
}

// Barra horizontal con su valor escrito al lado (el número nunca depende solo del color).
function Barra({ etiqueta, detalle, valor, color, vacio }) {
  return (
    <li className="dd-bar">
      <div className="dd-bar__label">
        <span>{etiqueta}</span>
        {detalle && <small>{detalle}</small>}
      </div>
      <div className="dd-bar__track" aria-hidden="true">
        {!vacio && <span style={{ width: `${Math.max(valor, 1)}%`, background: color }} />}
      </div>
      <strong className="dd-bar__value">{vacio ? '—' : `${valor}%`}</strong>
    </li>
  );
}

/**
 * Panel de la dirección: indicadores del club, avance por unidad y por clase,
 * y asistencia de los últimos sábados.
 */
export default function DirectorDashboardPage() {
  const { saludo } = useMomentoDelDia();
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [sabado, setSabado] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([obtenerMetricas(), obtenerPerfil().catch(() => null)])
      .then(([metricas, usuario]) => {
        if (!activo) return;
        setDatos(metricas);
        setPerfil(usuario);
        setSabado(metricas.asistencia.length ? metricas.asistencia.length - 1 : null);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar las métricas. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  if (cargando || error || !datos) {
    return (
      <AppShell perfil={perfil}>
        <div className="dd dd--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <><span className="dd-spinner" aria-hidden="true" /><p>Cargando el resumen del club...</p></>
          ) : (
            <>
              <h1>No pudimos abrir el resumen</h1>
              <p role="alert">{error}</p>
              <button type="button" className="dd-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const { totales, por_unidad: porUnidad, por_clase: porClase, asistencia } = datos;
  const nombreCorto = perfil?.nombre_completo?.trim().split(/\s+/)[0];
  const elegido = sabado !== null ? asistencia[sabado] : null;
  const clasesSinRequisitos = porClase.filter((clase) => clase.requisitos_cargados === 0).map((clase) => clase.nombre);

  return (
    <AppShell perfil={perfil}>
      <div className="dd">
        <header className="dd-head">
          <h1>{saludo.replace('!', '')}{nombreCorto ? `, ${nombreCorto}` : ''}!</h1>
          <p>Así está el club hoy.</p>
        </header>

        {totales.solicitudes_pendientes > 0 && (
          <Link className="dd-alert" to="/solicitudes">
            <Inbox size={20} aria-hidden="true" />
            <span>
              Tenés <b>{totales.solicitudes_pendientes}</b> {totales.solicitudes_pendientes === 1 ? 'solicitud' : 'solicitudes'} de cuenta para revisar
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        )}

        <section className="dd-kpis" aria-label="Indicadores del club">
          <div className="dd-kpi"><small>Conquistadores</small><strong>{totales.conquistadores}</strong></div>
          <div className="dd-kpi"><small>Avance promedio</small><strong>{totales.avance_promedio}%</strong></div>
          <div className="dd-kpi"><small>Requisitos firmados</small><strong>{totales.requisitos_firmados}</strong></div>
          <div className="dd-kpi"><small>Especialidades</small><strong>{totales.especialidades_completadas}</strong></div>
          <div className="dd-kpi"><small>Consejeros</small><strong>{totales.consejeros}</strong></div>
          <div className="dd-kpi"><small>Unidades</small><strong>{totales.unidades}</strong></div>
        </section>

        <div className="dd-grid">
          <section className="dd-card" aria-labelledby="dd-unidades">
            <h2 id="dd-unidades">Avance por unidad</h2>
            <p className="dd-card__sub">Promedio del cuadernillo de cada unidad.</p>
            <ul className="dd-bars">
              {porUnidad.map((unidad) => (
                <Barra
                  key={unidad.id ?? 'sin'}
                  etiqueta={unidad.nombre}
                  detalle={`${unidad.conquistadores} ${unidad.conquistadores === 1 ? 'chico' : 'chicos'}${unidad.consejeros.length ? ' · ' + unidad.consejeros.join(', ') : ' · sin consejero'}`}
                  valor={unidad.avance_promedio}
                  color="var(--jc-pino)"
                  vacio={unidad.con_requisitos === 0}
                />
              ))}
            </ul>
          </section>

          <section className="dd-card" aria-labelledby="dd-clases">
            <h2 id="dd-clases">Avance por clase</h2>
            <p className="dd-card__sub">Cada barra con el color de su insignia.</p>
            <ul className="dd-bars">
              {porClase.map((clase) => (
                <Barra
                  key={clase.id}
                  etiqueta={clase.nombre}
                  detalle={`${clase.conquistadores} ${clase.conquistadores === 1 ? 'chico' : 'chicos'}`}
                  valor={clase.avance_promedio}
                  color={colorDeClase(clase)}
                  vacio={clase.con_requisitos === 0}
                />
              ))}
            </ul>
            {clasesSinRequisitos.length > 0 && (
              <p className="dd-note">Sin requisitos cargados todavía: {clasesSinRequisitos.join(', ')}.</p>
            )}
          </section>

          <section className="dd-card dd-card--wide" aria-labelledby="dd-asistencia">
            <h2 id="dd-asistencia">Asistencia de los sábados</h2>
            {asistencia.length === 0 ? (
              <p className="dd-note">Todavía no se cargó asistencia. Cuando los consejeros o la secretaría la tomen, aparece acá.</p>
            ) : (
              <>
                <p className="dd-card__sub">Porcentaje de presentes. Tocá un sábado para ver el detalle.</p>
                <div className="dd-cols" role="list">
                  {asistencia.map((dia, indice) => (
                    <button
                      key={dia.fecha}
                      type="button"
                      role="listitem"
                      className={indice === sabado ? 'dd-col is-on' : 'dd-col'}
                      onClick={() => setSabado(indice)}
                      aria-pressed={indice === sabado}
                      aria-label={`${sabadoCorto(dia.fecha)}: ${dia.presentes} de ${dia.registrados} presentes (${dia.porcentaje_presentes}%)`}
                      title={`${dia.presentes} de ${dia.registrados} presentes`}
                    >
                      <small>{dia.porcentaje_presentes}%</small>
                      <span className="dd-col__track"><span style={{ height: `${Math.max(dia.porcentaje_presentes, 2)}%` }} /></span>
                      <span className="dd-col__date">{sabadoCorto(dia.fecha)}</span>
                    </button>
                  ))}
                </div>
                {elegido && (
                  <div className="dd-detail">
                    <strong>{sabadoCorto(elegido.fecha)}: {elegido.presentes} de {elegido.registrados} presentes</strong>
                    <span>De los que vinieron:</span>
                    <ul>
                      <li><b>{elegido.puntualidad}%</b> puntuales</li>
                      <li><b>{elegido.biblia}%</b> con Biblia</li>
                      <li><b>{elegido.uniforme}%</b> con uniforme</li>
                      <li><b>{elegido.cuota}%</b> pagaron cuota</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
