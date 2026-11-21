import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, RefreshCw } from 'lucide-react';
import AppShell from '../components/AppShell';
import { obtenerPerfil } from '../services/authService';
import { actualizarLecturaBiblica, obtenerCuadernilloConquistador } from '../services/cuadernilloService';
import { colorDeClase } from '../styles/temaClase';
import './CuadernilloPage.css';

function fechaCorta(valor) {
  if (!valor) return '';
  const fecha = new Date(typeof valor === 'string' ? valor.replace(' ', 'T') : valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha).replace('.', '');
}

// "II. Descubrimiento Espiritual" → { numeral: 'II', nombre: 'Descubrimiento Espiritual' }
function separarNombre(nombre = '') {
  const coincide = nombre.match(/^([IVXLC]+)\.\s*(.+)$/);
  return coincide ? { numeral: coincide[1], nombre: coincide[2] } : { numeral: null, nombre };
}

const estaFirmado = (requisito) => Boolean(requisito.firmado || requisito.completado);

function contar(requisitos = []) {
  const firmados = requisitos.filter(estaFirmado).length;
  return { firmados, total: requisitos.length };
}

function Requisito({ requisito, lecturas, guardando, error, onLectura }) {
  const firmado = estaFirmado(requisito);
  const referencias = Array.isArray(requisito.referencias_lectura) ? requisito.referencias_lectura : [];
  const leidas = firmado ? referencias : lecturas;

  return (
    <li className={firmado ? 'cd-req is-done' : 'cd-req'}>
      <span className="cd-req__num" aria-hidden="true">
        {firmado ? <Check size={15} strokeWidth={3} /> : requisito.numero_item}
      </span>
      <div className="cd-req__body">
        {referencias.length > 0 ? (
          <>
            <p>{requisito.descripcion.split(':')[0]}</p>
            <div className="cd-reading">
              <div className="cd-reading__head">
                <span>{leidas.length} de {referencias.length} leídas</span>
                <span className="cd-reading__bar" aria-hidden="true">
                  <span style={{ width: `${(leidas.length / referencias.length) * 100}%` }} />
                </span>
              </div>
              <div className="cd-reading__list" role="group" aria-label={`Lecturas bíblicas del requisito ${requisito.numero_item}`}>
                {referencias.map((referencia) => {
                  const marcada = leidas.includes(referencia);
                  return (
                    <label key={referencia} className={marcada ? 'cd-chip is-on' : 'cd-chip'}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        disabled={firmado || guardando}
                        onChange={(event) => onLectura(requisito.id, referencia, event.target.checked)}
                      />
                      {marcada && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                      {referencia}
                    </label>
                  );
                })}
              </div>
              {!firmado && <small className="cd-reading__hint">Marcá cada capítulo cuando lo leas. Se guarda solo.</small>}
              {error && <p className="cd-reading__error" role="alert">{error}</p>}
            </div>
          </>
        ) : (
          <p>{requisito.descripcion}</p>
        )}
        <small className={firmado ? 'cd-req__state is-done' : 'cd-req__state'}>
          {firmado
            ? `Firmado${requisito.fecha_firma ? ' el ' + fechaCorta(requisito.fecha_firma) : ''}`
            : 'Pendiente · lo firma tu consejero'}
        </small>
      </div>
    </li>
  );
}

export default function CuadernilloPage() {
  const [datos, setDatos] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [tipo, setTipo] = useState('REGULAR');
  const [areaAbierta, setAreaAbierta] = useState(undefined);
  const [lecturas, setLecturas] = useState({});
  const [guardando, setGuardando] = useState({});
  const [erroresLectura, setErroresLectura] = useState({});

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');

    Promise.all([obtenerCuadernilloConquistador(), obtenerPerfil()])
      .then(([cuadernillo, usuario]) => {
        if (!activo) return;
        setDatos(cuadernillo);
        setPerfil(usuario);
        const iniciales = {};
        for (const libro of cuadernillo.cuadernillos || []) {
          for (const categoria of libro.categorias || []) {
            for (const requisito of categoria.requisitos || []) {
              iniciales[requisito.id] = Array.isArray(requisito.lecturas_completadas) ? requisito.lecturas_completadas : [];
            }
          }
        }
        setLecturas(iniciales);
        setErroresLectura({});
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar tu cuadernillo. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [intento]);

  const cuadernillos = Array.isArray(datos?.cuadernillos) ? datos.cuadernillos : [];
  const libro = cuadernillos.find((item) => item.tipo === tipo) || cuadernillos[0] || null;
  const areas = Array.isArray(libro?.categorias) ? libro.categorias : [];

  // Al abrir, se despliega la primera área con requisitos pendientes.
  const areaInicial = useMemo(() => {
    const pendiente = areas.find((area) => (area.requisitos || []).some((requisito) => !estaFirmado(requisito)));
    return (pendiente || areas[0])?.id ?? null;
  }, [areas]);
  const areaActiva = areaAbierta === undefined ? areaInicial : areaAbierta;
  const areaSeleccionada = areas.find((area) => area.id === areaActiva) || null;

  const resumen = contar(areas.flatMap((area) => area.requisitos || []));
  const porcentaje = resumen.total ? Math.round((resumen.firmados / resumen.total) * 100) : 0;

  const cambiarTipo = (nuevo) => {
    setTipo(nuevo);
    setAreaAbierta(undefined);
  };

  const marcarLectura = async (requisitoId, referencia, leida) => {
    const anteriores = lecturas[requisitoId] || [];
    const siguientes = new Set(anteriores);
    if (leida) siguientes.add(referencia);
    else siguientes.delete(referencia);

    setErroresLectura((actuales) => ({ ...actuales, [requisitoId]: '' }));
    setLecturas((actuales) => ({ ...actuales, [requisitoId]: [...siguientes] }));
    setGuardando((actuales) => ({ ...actuales, [requisitoId]: true }));
    try {
      await actualizarLecturaBiblica(requisitoId, referencia, leida);
    } catch (fallo) {
      setLecturas((actuales) => ({ ...actuales, [requisitoId]: anteriores }));
      setErroresLectura((actuales) => ({
        ...actuales,
        [requisitoId]: fallo?.response?.data?.mensaje || 'No pudimos guardar esta lectura. Intentá de nuevo.'
      }));
    } finally {
      setGuardando((actuales) => {
        const resto = { ...actuales };
        delete resto[requisitoId];
        return resto;
      });
    }
  };

  const listaRequisitos = (area) => {
    const requisitos = area.requisitos || [];
    if (requisitos.length === 0) {
      return <p className="cd-empty-area">Esta área todavía no tiene requisitos cargados.</p>;
    }
    return (
      <ol className="cd-reqs">
        {requisitos.map((requisito) => (
          <Requisito
            key={requisito.id}
            requisito={requisito}
            lecturas={lecturas[requisito.id] || []}
            guardando={Boolean(guardando[requisito.id])}
            error={erroresLectura[requisito.id]}
            onLectura={marcarLectura}
          />
        ))}
      </ol>
    );
  };

  if (cargando || error || !datos) {
    return (
      <AppShell perfil={perfil}>
        <div className="cd cd--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="cd-spinner" aria-hidden="true" />
              <p>Abriendo tu cuadernillo...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir tu cuadernillo</h1>
              <p role="alert">{error || 'No encontramos los datos de tu cuenta.'}</p>
              <button type="button" className="cd-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const clase = datos.clase || perfil?.clase;
  const tipos = [...new Set(cuadernillos.map((item) => item.tipo))];

  return (
    <AppShell perfil={perfil}>
      <div className="cd" style={{ '--clase': colorDeClase(clase) }}>
        <header className="cd-head">
          <div>
            <span className="cd-head__class"><BookOpen size={16} aria-hidden="true" />Clase {clase?.nombre || 'sin asignar'}</span>
            <h1>Mi cuadernillo</h1>
          </div>
          {tipos.length > 1 && (
            <div className="cd-switch" role="group" aria-label="Tipo de cuadernillo">
              {tipos.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  className={libro?.tipo === opcion ? 'is-on' : ''}
                  aria-pressed={libro?.tipo === opcion}
                  onClick={() => cambiarTipo(opcion)}
                >
                  {opcion === 'AVANZADA' ? 'Avanzada' : 'Regular'}
                </button>
              ))}
            </div>
          )}
        </header>

        {!libro ? (
          <div className="cd-empty">
            <BookOpen size={24} aria-hidden="true" />
            <p>Tu clase todavía no tiene cuadernillo cargado. Cuando la dirección lo suba, lo vas a ver acá.</p>
          </div>
        ) : (
          <>
            <section className="cd-summary" aria-label="Avance del cuadernillo">
              <div className="cd-summary__top">
                <strong>{porcentaje}%</strong>
                <span>{resumen.firmados} de {resumen.total} requisitos firmados · {libro.tipo === 'AVANZADA' ? 'avanzada' : 'regular'}</span>
              </div>
              <div
                className="cd-summary__bar"
                role="progressbar"
                aria-label="Avance del cuadernillo"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={porcentaje}
              >
                <span style={{ width: `${porcentaje}%` }} />
              </div>
            </section>

            {areas.length === 0 ? (
              <div className="cd-empty">
                <BookOpen size={24} aria-hidden="true" />
                <p>Este cuadernillo todavía no tiene áreas cargadas.</p>
              </div>
            ) : (
              <div className="cd-layout">
                <ul className="cd-areas">
                  {areas.map((area) => {
                    const { numeral, nombre } = separarNombre(area.nombre);
                    const { firmados, total } = contar(area.requisitos);
                    const abierta = area.id === areaActiva;
                    const completa = total > 0 && firmados === total;
                    return (
                      <li key={area.id} className={abierta ? 'cd-area is-open' : 'cd-area'}>
                        <button
                          type="button"
                          className="cd-area__btn"
                          aria-expanded={abierta}
                          onClick={() => {
                            // En computadora siempre muestra el área elegida; en celular abre y cierra.
                            const ancho = window.matchMedia('(min-width: 900px)').matches;
                            setAreaAbierta(abierta && !ancho ? null : area.id);
                          }}
                        >
                          <span className={completa ? 'cd-area__mark is-done' : 'cd-area__mark'} aria-hidden="true">
                            {completa ? <Check size={16} strokeWidth={3} /> : numeral || area.orden}
                          </span>
                          <span className="cd-area__copy">
                            <strong>{nombre}</strong>
                            <span className="cd-area__bar" aria-hidden="true">
                              <span style={{ width: total ? `${(firmados / total) * 100}%` : 0 }} />
                            </span>
                          </span>
                          <small>{firmados}/{total}</small>
                          <ChevronDown size={18} className="cd-area__chev" aria-hidden="true" />
                        </button>
                        {abierta && <div className="cd-area__inline">{listaRequisitos(area)}</div>}
                      </li>
                    );
                  })}
                </ul>

                <section className="cd-detail" aria-live="polite">
                  {areaSeleccionada ? (
                    <>
                      <h2>{separarNombre(areaSeleccionada.nombre).nombre}</h2>
                      <p className="cd-detail__count">
                        {contar(areaSeleccionada.requisitos).firmados} de {contar(areaSeleccionada.requisitos).total} firmados
                      </p>
                      {listaRequisitos(areaSeleccionada)}
                    </>
                  ) : (
                    <p className="cd-empty-area">Elegí un área para ver sus requisitos.</p>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
