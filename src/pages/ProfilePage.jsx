import { useEffect, useState } from 'react';
import {
  Award, BadgeCheck, Check, CircleUserRound, Compass,
  KeyRound, Mail, MapPin, ShieldCheck, UsersRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { actualizarPerfil, cambiarContrasena, obtenerPerfil } from '../services/authService';
import ProfileSidebar from '../components/ProfileSidebar';
import './ProfilePage.css';

function fechaParaInput(fecha) {
  if (!fecha) return '';
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  return String(fecha).slice(0, 10);
}

function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return hoy.getFullYear() + '-' + mes + '-' + dia;
}
function iniciales(nombre = '') {
  return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'JC';
}

function mensajeError(error, fallback) {
  return error?.response?.data?.mensaje || fallback;
}

export default function ProfilePage() {
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState({ nombre_completo: '', email: '', fecha_nacimiento: '' });
  const [password, setPassword] = useState({ actual: '', nueva: '', confirmar: '' });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((usuario) => {
        if (!activo) return;
        setPerfil(usuario);
        setDatos({
          nombre_completo: usuario.nombre_completo || '',
          email: usuario.email || '',
          fecha_nacimiento: fechaParaInput(usuario.fecha_nacimiento)
        });
      })
      .catch((error) => {
        if (activo) setErrorCarga(mensajeError(error, 'No pudimos cargar tu perfil. Revisá tu conexión e intentá de nuevo.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, []);

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrorPerfil('');
    setAviso('');
  };

  const guardarDatos = async (event) => {
    event.preventDefault();
    setErrorPerfil('');
    setAviso('');

    const nombre = datos.nombre_completo.trim();
    const email = datos.email.trim().toLowerCase();
    if (nombre.length < 2 || nombre.length > 150) {
      setErrorPerfil('El nombre debe tener entre 2 y 150 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
      setErrorPerfil('Ingresá un correo electrónico válido.');
      return;
    }

    setGuardandoPerfil(true);
    try {
      const respuesta = await actualizarPerfil({
        nombre_completo: nombre,
        email,
        fecha_nacimiento: datos.fecha_nacimiento || null
      });
      setPerfil((actual) => ({ ...actual, ...respuesta.usuario }));
      setDatos((actual) => ({ ...actual, nombre_completo: nombre, email }));
      setAviso('Tus datos personales se actualizaron correctamente.');
    } catch (error) {
      const status = error?.response?.status;
      setErrorPerfil(status === 409
        ? 'Ese correo ya está asociado a otra cuenta.'
        : mensajeError(error, 'No pudimos guardar los cambios. Intentá de nuevo.'));
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const actualizarPassword = (event) => {
    const { name, value } = event.target;
    setPassword((actual) => ({ ...actual, [name]: value }));
    setErrorPassword('');
    setAviso('');
  };

  const guardarPassword = async (event) => {
    event.preventDefault();
    setErrorPassword('');
    setAviso('');

    if (!password.actual) {
      setErrorPassword('Ingresá tu contraseña actual.');
      return;
    }
    if (password.nueva.length < 8 || new TextEncoder().encode(password.nueva).length > 72) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres y hasta 72 bytes.');
      return;
    }
    if (password.nueva !== password.confirmar) {
      setErrorPassword('Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoPassword(true);
    try {
      await cambiarContrasena({ password_actual: password.actual, password_nueva: password.nueva });
      setPassword({ actual: '', nueva: '', confirmar: '' });
      setAviso('Tu contraseña se cambió correctamente.');
    } catch (error) {
      setErrorPassword(mensajeError(error, 'No pudimos cambiar la contraseña. Revisá la actual e intentá de nuevo.'));
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (cargando) {
    return <main className="profile-page"><div className="profile-state"><span className="profile-spinner" /><p>Cargando tu ficha...</p></div></main>;
  }

  if (errorCarga || !perfil) {
    return (
      <main className="profile-page">
        <div className="profile-state profile-state--error">
          <ShieldCheck size={28} aria-hidden="true" />
          <h1>No pudimos abrir tu perfil</h1>
          <p>{errorCarga || 'No encontramos los datos de tu cuenta.'}</p>
          <Link to="/dashboard">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const esDirector = perfil.rol === 'DIRECTOR';
  const especialidades = Array.isArray(perfil.especialidades) ? perfil.especialidades : [];
  const nombreCorto = perfil.nombre_completo?.trim().split(/\s+/)[0] || 'integrante';
  return (
    <main className="profile-page">
      <ProfileSidebar perfil={perfil} specialtyCount={especialidades.length} />
      <div className="profile-main profile-main--profile">
        <div className="profile-shell">
        <header className="profile-topbar">
          <span className="profile-topbar__status"><i aria-hidden="true" /> CAMPAMENTO ACTIVO · FICHA PERSONAL</span>
          <span className={especialidades.length ? 'profile-topbar__insignias' : 'profile-topbar__insignias is-empty'}><Award size={16} aria-hidden="true" /> {especialidades.length} INSIGNIAS</span>
        </header>

        <section className="profile-hero" aria-labelledby="profile-title">
          <svg className="profile-hero__landscape" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <path d="M0 128 92 79l85 36 113-69 108 73 91-47 116 58 106-81 106 66 97-42 116 59 88-38 102 49v77H0Z" fill="#7c9b7c" fillOpacity=".24" />
            <path d="m0 164 124-51 93 32 95-38 119 53 99-37 106 38 102-47 105 43 113-39 94 41 150-32v93H0Z" fill="#091d20" fillOpacity=".68" />
            <g fill="#081a1c" fillOpacity=".74"><path d="m111 158 17-31 17 31h-8l16 25h-50l16-25Zm91 15 13-24 13 24h-7l12 20h-36l12-20Zm728-8 18-32 18 32h-9l17 28h-52l17-28Zm91 11 14-25 14 25h-7l13 21h-40l13-21Z" /></g>
            <g fill="#f0d28a"><circle cx="188" cy="55" r="2" /><circle cx="744" cy="38" r="2" /><circle cx="1020" cy="78" r="1.7" /></g>
          </svg>
          <div className="profile-hero__identity">
            <div className="profile-avatar" aria-hidden="true">
              <span>{iniciales(perfil.nombre_completo)}</span>
              <span className="profile-avatar__patch"><BadgeCheck size={16} /></span>
            </div>
            <div className="profile-hero__copy">
              <span className="profile-eyebrow">BITÁCORA DE CAMPO · CAMPAMENTO BASE</span>
              <h1 id="profile-title">¡Hola, {nombreCorto}!</h1>
              <p className="profile-hero__name">{perfil.nombre_completo} · Tu recorrido en el club</p>
            </div>
          </div>
        </section>

        {aviso && <div className="profile-notice" role="status" aria-live="polite"><Check size={17} /> {aviso}</div>}
        <div className="profile-grid">
          <section className="profile-card profile-card--personal" aria-labelledby="personal-title">
            <header className="profile-card__heading">
              <span className="profile-card__icon"><CircleUserRound size={19} /></span>
              <div><h2 id="personal-title">Datos personales</h2><p>Actualizá tu información de contacto.</p></div>
            </header>

            <form className="profile-form" onSubmit={guardarDatos} noValidate>
              <div className="profile-field">
                <label htmlFor="profile-name">Nombre completo</label>
                <div className="profile-input"><UsersRound size={17} aria-hidden="true" />
                  <input id="profile-name" name="nombre_completo" type="text" autoComplete="name" maxLength={150}
                    value={datos.nombre_completo} onChange={actualizarCampo} required />
                </div>
              </div>
              <div className="profile-field">
                <label htmlFor="profile-email">Correo electrónico</label>
                <div className="profile-input"><Mail size={17} aria-hidden="true" />
                  <input id="profile-email" name="email" type="email" autoComplete="email" maxLength={150}
                    value={datos.email} onChange={actualizarCampo} required />
                </div>
              </div>
              <div className="profile-field">
                <label htmlFor="profile-birthday">Fecha de nacimiento <span>OPCIONAL</span></label>
                <div className="profile-input profile-input--date">
                  <input id="profile-birthday" name="fecha_nacimiento" type="date" max={fechaDeHoy()}
                    value={datos.fecha_nacimiento} onChange={actualizarCampo} />
                </div>
              </div>

              {errorPerfil && <p className="profile-error" role="alert">{errorPerfil}</p>}
              <button className="profile-submit" type="submit" disabled={guardandoPerfil}>
                {guardandoPerfil ? 'Guardando cambios...' : 'Guardar datos personales'}
              </button>
            </form>
          </section>

          <aside className="profile-card profile-card--membership" aria-labelledby="membership-title">
            <header className="profile-card__heading">
              <span className="profile-card__icon profile-card__icon--gold"><ShieldCheck size={19} /></span>
              <div><h2 id="membership-title">Mi lugar en el club</h2><p>Información asignada por la Dirección.</p></div>
            </header>
            <dl className="profile-facts">
              <div><dt><BadgeCheck size={16} /> Rol</dt><dd>{perfil.rol}</dd></div>
              {esDirector ? (
                <>
                  <div><dt><Compass size={16} /> Función</dt><dd>Dirección del club</dd></div>
                  <div><dt><MapPin size={16} /> Unidad</dt><dd>No corresponde a tu rol</dd></div>
                  <div><dt><UsersRound size={16} /> Clase</dt><dd>No corresponde a tu rol</dd></div>
                </>
              ) : (
                <>
                  <div><dt><MapPin size={16} /> Unidad</dt><dd>{perfil.unidad?.nombre || 'Sin asignar'}</dd></div>
                  <div><dt><UsersRound size={16} /> Clase</dt><dd>{perfil.clase?.nombre || 'Sin asignar'}</dd></div>
                </>
              )}
              <div><dt><CircleUserRound size={16} /> N.º de integrante</dt><dd>#{perfil.id}</dd></div>
            </dl>
            <p className="profile-readonly"><ShieldCheck size={15} /> {esDirector
              ? 'Tu rol de Dirección no se asocia a una clase ni a una unidad.'
              : 'Tu clase y unidad son asignadas por la Dirección del club.'}</p>
          </aside>

          <section className="profile-card profile-card--security" aria-labelledby="security-title">
            <header className="profile-card__heading">
              <span className="profile-card__icon profile-card__icon--dark"><KeyRound size={19} /></span>
              <div><h2 id="security-title">Seguridad de la cuenta</h2><p>Elegí una contraseña nueva para proteger tu acceso.</p></div>
            </header>
            <form className="profile-form profile-form--password" onSubmit={guardarPassword} noValidate>
              <div className="profile-field">
                <label htmlFor="password-current">Contraseña actual</label>
                <div className="profile-input"><KeyRound size={17} aria-hidden="true" />
                  <input id="password-current" name="actual" type="password" autoComplete="current-password"
                    value={password.actual} onChange={actualizarPassword} />
                </div>
              </div>
              <div className="profile-password-row">
                <div className="profile-field">
                  <label htmlFor="password-new">Nueva contraseña</label>
                  <div className="profile-input"><KeyRound size={17} aria-hidden="true" />
                    <input id="password-new" name="nueva" type="password" autoComplete="new-password"
                      value={password.nueva} onChange={actualizarPassword} />
                  </div>
                </div>
                <div className="profile-field">
                  <label htmlFor="password-confirm">Repetí la nueva contraseña</label>
                  <div className="profile-input"><KeyRound size={17} aria-hidden="true" />
                    <input id="password-confirm" name="confirmar" type="password" autoComplete="new-password"
                      value={password.confirmar} onChange={actualizarPassword} />
                  </div>
                </div>
              </div>
              <p className="profile-password-help">Usá al menos 8 caracteres. Te pediremos tu contraseña actual antes de guardar.</p>
              {errorPassword && <p className="profile-error" role="alert">{errorPassword}</p>}
              <button className="profile-submit profile-submit--dark" type="submit" disabled={guardandoPassword}>
                {guardandoPassword ? 'Actualizando contraseña...' : 'Cambiar contraseña'}
              </button>
            </form>
          </section>
        </div>

      </div>
      </div>
    </main>
  );
}