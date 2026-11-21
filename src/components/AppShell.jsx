import { Award, BookOpen, House, Inbox, Medal, Settings, Users } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import brandLogo from '../assets/joyas-de-cristo-logo-256.png';
import { temaParaPerfil } from '../styles/temaClase';
import './AppShell.css';

// Secciones del menú. `roles` limita quién las ve; sin `roles`, las ven todos.
// Biblioteca se suma cuando exista su pantalla.
const SECCIONES = [
  { to: '/dashboard', etiqueta: 'Inicio', Icono: House, roles: ['CONQUISTADOR', 'DIRECTOR', 'SECRETARIA'] },
  { to: '/unidad', etiqueta: 'Mi unidad', Icono: Users, roles: ['CONSEJERO'] },
  { to: '/solicitudes', etiqueta: 'Solicitudes', Icono: Inbox, roles: ['DIRECTOR', 'SECRETARIA'] },
  { to: '/cuadernillo', etiqueta: 'Cuadernillo', Icono: BookOpen, roles: ['CONQUISTADOR'] },
  { to: '/especialidades', etiqueta: 'Especialidades', Icono: Medal },
  { to: '/medallero', etiqueta: 'Medallero', Icono: Award, roles: ['CONQUISTADOR'] }
];
// En la barra del celular se usa la etiqueta corta para que entren las cinco secciones.
const CONFIGURACION = { to: '/configuracion', etiqueta: 'Configuración', corta: 'Ajustes', Icono: Settings };

export function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((parte) => parte[0]).join('').toUpperCase() || 'JC';
}

/**
 * Estructura de las pantallas internas: menú lateral en computadora y barra inferior en celular.
 * Para un conquistador, toda la interfaz toma el color de su clase.
 */
export default function AppShell({ perfil, children }) {
  const nombre = perfil?.nombre_completo || '';
  // Mientras carga el perfil se muestra el menú del conquistador, que es el uso más común.
  const rol = perfil?.rol || 'CONQUISTADOR';
  const secciones = SECCIONES.filter((seccion) => !seccion.roles || seccion.roles.includes(rol));

  return (
    <div className="shell" style={temaParaPerfil(perfil)}>
      <aside className="shell-side">
        <Link className="shell-side__brand" to="/dashboard">
          <img src={brandLogo} alt="" width="40" height="40" />
          <span>
            <strong>Joyas de Cristo</strong>
            <small>Club de Conquistadores</small>
          </span>
        </Link>

        <nav className="shell-side__nav" aria-label="Secciones">
          {secciones.map(({ to, etiqueta, Icono }) => (
            <NavLink key={to} to={to} className="shell-side__link">
              <Icono size={20} aria-hidden="true" />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <NavLink className="shell-side__me" to={CONFIGURACION.to}>
          <span className="shell-avatar">{iniciales(nombre)}</span>
          <span className="shell-side__me-copy">
            <strong>{nombre || 'Mi cuenta'}</strong>
            <small>Configuración</small>
          </span>
          <Settings size={18} className="shell-side__me-icon" aria-hidden="true" />
        </NavLink>
      </aside>

      <div className="shell-main">{children}</div>

      <nav className="shell-tabs" aria-label="Secciones">
        {[...secciones, CONFIGURACION].map(({ to, etiqueta, corta, Icono }) => (
          <NavLink key={to} to={to} className="shell-tabs__link" aria-label={etiqueta}>
            <Icono size={22} aria-hidden="true" />
            <span aria-hidden="true">{corta || etiqueta}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
