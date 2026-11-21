import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, MapPin, Megaphone, PenLine, RefreshCw, Tent, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell, { iniciales } from '../components/AppShell';
import CampScene, { PALETAS } from '../components/CampScene';
import useMomentoDelDia from '../hooks/useMomentoDelDia';
import { obtenerInicioConquistador } from '../services/conquisService';
import { obtenerCuadernilloConquistador } from '../services/cuadernilloService';
import { CLASES, colorDeClase, mezclar } from '../styles/temaClase';
import './DashboardConquiPage.css';


function aFecha(valor) {
  if (!valor) return null;
  const fecha = new Date(typeof valor === 'string' ? valor.replace(' ', 'T') : valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function hoyLegible() {
  return capitalizar(new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
}

function haceCuanto(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '';
  const diferencia = fecha.getTime() - Date.now();
  const dias = Math.round(diferencia / 86_400_000);
  const formato = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });
  if (Math.abs(dias) < 1) {
    const horas = Math.round(diferencia / 3_600_000);
    return horas === 0 ? 'recién' : formato.format(horas, 'hour');
  }
  if (Math.abs(dias) < 30) return formato.format(dias, 'day');
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(fecha);
}

function detalleEvento(evento) {
  const fecha = aFecha(evento.fecha_inicio);
  const partes = [];
  if (fecha) {
    const dia = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(fecha);
    const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(fecha);
    partes.push(capitalizar(dia) + ' ' + hora + ' h');
  }
  if (evento.lugar) partes.push(evento.lugar);
  return partes.join(' · ');
}

// Resume el cuadernillo regular: avance por área, próximo requisito pendiente y última firma.
function resumirCuadernillo(datos) {
  const regular = datos?.cuadernillos?.find((cuadernillo) => cuadernillo.tipo === 'REGULAR');
  if (!regular) return null;

  const areas = regular.categorias
    .map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      total: categoria.requisitos.length,
      hechos: categoria.requisitos.filter((requisito) => requisito.completado).length
    }))
    .filter((area) => area.total > 0);

  let proximo = null;
  let ultimaFirma = null;
  for (const categoria of regular.categorias) {
    for (const requisito of categoria.requisitos) {
      if (!requisito.completado && !proximo) proximo = { ...requisito, area: categoria.nombre };
      const firma = aFecha(requisito.fecha_firma);
      if (requisito.completado && firma && (!ultimaFirma || firma > ultimaFirma.fecha)) {
        ultimaFirma = { fecha: firma, descripcion: requisito.descripcion };
      }
    }
  }

  if (areas.length === 0) return null;
  return { areas, proximo, ultimaFirma };
}

function FechaChip({ valor }) {
  const fecha = aFecha(valor);
  if (!fecha) return <span className="home-date home-date--tbd">A confirmar</span>;
  const mes = new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(fecha).replace('.', '').toUpperCase();
  return (
    <span className="home-date" aria-hidden="true">
      <strong>{fecha.getDate()}</strong>
      <small>{mes}</small>
    </span>
  );
}

function CaminoDeClases({ claseActual }) {
  const indiceActual = CLASES.findIndex((clase) => clase.nombre === claseActual);
  if (indiceActual < 0) return null;

  return (
    <div className="home-path">
      <ol aria-label={`Camino de clases: ${claseActual}, clase ${indiceActual + 1} de ${CLASES.length}`}>
        {CLASES.map((clase, indice) => {
          const estado = indice < indiceActual ? 'is-done' : indice === indiceActual ? 'is-current' : '';
          return (
            <li key={clase.nombre} className={estado} style={{ '--color': clase.color }} title={clase.nombre}>
              <span className="home-path__dot" />
            </li>
          );
        })}
      </ol>
      <p>
        Clase {indiceActual + 1} de {CLASES.length}
        {indiceActual < CLASES.length - 1 ? ` · después sigue ${CLASES[indiceActual + 1].nombre}` : ' · la última del camino'}
      </p>
    </div>
  );
}

