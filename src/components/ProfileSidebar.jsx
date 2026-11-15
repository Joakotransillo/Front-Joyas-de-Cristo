import { Award, BookOpen, Compass, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/joyas-de-cristo-logo.png';

function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'JC';
}

export default function ProfileSidebar({ perfil, specialtyCount, activePage = 'perfil' }) {
  const esDirector = perfil.rol === 'DIRECTOR';
  const afiliacion = esDirector
    ? 'Dirección del club'
    : perfil.clase?.nombre || 'Integrante del club';
  const etiquetaAfiliacion = esDirector ? 'FUNCIÓN' : 'UNIDAD';
  const unidad = esDirector ? 'DIRECCIÓN DEL CLUB' : perfil.unidad?.nombre || 'SIN UNIDAD ASIGNADA';

  return (
    <aside className="profile-sidebar">
      <Link className="profile-sidebar__brand" to="/dashboard">
        <img src={brandLogo} alt="" />
        <span><strong>JOYAS DE CRISTO</strong><small>CAMPAMENTO BASE</small></span>
      </Link>
      <p className="profile-sidebar__tag">CLUB DE CONQUISTADORES</p>

      <div className="profile-sidebar__camp-label">
        <Compass size={15} aria-hidden="true" />
        <span>MI CAMPAMENTO</span>
        <small>RUTA DE AVENTURA</small>
      </div>

      <nav className="profile-sidebar__nav" aria-label="Navegación del campamento">
        <Link to="/dashboard" aria-current={activePage === 'inicio' ? 'page' : undefined}><Compass size={18} aria-hidden="true" /><span>Inicio</span></Link>
        <Link to="/cuadernillo" aria-current={activePage === 'cuadernillo' ? 'page' : undefined}><BookOpen size={18} aria-hidden="true" /><span>Mi cuadernillo</span></Link>
        <Link to="/medallero" aria-current={activePage === 'medallero' ? 'page' : undefined}><Award size={18} aria-hidden="true" /><span>Mi medallero</span><small>{specialtyCount}</small></Link>
        <Link to="/perfil" aria-current={activePage === 'perfil' ? 'page' : undefined}><UserRound size={18} aria-hidden="true" /><span>Mi perfil</span></Link>
      </nav>

      {activePage === 'perfil' && (
        <div className="profile-sidebar__profile-tip">
          <span><Compass size={16} aria-hidden="true" /></span>
          <div><strong>FICHA DE RUTA</strong><small>Revisá tus datos antes de la próxima salida.</small></div>
        </div>
      )}

      <div className="profile-sidebar__bottom">
        <div className="profile-sidebar__user">
          <span className="profile-sidebar__avatar">{iniciales(perfil.nombre_completo)}</span>
          <span className="profile-sidebar__user-copy">
            <strong>{perfil.nombre_completo}</strong>
            <small>{afiliacion}</small>
          </span>
        </div>
        <div className="profile-sidebar__unit"><span>{etiquetaAfiliacion}</span><strong>{unidad}</strong></div>
        </div>
    </aside>
  );
}