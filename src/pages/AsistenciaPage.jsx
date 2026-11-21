import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, ClipboardList, Clock, Coins, RefreshCw, Shirt, UserCheck } from 'lucide-react';
import AppShell, { iniciales } from '../components/AppShell';
import { guardarAsistencia, obtenerAsistencia } from '../services/asistenciaService';
import { obtenerPerfil } from '../services/authService';
import { colorDeClase } from '../styles/temaClase';
import './AsistenciaPage.css';

// Lo que se marca de cada chico presente, como en la planilla de papel del club.
const MARCAS = [
  { campo: 'puntualidad', etiqueta: 'Puntual', Icono: Clock },
  { campo: 'biblia', etiqueta: 'Biblia', Icono: BookOpen },
  { campo: 'uniforme', etiqueta: 'Uniforme', Icono: Shirt },
  { campo: 'cuota', etiqueta: 'Cuota', Icono: Coins }
];

const VACIO = { presente: false, puntualidad: false, biblia: false, uniforme: false, cuota: false };

const aTexto = (fecha) => fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');

// El sábado de hoy o, si hoy no es sábado, el último que pasó.
function ultimoSabado() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - ((hoy.getDay() + 1) % 7));
  return aTexto(hoy);
}

function fechaLarga(texto) {
  const fecha = new Date(texto + 'T12:00:00');
  const largo = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);
  return largo.charAt(0).toUpperCase() + largo.slice(1);
}

