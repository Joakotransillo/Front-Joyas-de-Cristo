import { useEffect, useState } from 'react';
import { Award, CalendarDays, Compass, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { obtenerPerfil } from '../services/authService';
import ProfileSidebar from '../components/ProfileSidebar';
import './ProfilePage.css';

function fechaLegible(fecha) {
  if (!fecha) return '';
  const valor = fecha instanceof Date ? fecha.toISOString().slice(0, 10) : String(fecha).slice(0, 10);
  const parsed = new Date(valor + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(parsed);
}

export default function MedalleroPage() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((usuario) => { if (activo) setPerfil(usuario); })
      .catch((requestError) => {
        if (activo) setError(requestError?.response?.data?.mensaje || 'No pudimos cargar tu medallero.');
      });
    return () => { activo = false; };
  }, []);

  if (!perfil) {
    return (
      <main className="profile-page">
        <div className="profile-state" role={error ? 'alert' : 'status'}>
          {error ? <><ShieldCheck size={28} /><h1>No pudimos abrir el medallero</h1><p>{error}</p><Link to="/perfil">Volver a mi perfil</Link></> : <><span className="profile-spinner" /><p>Cargando tus insignias...</p></>}
        </div>
      </main>
    );
  }

  const especialidades = Array.isArray(perfil.especialidades) ? perfil.especialidades : [];

  return (
    <main className="profile-page medallero-page">
      <ProfileSidebar perfil={perfil} specialtyCount={especialidades.length} activePage="medallero" />
      <div className="profile-main">
        <div className="profile-shell">
          <header className="profile-topbar">
            <span className="profile-topbar__status"><i aria-hidden="true" /> CAMPAMENTO ACTIVO · MEDALLERO</span>
            <span className="profile-topbar__insignias"><Award size={16} aria-hidden="true" /> {especialidades.length} INSIGNIAS</span>
          </header>

          <section className="profile-hero medallero-hero" aria-labelledby="medallero-title">
            <svg className="profile-hero__landscape" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <path d="M0 128 92 79l85 36 113-69 108 73 91-47 116 58 106-81 106 66 97-42 116 59 88-38 102 49v77H0Z" fill="#7c9b7c" fillOpacity=".24" />
              <path d="m0 164 124-51 93 32 95-38 119 53 99-37 106 38 102-47 105 43 113-39 94 41 150-32v93H0Z" fill="#091d20" fillOpacity=".68" />
              <g fill="#081a1c" fillOpacity=".74"><path d="m111 158 17-31 17 31h-8l16 25h-50l16-25Zm91 15 13-24 13 24h-7l12 20h-36l12-20Zm728-8 18-32 18 32h-9l17 28h-52l17-28Zm91 11 14-25 14 25h-7l13 21h-40l13-21Z" /></g>
            </svg>
            <div className="medallero-hero__content">
              <span className="medallero-hero__emblem"><Award size={28} aria-hidden="true" /></span>
              <div>
                <span className="profile-eyebrow">REGISTRO DE INSIGNIAS · CUARTEL BASE</span>
                <h1 id="medallero-title">Mi medallero de campamento</h1>
                <p className="profile-hero__name">{perfil.nombre_completo} · Cada insignia cuenta una experiencia.</p>
              </div>
            </div>
            <div className="profile-hero__meta">
              <div><span>ESPECIALIDADES</span><strong>{especialidades.length} registradas</strong></div>
              <div><span>INTEGRANTE</span><strong>{perfil.rol}</strong></div>
            </div>
          </section>

          <section className="medallero-board" aria-labelledby="medallero-board-title">
            <header className="medallero-board__heading">
              <div><span className="profile-eyebrow profile-eyebrow--paper">INSIGNIAS APROBADAS</span><h2 id="medallero-board-title">Tu recorrido</h2></div>
              <span className="medallero-board__total"><Award size={16} /> {especialidades.length} EN TU FICHA</span>
            </header>
            {especialidades.length > 0 ? (
              <div className="medallero-grid">
                {especialidades.map((especialidad) => (
                  <article className="medallero-card" key={especialidad.id}>
                    <span className="medallero-card__seal"><Award size={25} aria-hidden="true" /></span>
                    <span className="medallero-card__ribbon">JOYAS DE CRISTO</span>
                    <h3>{especialidad.nombre}</h3>
                    <p>{especialidad.categoria || 'Especialidad aprobada'}</p>
                    {especialidad.fecha_completado && <span className="medallero-card__date"><CalendarDays size={13} /> {fechaLegible(especialidad.fecha_completado)}</span>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="medallero-empty">
                <span><Compass size={25} aria-hidden="true" /></span>
                <div><h3>Tu próxima insignia empieza con una aventura</h3><p>Todavía no hay especialidades aprobadas en tu ficha. Cuando la Dirección registre una, la vas a encontrar acá.</p></div>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}