import { useEffect, useState } from 'react';
import {
  Award, CalendarDays, CheckCircle2, Clock3, Compass, MapPin,
  Megaphone, RefreshCw, ShieldCheck, Sparkles
} from 'lucide-react';
import ProfileSidebar from '../components/ProfileSidebar';
import { obtenerInicioConquistador } from '../services/conquisService';
import './ProfilePage.css';
import './DashboardConquiPage.css';

function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((parte) => parte[0]).join('').toUpperCase() || 'JC';
}

function fechaLegible(valor, conHora = false) {
  if (!valor) return 'Fecha a confirmar';
  const fecha = new Date(typeof valor === 'string' ? valor.replace(' ', 'T') : valor);
  if (Number.isNaN(fecha.getTime())) return 'Fecha a confirmar';
  return new Intl.DateTimeFormat('es-AR', conHora
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(fecha);
}

const COLORES_CLASES = Object.freeze({ Amigo: '#1E40AF', Compañero: '#DC2626', Explorador: '#166534', Pionero: '#65A30D', Excursionista: '#7C3AED', Guía: '#CA8A04' });

function colorParaClase(clase) {
  const colorPersonalizado = clase?.color_insignia;
  if (typeof colorPersonalizado === 'string' && /^#[0-9a-f]{6}$/i.test(colorPersonalizado)) return colorPersonalizado;
  return COLORES_CLASES[clase?.nombre] || '#D98B38';
}

export default function DashboardConquiPage() {
  const [inicio, setInicio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');

    obtenerInicioConquistador()
      .then((datos) => { if (activo) setInicio(datos); })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar tu panel. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [intento]);

  if (cargando) {
    return <main className="conqui-fullstate" role="status" aria-live="polite"><span className="profile-spinner" /><p>Preparando tu bitácora...</p></main>;
  }

  if (error || !inicio?.perfil) {
    return (
      <main className="conqui-fullstate conqui-fullstate--error">
        <ShieldCheck size={30} aria-hidden="true" />
        <h1>No pudimos abrir tu panel</h1>
        <p role="alert">{error || 'No encontramos los datos de tu cuenta.'}</p>
        <button type="button" onClick={() => setIntento((actual) => actual + 1)}>
          <RefreshCw size={16} aria-hidden="true" /> Intentar de nuevo
        </button>
      </main>
    );
  }

  const perfil = inicio.perfil;
  const avance = inicio.avance_clase || {};
  const porcentaje = Math.max(0, Math.min(100, Number(avance.porcentaje) || 0));
  const completados = Number(avance.requisitos_completados) || 0;
  const total = Number(avance.total_requisitos) || 0;
  const especialidades = Number(perfil.especialidades_completadas) || 0;
  const colorClase = colorParaClase(perfil.clase);
  const eventos = Array.isArray(inicio.proximos_eventos) ? inicio.proximos_eventos : [];
  const anuncios = Array.isArray(inicio.anuncios) ? inicio.anuncios : [];
  const nombreCorto = perfil.nombre_completo?.trim().split(/\s+/)[0] || 'explorador';

  return (
    <main className="profile-page conqui-dashboard" style={{ '--class-color': colorClase }}>
      <ProfileSidebar perfil={perfil} specialtyCount={especialidades} activePage="inicio" />
      <div className="profile-main">
        <div className="profile-shell conqui-dashboard__shell">
          <header className="profile-topbar">
            <span className="profile-topbar__status"><i aria-hidden="true" /> CAMPAMENTO ACTIVO · BITÁCORA PERSONAL</span>
            <span className="profile-topbar__insignias"><Award size={16} /> {especialidades} ESPECIALIDADES</span>
          </header>

          <section className="conqui-hero" style={{ '--class-color': colorClase }} aria-labelledby="conqui-title">
            <div className="conqui-hero__identity">
              <div className="conqui-avatar" aria-hidden="true">{iniciales(perfil.nombre_completo)}<span><CheckCircle2 size={15} /></span></div>
              <div className="conqui-hero__copy">
                <span className="conqui-eyebrow"><Compass size={14} /> BITÁCORA DE CAMPO · CAMPAMENTO BASE</span>
                <h1 id="conqui-title">¡Hola, {nombreCorto}!</h1>
                <p>{perfil.nombre_completo} · Tu lugar en el club y tu próximo desafío.</p>
              </div>
            </div>

            <section className="conqui-progress-card" aria-label="Progreso de la clase">
              <div className="conqui-progress-card__top">
                <span className="conqui-progress-card__seal"><Sparkles size={18} /></span>
                <div><span>AVANCE DE CLASE</span><strong>{perfil.clase?.nombre || 'Clase pendiente'}</strong></div>
              </div>
              <div className="conqui-progress-card__number"><strong>{porcentaje}%</strong><span>del recorrido completado</span></div>
              <div className="conqui-progress-track" role="progressbar" aria-label="Porcentaje de requisitos completados" aria-valuemin="0" aria-valuemax="100" aria-valuenow={porcentaje}>
                <span style={{ width: porcentaje + '%' }} />
              </div>
              <div className="conqui-progress-card__footer"><span>{completados} firmados</span><span>{total} requisitos</span></div>
            </section>

            <svg className="conqui-hero__landscape" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <path d="M0 120 120 74l90 34 108-54 110 67 96-48 115 59 108-72 110 61 105-43 105 53 133-37v106H0Z" fill="#6f8b6e" fillOpacity=".3" />
              <path d="m0 157 126-45 103 34 106-40 119 51 101-39 111 38 122-47 110 42 113-35 93 39 96-23v68H0Z" fill="#071d1b" fillOpacity=".75" />
              <g fill="#061917" fillOpacity=".8"><path d="m119 154 15-28 15 28h-7l14 23h-44l14-23Zm96 16 12-23 12 23h-6l11 18h-34l11-18Zm772-13 17-31 17 31h-8l16 26h-50l16-26Zm91 10 13-24 13 24h-6l12 19h-38l12-19Z" /></g>
            </svg>
          </section>

          <section className="conqui-highlights" aria-label="Resumen de tu perfil">
            <article className="conqui-highlight"><span className="conqui-highlight__icon"><Compass size={18} /></span><div><small>MI CLASE</small><strong>{perfil.clase?.nombre || 'Pendiente de asignar'}</strong></div></article>
            <article className="conqui-highlight"><span className="conqui-highlight__icon conqui-highlight__icon--gold"><Award size={18} /></span><div><small>ESPECIALIDADES</small><strong>{especialidades} completadas</strong></div></article>
            <article className="conqui-highlight"><span className="conqui-highlight__icon conqui-highlight__icon--light"><ShieldCheck size={18} /></span><div><small>MI UNIDAD</small><strong>{perfil.unidad?.nombre || 'Aún sin asignar'}</strong></div></article>
          </section>

          <div className="conqui-panels">
            <section className="conqui-panel conqui-panel--notices" aria-labelledby="conqui-notices-title">
              <header className="conqui-panel__heading">
                <span className="conqui-panel__emblem"><Megaphone size={19} /></span>
                <div><span className="conqui-eyebrow conqui-eyebrow--paper">COMUNICACIONES OFICIALES</span><h2 id="conqui-notices-title">Avisos de tu unidad</h2></div>
                <span className="conqui-count">{anuncios.length}</span>
              </header>
              {anuncios.length === 0 ? (
                <div className="conqui-empty"><span><Megaphone size={19} /></span><div><strong>{perfil.unidad ? 'Todavía no hay avisos nuevos' : 'Tu ficha aún no tiene unidad asignada'}</strong><p>{perfil.unidad ? 'Cuando tu consejero publique una comunicación, la vas a encontrar acá.' : 'La Dirección puede asignarte una unidad para recibir sus avisos.'}</p></div></div>
              ) : (
                <div className="conqui-notice-list">
                  {anuncios.map((anuncio) => (
                    <article className="conqui-notice" key={anuncio.id}>
                      <div className="conqui-notice__pin" aria-hidden="true" />
                      <div className="conqui-notice__head"><h3>{anuncio.titulo}</h3><span>{fechaLegible(anuncio.fecha_publicacion)}</span></div>
                      <p>{anuncio.contenido}</p>
                      {anuncio.autor_nombre && <small>Publicado por {anuncio.autor_nombre}</small>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="conqui-panel conqui-panel--events" aria-labelledby="conqui-events-title">
              <header className="conqui-panel__heading">
                <span className="conqui-panel__emblem conqui-panel__emblem--gold"><CalendarDays size={19} /></span>
                <div><span className="conqui-eyebrow conqui-eyebrow--paper">PRÓXIMAS SALIDAS</span><h2 id="conqui-events-title">Calendario del club</h2></div>
              </header>
              {eventos.length === 0 ? (
                <div className="conqui-empty conqui-empty--compact"><span><CalendarDays size={19} /></span><div><strong>Sin eventos próximos</strong><p>El calendario se actualizará cuando haya nuevas actividades.</p></div></div>
              ) : (
                <div className="conqui-event-list">
                  {eventos.map((evento) => (
                    <article className="conqui-event" key={evento.id}>
                      <span className="conqui-event__icon"><CalendarDays size={16} /></span>
                      <div className="conqui-event__copy">
                        <h3>{evento.titulo}</h3>
                        <p><Clock3 size={13} /> {fechaLegible(evento.fecha_inicio, true)}</p>
                        {evento.lugar && <p><MapPin size={13} /> {evento.lugar}</p>}
                        {evento.descripcion && <small>{evento.descripcion}</small>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>

        </div>
      </div>
    </main>
  );
}