export default function AsistenciaPage() {
  const [perfil, setPerfil] = useState(null);
  const [fecha, setFecha] = useState(ultimoSabado);
  const [unidadId, setUnidadId] = useState(null);
  const [planilla, setPlanilla] = useState(null);
  const [marcas, setMarcas] = useState({});
  const [cambios, setCambios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    obtenerPerfil().then(setPerfil).catch(() => {});
  }, []);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    setAviso('');
    setErrorGuardado('');
    obtenerAsistencia({ fecha, unidadId })
      .then((datos) => {
        if (!activo) return;
        setPlanilla(datos);
        setMarcas(Object.fromEntries(datos.conquistadores.map((item) => [item.id, item.registro || VACIO])));
        setCambios(false);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar la planilla. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [fecha, unidadId, intento]);

  // Avisa antes de salir si hay cambios sin guardar.
  useEffect(() => {
    if (!cambios) return undefined;
    const alSalir = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [cambios]);

  const conquistadores = planilla?.conquistadores || [];

  const totales = useMemo(() => {
    const valores = Object.values(marcas);
    return {
      presentes: valores.filter((item) => item.presente).length,
      ...Object.fromEntries(MARCAS.map(({ campo }) => [campo, valores.filter((item) => item[campo]).length]))
    };
  }, [marcas]);

  const cambiar = (id, campo) => {
    setAviso('');
    setErrorGuardado('');
    setCambios(true);
    setMarcas((actuales) => {
      const actual = actuales[id] || VACIO;
      if (campo === 'presente') {
        // Al marcar ausente se limpian las demás marcas.
        return { ...actuales, [id]: actual.presente ? { ...VACIO } : { ...actual, presente: true } };
      }
      // Marcar puntual, Biblia, uniforme o cuota implica que vino.
      return { ...actuales, [id]: { ...actual, presente: true, [campo]: !actual[campo] } };
    });
  };

  const todosPresentes = () => {
    setAviso('');
    setCambios(true);
    setMarcas((actuales) => Object.fromEntries(
      conquistadores.map((item) => [item.id, { ...(actuales[item.id] || VACIO), presente: true }])
    ));
  };

  const cambiarFiltro = (aplicar) => {
    if (cambios && !window.confirm('Tenés cambios sin guardar en esta planilla. ¿Querés descartarlos?')) return;
    aplicar();
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorGuardado('');
    try {
      const respuesta = await guardarAsistencia({
        fecha,
        unidadId: planilla.unidad.id,
        registros: conquistadores.map((item) => ({ conquistador_id: item.id, ...(marcas[item.id] || VACIO) }))
      });
      setCambios(false);
      setPlanilla((actual) => ({ ...actual, guardada: true }));
      setAviso(`Guardamos la asistencia: ${respuesta.presentes} de ${respuesta.guardados} presentes.`);
    } catch (fallo) {
      setErrorGuardado(fallo?.response?.data?.mensaje || 'No pudimos guardar la asistencia. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const unidades = planilla?.unidades || [];

  return (
    <AppShell perfil={perfil}>
      <div className="as">
        <header className="as-head">
          <span className="as-head__eyebrow"><ClipboardList size={16} aria-hidden="true" />Asistencia</span>
          <h1>{planilla?.unidad ? 'Unidad ' + planilla.unidad.nombre : 'Asistencia del sábado'}</h1>

          <div className="as-filters">
            <label className="as-date">
              <CalendarDays size={18} aria-hidden="true" />
              <span className="sr-only">Fecha</span>
              <input
                type="date"
                value={fecha}
                max={aTexto(new Date())}
                onChange={(event) => { const nueva = event.target.value; if (nueva) cambiarFiltro(() => setFecha(nueva)); }}
              />
            </label>
            <span className="as-date__text">{fechaLarga(fecha)}</span>
          </div>

          {unidades.length > 1 && (
            <div className="as-units" role="group" aria-label="Unidad">
              {unidades.map((unidad) => (
                <button
                  key={unidad.id}
                  type="button"
                  className={planilla?.unidad?.id === unidad.id ? 'is-on' : ''}
                  aria-pressed={planilla?.unidad?.id === unidad.id}
                  onClick={() => cambiarFiltro(() => setUnidadId(unidad.id))}
                >
                  {unidad.nombre}
                </button>
              ))}
            </div>
          )}
        </header>

        {cargando ? (
          <div className="as-state" role="status"><span className="as-spinner" aria-hidden="true" />Cargando planilla...</div>
        ) : error ? (
          <div className="as-state">
            <p role="alert">{error}</p>
            <button type="button" className="as-button" onClick={() => setIntento((actual) => actual + 1)}>
              <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
            </button>
          </div>
        ) : conquistadores.length === 0 ? (
          <div className="as-empty"><p>Esta unidad todavía no tiene conquistadores.</p></div>
        ) : (
          <>
            <div className="as-summary">
              <span className={planilla.guardada ? 'as-status is-saved' : 'as-status'}>
                {planilla.guardada ? 'Ya cargada · podés corregirla' : 'Todavía no se tomó'}
              </span>
              <div className="as-totals">
                <span><strong>{totales.presentes}</strong>/{conquistadores.length} presentes</span>
                {MARCAS.map(({ campo, etiqueta }) => <span key={campo}><strong>{totales[campo]}</strong> {etiqueta.toLowerCase()}</span>)}
              </div>
              <button type="button" className="as-link" onClick={todosPresentes}>
                <UserCheck size={16} aria-hidden="true" />Marcar a todos presentes
              </button>
            </div>

            {aviso && <p className="as-aviso" role="status"><Check size={18} aria-hidden="true" />{aviso}</p>}

            <ul className="as-list">
              {conquistadores.map((item) => {
                const marca = marcas[item.id] || VACIO;
                return (
                  <li key={item.id} className={marca.presente ? 'as-row is-in' : 'as-row'} style={{ '--clase': colorDeClase(item.clase) }}>
                    <div className="as-row__who">
                      <span className="as-avatar" aria-hidden="true">{iniciales(item.nombre_completo)}</span>
                      <div>
                        <strong>{item.nombre_completo}</strong>
                        <span>{item.clase ? 'Clase ' + item.clase.nombre : 'Sin clase'}</span>
                      </div>
                    </div>
                    <div className="as-row__marks">
                      <button
                        type="button"
                        className={marca.presente ? 'as-toggle as-toggle--main is-on' : 'as-toggle as-toggle--main'}
                        aria-pressed={marca.presente}
                        onClick={() => cambiar(item.id, 'presente')}
                      >
                        {marca.presente ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : null}
                        {marca.presente ? 'Presente' : 'Ausente'}
                      </button>
                      {MARCAS.map(({ campo, etiqueta, Icono }) => (
                        <button
                          key={campo}
                          type="button"
                          className={marca[campo] ? 'as-toggle is-on' : 'as-toggle'}
                          aria-pressed={marca[campo]}
                          aria-label={`${etiqueta} de ${item.nombre_completo}`}
                          onClick={() => cambiar(item.id, campo)}
                        >
                          <Icono size={16} aria-hidden="true" />
                          <span>{etiqueta}</span>
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="as-foot">
              {errorGuardado && <p className="as-error" role="alert">{errorGuardado}</p>}
              <div className="as-foot__row">
                <span>{cambios ? 'Hay cambios sin guardar' : planilla.guardada ? 'Todo guardado' : 'Marcá la asistencia y guardá'}</span>
                <button type="button" className="as-button" onClick={guardar} disabled={guardando || !cambios}>
                  {guardando ? 'Guardando...' : 'Guardar asistencia'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