export default function DashboardConquiPage() {
  const { momento, saludo } = useMomentoDelDia();
  const [inicio, setInicio] = useState(null);
  const [cuadernillo, setCuadernillo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');

    // El cuadernillo es un extra: si falla, el inicio se muestra igual sin esas secciones.
    Promise.allSettled([obtenerInicioConquistador(), obtenerCuadernilloConquistador()])
      .then(([resultadoInicio, resultadoCuadernillo]) => {
        if (!activo) return;
        if (resultadoInicio.status === 'fulfilled') {
          setInicio(resultadoInicio.value);
        } else {
          setError(resultadoInicio.reason?.response?.data?.mensaje || 'No pudimos cargar tu inicio. Revisá la conexión e intentá de nuevo.');
        }
        setCuadernillo(resultadoCuadernillo.status === 'fulfilled' ? resumirCuadernillo(resultadoCuadernillo.value) : null);
      })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [intento]);

  if (cargando) {
    return (
      <AppShell perfil={inicio?.perfil}>
        <div className="home home--loading" role="status" aria-live="polite">
          <span className="home-spinner" aria-hidden="true" />
          <p>Cargando tu inicio...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !inicio?.perfil) {
    return (
      <AppShell perfil={inicio?.perfil}>
        <div className="home home--error">
          <h1>No pudimos abrir tu inicio</h1>
          <p role="alert">{error || 'No encontramos los datos de tu cuenta.'}</p>
          <button type="button" className="home-button" onClick={() => setIntento((actual) => actual + 1)}>
            <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
          </button>
        </div>
      </AppShell>
    );
  }

  const perfil = inicio.perfil;
  const avance = inicio.avance_clase || {};
  const porcentaje = Math.max(0, Math.min(100, Number(avance.porcentaje) || 0));
  const completados = Number(avance.requisitos_completados) || 0;
  const total = Number(avance.total_requisitos) || 0;
  const especialidades = Number(perfil.especialidades_completadas) || 0;
  const eventos = Array.isArray(inicio.proximos_eventos) ? inicio.proximos_eventos : [];
  const anuncios = Array.isArray(inicio.anuncios) ? inicio.anuncios : [];
  const proxima = eventos[0];
  const nombreCorto = perfil.nombre_completo?.trim().split(/\s+/)[0] || 'conquistador';
  const paleta = PALETAS[momento] || PALETAS.dia;
  // La carpa del paisaje es del color de la clase.
  const colorCarpa = perfil.clase ? colorDeClase(perfil.clase) : null;
  const carpa = colorCarpa ? { frente: colorCarpa, sombra: mezclar(colorCarpa, '#000000', 0.25) } : undefined;

  return (
    <AppShell perfil={perfil}>
      <div className="home">
        <section
          className="home-hero"
          data-momento={momento}
          style={{ '--cielo-arriba': paleta.cieloArriba, '--cielo-abajo': paleta.cieloAbajo }}
        >
          <span className="home-hero__astro" aria-hidden="true" />
          <CampScene momento={momento} conCielo={false} carpa={carpa} className="home-hero__scene home-hero__scene--celular" />
          <CampScene momento={momento} conCielo={false} panoramica carpa={carpa} className="home-hero__scene home-hero__scene--ancha" />
          <div className="home-hero__copy">
            <span>{hoyLegible()}</span>
            <h1>{saludo.replace('!', '')}, {nombreCorto}!</h1>
          </div>
          <Link className="home-hero__me" to="/configuracion" aria-label="Configuración">
            {iniciales(perfil.nombre_completo)}
          </Link>
        </section>

        <div className="home-grid">
          <div className="home-col">
            <section className="home-progress" style={{ '--clase': colorDeClase(perfil.clase) }} aria-label="Avance de tu clase">
              <div className="home-progress__main">
                <div
                  className="home-ring"
                  role="progressbar"
                  aria-label={'Avance de la clase ' + (perfil.clase?.nombre || '')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={porcentaje}
                  style={{ '--pct': porcentaje }}
                >
                  <span>{porcentaje}%</span>
                </div>
                <div className="home-progress__copy">
                  <h2>{perfil.clase ? 'Clase ' + perfil.clase.nombre : 'Sin clase asignada'}</h2>
                  <p>
                    {total > 0
                      ? `${completados} de ${total} requisitos firmados`
                      : 'Tu cuadernillo todavía no tiene requisitos cargados'}
                  </p>
                  {cuadernillo?.ultimaFirma && (
                    <p className="home-progress__last">
                      <PenLine size={14} aria-hidden="true" />Última firma {haceCuanto(cuadernillo.ultimaFirma.fecha)}
                    </p>
                  )}
                  <Link className="home-button" to="/cuadernillo">
                    {completados > 0 ? 'Continuar cuadernillo' : 'Abrir mi cuadernillo'}
                  </Link>
                </div>
              </div>
              <CaminoDeClases claseActual={perfil.clase?.nombre} />
            </section>

            {cuadernillo && (
              <section className="home-next" aria-labelledby="home-next-title">
                {cuadernillo.proximo ? (
                  <>
                    <div className="home-next__head">
                      <span className="home-next__icon"><Tent size={18} aria-hidden="true" /></span>
                      <div>
                        <h2 id="home-next-title">Tu próximo desafío</h2>
                        <small>{cuadernillo.proximo.area}</small>
                      </div>
                    </div>
                    <p className="home-next__text">
                      <b>{cuadernillo.proximo.numero_item}.</b> {cuadernillo.proximo.descripcion}
                    </p>
                    <Link className="home-link" to="/cuadernillo">
                      Ver en el cuadernillo<ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <div className="home-next__head">
                    <span className="home-next__icon home-next__icon--done"><Trophy size={18} aria-hidden="true" /></span>
                    <div>
                      <h2 id="home-next-title">¡Completaste el cuadernillo!</h2>
                      <small>Todos los requisitos de tu clase están firmados.</small>
                    </div>
                  </div>
                )}
              </section>
            )}

            {cuadernillo && (
              <section className="home-section home-section--areas" aria-labelledby="home-areas">
                <h2 id="home-areas">Tu avance por área</h2>
                <ul className="home-areas">
                  {cuadernillo.areas.map((area) => (
                    <li key={area.id}>
                      <div className="home-areas__row">
                        <span>{area.nombre.replace(/^[IVX]+\.\s*/, '')}</span>
                        <small>{area.hechos}/{area.total}</small>
                      </div>
                      <div className="home-areas__bar" aria-hidden="true">
                        <span style={{ width: `${(area.hechos / area.total) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="home-col">
            <div className="home-tiles">
              <Link className="home-tile home-tile--link" to="/medallero">
                <small>Especialidades</small>
                <strong>{especialidades}</strong>
                <ChevronRight className="home-tile__arrow" size={18} aria-hidden="true" />
              </Link>
              <div className="home-tile">
                <small>Mi unidad</small>
                <strong>{perfil.unidad?.nombre || 'Sin asignar'}</strong>
              </div>
            </div>

            <section className="home-section home-section--salida" aria-labelledby="home-salida">
              <h2 id="home-salida">Próxima salida</h2>
              {proxima ? (
                <div className="home-event">
                  <FechaChip valor={proxima.fecha_inicio} />
                  <div className="home-event__copy">
                    <strong>{proxima.titulo}</strong>
                    {detalleEvento(proxima) && <span>{detalleEvento(proxima)}</span>}
                  </div>
                </div>
              ) : (
                <div className="home-empty">
                  <Tent size={20} aria-hidden="true" />
                  <p>Todavía no hay salidas programadas. Cuando la dirección cargue una, aparece acá.</p>
                </div>
              )}
              {eventos.length > 1 && (
                <ul className="home-more-events">
                  {eventos.slice(1, 3).map((evento) => (
                    <li key={evento.id}>
                      <FechaChip valor={evento.fecha_inicio} />
                      <span>{evento.titulo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="home-section home-section--avisos" aria-labelledby="home-avisos">
              <h2 id="home-avisos">Avisos de tu unidad</h2>
              {anuncios.length === 0 ? (
                <div className="home-empty">
                  <Megaphone size={20} aria-hidden="true" />
                  <p>
                    {perfil.unidad
                      ? 'No hay avisos nuevos. Cuando tu consejero publique uno, lo vas a ver acá.'
                      : 'Cuando la dirección te asigne una unidad, vas a ver sus avisos acá.'}
                  </p>
                </div>
              ) : (
                <ul className="home-notice-list">
                  {anuncios.map((anuncio) => (
                    <li className="home-notice" key={anuncio.id}>
                      <strong>{anuncio.titulo}</strong>
                      {anuncio.contenido && <p>{anuncio.contenido}</p>}
                      <small>
                        {[anuncio.autor_nombre, haceCuanto(anuncio.fecha_publicacion)].filter(Boolean).join(' · ')}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
              {perfil.unidad && (
                <p className="home-notices__unit"><MapPin size={14} aria-hidden="true" />Unidad {perfil.unidad.nombre}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
