import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Compass,
  RefreshCw, ShieldCheck, Sparkles
} from 'lucide-react';
import ProfileSidebar from '../components/ProfileSidebar';
import { obtenerPerfil } from '../services/authService';
import { actualizarLecturaBiblica, obtenerCuadernilloConquistador } from '../services/cuadernilloService';
import './ProfilePage.css';
import './CuadernilloPage.css';

const COLORES_CLASES = Object.freeze({
  Amigo: '#1E40AF',
  Compañero: '#DC2626',
  Explorador: '#166534',
  Pionero: '#65A30D',
  Excursionista: '#7C3AED',
  Guía: '#CA8A04'
});

function colorParaClase(clase) {
  const color = clase?.color_insignia;
  if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) return color;
  return COLORES_CLASES[clase?.nombre] || '#D98B38';
}

function fechaLegible(valor) {
  if (!valor) return '';
  const fecha = new Date(typeof valor === 'string' ? valor.replace(' ', 'T') : valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(fecha);
}

function mensajeError(error) {
  return error?.response?.data?.mensaje
    || 'No pudimos cargar tu cuadernillo. Revisá la conexión e intentá de nuevo.';
}

export default function CuadernilloPage() {
  const [datos, setDatos] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [lecturasPorRequisito, setLecturasPorRequisito] = useState({});
  const [lecturasGuardando, setLecturasGuardando] = useState({});
  const [erroresLectura, setErroresLectura] = useState({});
  const [tipoSeleccionado, setTipoSeleccionado] = useState('REGULAR');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const referenciasPestanas = useRef([]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');

    Promise.all([obtenerCuadernilloConquistador(), obtenerPerfil()])
      .then(([cuadernillo, usuario]) => {
        if (!activo) return;
        setDatos(cuadernillo);
        setPerfil(usuario);
        const lecturasIniciales = {};
        for (const cuadernilloCargado of cuadernillo.cuadernillos || []) {
          for (const categoria of cuadernilloCargado.categorias || []) {
            for (const requisito of categoria.requisitos || []) {
              lecturasIniciales[requisito.id] = Array.isArray(requisito.lecturas_completadas)
                ? requisito.lecturas_completadas
                : [];
            }
          }
        }
        setLecturasPorRequisito(lecturasIniciales);
        setErroresLectura({});
      })
      .catch((fallo) => {
        if (activo) setError(mensajeError(fallo));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [intento]);

  const cuadernillos = Array.isArray(datos?.cuadernillos) ? datos.cuadernillos : [];
  const cuadernilloActivo = cuadernillos.find((item) => item.tipo === tipoSeleccionado)
    || cuadernillos[0]
    || null;
  const categorias = Array.isArray(cuadernilloActivo?.categorias) ? cuadernilloActivo.categorias : [];
  const categoriaActiva = categorias.find((item) => item.id === categoriaSeleccionada) || categorias[0] || null;

  const resumen = useMemo(() => {
    const requisitos = cuadernillos.flatMap((cuadernillo) => (
      Array.isArray(cuadernillo.categorias)
        ? cuadernillo.categorias.flatMap((categoria) => categoria.requisitos || [])
        : []
    ));
    const aprobados = requisitos.filter((requisito) => requisito.firmado || requisito.completado).length;
    return {
      total: requisitos.length,
      aprobados,
      porcentaje: requisitos.length ? Math.round((aprobados / requisitos.length) * 100) : 0
    };
  }, [cuadernillos]);

  const actualizarLectura = async (requisitoId, referencia, completado) => {
    const anteriores = lecturasPorRequisito[requisitoId] || [];
    const actualizadas = new Set(anteriores);
    if (completado) actualizadas.add(referencia);
    else actualizadas.delete(referencia);

    setErroresLectura((actuales) => ({ ...actuales, [requisitoId]: '' }));
    setLecturasPorRequisito((actuales) => ({ ...actuales, [requisitoId]: [...actualizadas] }));
    setLecturasGuardando((actuales) => ({ ...actuales, [requisitoId]: true }));

    try {
      await actualizarLecturaBiblica(requisitoId, referencia, completado);
    } catch (fallo) {
      setLecturasPorRequisito((actuales) => ({ ...actuales, [requisitoId]: anteriores }));
      setErroresLectura((actuales) => ({
        ...actuales,
        [requisitoId]: fallo?.response?.data?.mensaje || 'No pudimos guardar esta lectura. Intentá de nuevo.'
      }));
    } finally {
      setLecturasGuardando((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[requisitoId];
        return siguientes;
      });
    }
  };
  if (cargando) {
    return <main className="booklet-state" role="status" aria-live="polite"><span className="profile-spinner" /><p>Abriendo tu cuadernillo...</p></main>;
  }

  if (error || !datos || !perfil) {
    return (
      <main className="booklet-state booklet-state--error">
        <ShieldCheck size={30} aria-hidden="true" />
        <h1>No pudimos abrir tu cuadernillo</h1>
        <p role="alert">{error || 'No encontramos los datos de tu cuenta.'}</p>
        <button type="button" onClick={() => setIntento((actual) => actual + 1)}>
          <RefreshCw size={16} aria-hidden="true" /> Intentar de nuevo
        </button>
      </main>
    );
  }

  if (!cuadernilloActivo) {
    return (
      <main className="booklet-state booklet-state--error">
        <BookOpen size={30} aria-hidden="true" />
        <h1>Tu clase todavía no tiene cuadernillos</h1>
        <p>Cuando se cargue el material de {datos.clase?.nombre || 'tu clase'}, lo vas a encontrar acá.</p>
      </main>
    );
  }

  const clase = datos.clase || perfil.clase;
  const colorClase = colorParaClase(clase);
  const especialidades = Array.isArray(perfil.especialidades) ? perfil.especialidades.length : 0;
  const requisitosActivos = Array.isArray(categoriaActiva?.requisitos) ? categoriaActiva.requisitos : [];
  const aprobadosActivos = requisitosActivos.filter((requisito) => requisito.firmado || requisito.completado).length;
  const tiposDisponibles = [...new Set(cuadernillos.map((item) => item.tipo))];
  const nombreTipo = cuadernilloActivo.tipo === 'AVANZADA' ? 'Avanzada' : 'Regular';

  const seleccionarConTeclado = (event, indice) => {
    let siguiente = indice;
    if (event.key === 'ArrowRight') siguiente = (indice + 1) % categorias.length;
    else if (event.key === 'ArrowLeft') siguiente = (indice - 1 + categorias.length) % categorias.length;
    else if (event.key === 'Home') siguiente = 0;
    else if (event.key === 'End') siguiente = categorias.length - 1;
    else return;

    event.preventDefault();
    setCategoriaSeleccionada(categorias[siguiente].id);
    referenciasPestanas.current[siguiente]?.focus();
  };

  return (
    <main className="profile-page booklet-page" style={{ '--class-color': colorClase }}>
      <ProfileSidebar perfil={perfil} specialtyCount={especialidades} activePage="cuadernillo" />
      <div className="profile-main">
        <div className="profile-shell booklet-shell">
          <header className="profile-topbar">
            <span className="profile-topbar__status"><i aria-hidden="true" /> RUMBO DE AVENTURA · CLASE {clase?.nombre || 'SIN ASIGNAR'}</span>
            <span className="profile-topbar__insignias"><Award size={16} aria-hidden="true" /> {resumen.aprobados} / {resumen.total} PUNTOS</span>
          </header>

          <section className="booklet-hero" aria-labelledby="booklet-title">
            <div className="booklet-hero__copy">
              <span className="booklet-eyebrow"><Compass size={14} /> TU MAPA DE AVENTURAS</span>
              <h1 id="booklet-title">Mi cuadernillo de aventuras</h1>
              <p>Elegí una sección, completá los desafíos y celebrá cada avance.</p>
              <span className="booklet-class-chip"><Sparkles size={15} /> CLASE {clase?.nombre || 'SIN ASIGNAR'}</span>
            </div>
            <div className="booklet-progress">
              <div className="booklet-progress__top">
                <span className="booklet-progress__seal"><ClipboardList size={19} /></span>
                <div><small>TU AVENTURA VA</small><strong>{resumen.porcentaje}%</strong></div>
              </div>
              <div className="booklet-progress__track" role="progressbar" aria-label="Porcentaje aprobado del cuadernillo" aria-valuemin="0" aria-valuemax="100" aria-valuenow={resumen.porcentaje}>
                <span style={{ width: resumen.porcentaje + '%' }} />
              </div>
              <div className="booklet-progress__legend"><span>{resumen.aprobados} aprobados</span><span>{resumen.total} requisitos</span></div>
            </div>
            <svg className="booklet-hero__landscape" viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <path d="M0 98 96 61l102 34 95-49 103 62 95-40 115 48 111-61 106 48 95-39 121 49 91-30 70 28v59H0Z" fill="#85977c" fillOpacity=".28" />
              <path d="m0 130 119-38 96 28 110-36 111 43 96-34 126 37 111-41 117 36 100-29 113 33 101-21v62H0Z" fill="#071b1a" fillOpacity=".78" />
              <g fill="#061816" fillOpacity=".83"><path d="m132 128 15-27 15 27h-7l13 20h-42l13-20Zm100 10 12-22 12 22h-6l10 17h-38l10-17Zm747-13 18-32 18 32h-9l16 25h-50l16-25Zm102 12 13-23 13 23h-6l11 18h-36l11-18Z" /></g>
            </svg>
          </section>

          <section className="booklet-switch" aria-label="Tipo de cuadernillo">
            <div><span className="booklet-eyebrow booklet-eyebrow--paper">ELEGÍ TU MISIÓN</span><strong>Elegí el recorrido</strong></div>
            <div className="booklet-switch__buttons" role="group" aria-label="Seleccionar etapa">
              {tiposDisponibles.map((tipo) => (
                <button
                  className={cuadernilloActivo.tipo === tipo ? 'is-active' : ''}
                  key={tipo}
                  type="button"
                  aria-pressed={cuadernilloActivo.tipo === tipo}
                  onClick={() => setTipoSeleccionado(tipo)}
                >
                  <BookOpen size={16} aria-hidden="true" /> {tipo === 'AVANZADA' ? 'Avanzada' : 'Regular'}
                </button>
              ))}
            </div>
          </section>

          {categorias.length === 0 ? (
            <section className="booklet-empty" aria-live="polite">
              <span><BookOpen size={22} /></span>
              <h2>Todavía no hay misiones en esta etapa</h2>
              <p>El cuadernillo {nombreTipo.toLowerCase()} de {clase?.nombre || 'tu clase'} todavía no tiene requisitos cargados.</p>
            </section>
          ) : (
            <section className="booklet-workspace" aria-label="Secciones del cuadernillo">
              <div className="booklet-workspace__top">
                <div><span className="booklet-eyebrow booklet-eyebrow--paper">TU RECORRIDO · {nombreTipo.toUpperCase()}</span><h2>Elegí una sección</h2></div>
                <span className="booklet-category-total">{categorias.length} {categorias.length === 1 ? 'sección' : 'secciones'}</span>
              </div>

              <div className="booklet-tabs" role="tablist" aria-label="Secciones">
                {categorias.map((categoria, indice) => {
                  const requisitos = Array.isArray(categoria.requisitos) ? categoria.requisitos : [];
                  const firmados = requisitos.filter((requisito) => requisito.firmado || requisito.completado).length;
                  const activa = categoriaActiva?.id === categoria.id;
                  return (
                    <button
                      className={activa ? 'booklet-tab is-active' : 'booklet-tab'}
                      id={'booklet-tab-' + categoria.id}
                      key={categoria.id}
                      ref={(elemento) => { referenciasPestanas.current[indice] = elemento; }}
                      type="button"
                      role="tab"
                      aria-selected={activa}
                      aria-controls={'booklet-panel-' + categoria.id}
                      tabIndex={activa ? 0 : -1}
                      onClick={() => setCategoriaSeleccionada(categoria.id)}
                      onKeyDown={(event) => seleccionarConTeclado(event, indice)}
                    >
                      <span className="booklet-tab__order">{String(categoria.orden).padStart(2, '0')}</span>
                      <span className="booklet-tab__copy"><strong>{categoria.nombre}</strong><small>{firmados}/{requisitos.length} aprobados</small></span>
                    </button>
                  );
                })}
              </div>

              {categoriaActiva && (
                <section className="booklet-section" id={'booklet-panel-' + categoriaActiva.id} role="tabpanel" aria-labelledby={'booklet-tab-' + categoriaActiva.id} tabIndex="0">
                  <header className="booklet-section__heading">
                    <div><span className="booklet-eyebrow booklet-eyebrow--paper">TU DESAFÍO {String(categoriaActiva.orden).padStart(2, '0')}</span><h3>{categoriaActiva.nombre}</h3></div>
                    <span className="booklet-section__score"><CheckCircle2 size={15} aria-hidden="true" /> {aprobadosActivos} de {requisitosActivos.length} firmados</span>
                  </header>

                  {requisitosActivos.length === 0 ? (
                    <div className="booklet-empty booklet-empty--section"><ClipboardList size={23} /><p>Esta sección todavía no tiene puntos cargados.</p></div>
                  ) : (
                    <ol className="booklet-requirements">
                      {requisitosActivos.map((requisito) => {
                        const aprobado = Boolean(requisito.firmado || requisito.completado);
                        const referenciasLectura = Array.isArray(requisito.referencias_lectura) ? requisito.referencias_lectura : [];
                        const lecturasGuardadas = lecturasPorRequisito[requisito.id] || requisito.lecturas_completadas || [];
                        const guardandoLecturas = Boolean(lecturasGuardando[requisito.id]);
                        return (
                          <li className={aprobado ? 'booklet-requirement is-approved' : 'booklet-requirement'} key={requisito.id}>
                            <span className="booklet-requirement__number">{String(requisito.numero_item).padStart(2, '0')}</span>
                            <div className="booklet-requirement__body">
                              {referenciasLectura.length > 0 ? (
                                <div className="booklet-reading">
                                  <div className="booklet-reading__top">
                                    <p>{requisito.descripcion.split(':')[0]}</p>
                                    <span>{aprobado ? 'Lecturas verificadas' : lecturasGuardadas.length + ' de ' + referenciasLectura.length + ' leídos'}</span>
                                  </div>
                                  <div className="booklet-reading__grid" role="group" aria-label="Lecturas bíblicas del punto 3">
                                    {referenciasLectura.map((referencia) => {
                                      const marcada = aprobado || lecturasGuardadas.includes(referencia);
                                      return (
                                        <label className={marcada ? 'booklet-reading__item is-read' : 'booklet-reading__item'} key={referencia}>
                                          <input
                                            type="checkbox"
                                            checked={marcada}
                                            disabled={aprobado || guardandoLecturas}
                                            aria-label={'Lectura ' + referencia}
                                            onChange={(event) => actualizarLectura(requisito.id, referencia, event.target.checked)}
                                          />
                                          <span>{referencia}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {erroresLectura[requisito.id] && <p className="booklet-reading__error" role="alert">{erroresLectura[requisito.id]}</p>}
                                </div>
                              ) : (
                                <p>{requisito.descripcion}</p>
                              )}
                              {aprobado && requisito.fecha_firma && <small><CalendarDays size={13} aria-hidden="true" /> Firmado el {fechaLegible(requisito.fecha_firma)}</small>}
                            </div>
                            <span className={aprobado ? 'booklet-status is-approved' : 'booklet-status'}>
                              {aprobado ? <><CheckCircle2 size={15} aria-hidden="true" /> Aprobado</> : <><span className="booklet-status__dot" /> Pendiente</>}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              )}
            </section>
          )}

        </div>
      </div>
    </main>
  );
}
