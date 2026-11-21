import { useEffect, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, KeyRound, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell, { iniciales } from '../components/AppShell';
import { actualizarPerfil, cambiarContrasena, cerrarSesion, obtenerPerfil } from '../services/authService';
import './ConfiguracionPage.css';

const NOMBRES_ROL = {
  DIRECTOR: 'Dirección del club',
  CONSEJERO: 'Consejero',
  SECRETARIA: 'Secretaría',
  CONQUISTADOR: 'Conquistador'
};

function fechaParaInput(fecha) {
  if (!fecha) return '';
  return String(fecha).slice(0, 10);
}

function fechaDeHoy() {
  const hoy = new Date();
  return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
}

function mensajeError(error, alternativo) {
  return error?.response?.data?.mensaje || alternativo;
}

function descripcionLugar(perfil) {
  if (perfil.rol === 'CONQUISTADOR' || perfil.rol === 'CONSEJERO') {
    return [
      perfil.clase?.nombre && 'Clase ' + perfil.clase.nombre,
      perfil.unidad?.nombre && 'Unidad ' + perfil.unidad.nombre
    ].filter(Boolean).join(' · ') || NOMBRES_ROL[perfil.rol];
  }
  return NOMBRES_ROL[perfil.rol] || perfil.rol;
}

function CampoContrasena({ id, etiqueta, valor, onChange, autoComplete, visible }) {
  return (
    <div className="cfg-field">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={valor}
        onChange={onChange}
      />
    </div>
  );
}

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);

  const [datos, setDatos] = useState({ nombre_completo: '', email: '', fecha_nacimiento: '' });
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState('');
  const [datosGuardados, setDatosGuardados] = useState(false);

  const [abrirClave, setAbrirClave] = useState(false);
  const [clave, setClave] = useState({ actual: '', nueva: '', repetir: '' });
  const [verClave, setVerClave] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState('');
  const [claveGuardada, setClaveGuardada] = useState(false);

  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setErrorCarga('');
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
        if (activo) setErrorCarga(mensajeError(error, 'No pudimos cargar tus datos. Revisá la conexión e intentá de nuevo.'));
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  const cambiarDato = (event) => {
    const { name, value } = event.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setErrorDatos('');
    setDatosGuardados(false);
  };

  const guardarDatos = async (event) => {
    event.preventDefault();
    const nombre = datos.nombre_completo.trim();
    const email = datos.email.trim().toLowerCase();
    if (nombre.length < 2 || nombre.length > 150) {
      setErrorDatos('El nombre debe tener entre 2 y 150 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
      setErrorDatos('Ingresá un correo válido.');
      return;
    }

    setGuardandoDatos(true);
    try {
      const respuesta = await actualizarPerfil({
        nombre_completo: nombre,
        email,
        fecha_nacimiento: datos.fecha_nacimiento || null
      });
      setPerfil((actual) => ({ ...actual, ...(respuesta?.usuario || {}), nombre_completo: nombre, email }));
      setDatos((actuales) => ({ ...actuales, nombre_completo: nombre, email }));
      setDatosGuardados(true);
    } catch (error) {
      setErrorDatos(error?.response?.status === 409
        ? 'Ese correo ya lo usa otra cuenta.'
        : mensajeError(error, 'No pudimos guardar los cambios. Intentá de nuevo.'));
    } finally {
      setGuardandoDatos(false);
    }
  };

  const cambiarCampoClave = (event) => {
    const campo = { 'clave-actual': 'actual', 'clave-nueva': 'nueva', 'clave-repetir': 'repetir' }[event.target.name];
    setClave((actual) => ({ ...actual, [campo]: event.target.value }));
    setErrorClave('');
    setClaveGuardada(false);
  };

  const guardarClave = async (event) => {
    event.preventDefault();
    if (!clave.actual) {
      setErrorClave('Ingresá tu contraseña actual.');
      return;
    }
    if (clave.nueva.length < 8 || new TextEncoder().encode(clave.nueva).length > 72) {
      setErrorClave('La contraseña nueva tiene que tener al menos 8 caracteres.');
      return;
    }
    if (clave.nueva !== clave.repetir) {
      setErrorClave('Las dos contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoClave(true);
    try {
      await cambiarContrasena({ password_actual: clave.actual, password_nueva: clave.nueva });
      setClave({ actual: '', nueva: '', repetir: '' });
      setClaveGuardada(true);
    } catch (error) {
      setErrorClave(mensajeError(error, 'No pudimos cambiar la contraseña. Revisá la actual e intentá de nuevo.'));
    } finally {
      setGuardandoClave(false);
    }
  };

  const salir = async () => {
    setSaliendo(true);
    try {
      await cerrarSesion();
    } catch {
      // La sesión local ya se borró; se vuelve al login de todas formas.
    }
    navigate('/login', { replace: true });
  };

  if (cargando || errorCarga || !perfil) {
    return (
      <AppShell perfil={perfil}>
        <div className="cfg cfg--state" role={cargando ? 'status' : undefined}>
          {cargando ? (
            <>
              <span className="cfg-spinner" aria-hidden="true" />
              <p>Cargando tus datos...</p>
            </>
          ) : (
            <>
              <h1>No pudimos abrir la configuración</h1>
              <p role="alert">{errorCarga || 'No encontramos los datos de tu cuenta.'}</p>
              <button type="button" className="cfg-button" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell perfil={perfil}>
      <div className="cfg">
        <h1 className="cfg-title">Configuración</h1>

        <section className="cfg-profile" aria-label="Tu cuenta">
          <span className="cfg-profile__avatar" aria-hidden="true">{iniciales(perfil.nombre_completo)}</span>
          <div className="cfg-profile__copy">
            <strong>{perfil.nombre_completo}</strong>
            <span>{descripcionLugar(perfil)}</span>
            <small>Integrante n.º {perfil.id}</small>
          </div>
        </section>
        {(perfil.rol === 'CONQUISTADOR' || perfil.rol === 'CONSEJERO') && (
          <p className="cfg-note">Tu clase y tu unidad las asigna la dirección del club.</p>
        )}

        <section className="cfg-group" aria-labelledby="cfg-datos">
          <h2 id="cfg-datos">Tus datos</h2>
          <form className="cfg-card cfg-form" onSubmit={guardarDatos} noValidate>
            <div className="cfg-field">
              <label htmlFor="cfg-nombre">Nombre completo</label>
              <input id="cfg-nombre" name="nombre_completo" type="text" autoComplete="name" maxLength={150}
                value={datos.nombre_completo} onChange={cambiarDato} />
            </div>
            <div className="cfg-field">
              <label htmlFor="cfg-email">Correo</label>
              <input id="cfg-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={150}
                autoCapitalize="none" spellCheck="false" value={datos.email} onChange={cambiarDato} />
            </div>
            <div className="cfg-field">
              <label htmlFor="cfg-nacimiento">Fecha de nacimiento</label>
              <input id="cfg-nacimiento" name="fecha_nacimiento" type="date" max={fechaDeHoy()}
                value={datos.fecha_nacimiento} onChange={cambiarDato} />
            </div>
            {errorDatos && <p className="cfg-error" role="alert">{errorDatos}</p>}
            {datosGuardados && <p className="cfg-ok" role="status"><Check size={16} aria-hidden="true" />Guardamos tus datos.</p>}
            <button className="cfg-button" type="submit" disabled={guardandoDatos}>
              {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        <section className="cfg-group" aria-labelledby="cfg-cuenta">
          <h2 id="cfg-cuenta">Cuenta</h2>
          <div className="cfg-card cfg-list">
            <button
              type="button"
              className="cfg-row"
              aria-expanded={abrirClave}
              aria-controls="cfg-clave"
              onClick={() => setAbrirClave((abierto) => !abierto)}
            >
              <span className="cfg-row__icon"><KeyRound size={18} aria-hidden="true" /></span>
              <span className="cfg-row__label">Cambiar contraseña</span>
              <ChevronDown size={18} className={abrirClave ? 'cfg-row__chev is-open' : 'cfg-row__chev'} aria-hidden="true" />
            </button>

            {abrirClave && (
              <form id="cfg-clave" className="cfg-form cfg-form--clave" onSubmit={guardarClave} noValidate>
                <CampoContrasena id="clave-actual" etiqueta="Contraseña actual" valor={clave.actual}
                  onChange={cambiarCampoClave} autoComplete="current-password" visible={verClave} />
                <CampoContrasena id="clave-nueva" etiqueta="Contraseña nueva" valor={clave.nueva}
                  onChange={cambiarCampoClave} autoComplete="new-password" visible={verClave} />
                <CampoContrasena id="clave-repetir" etiqueta="Repetí la contraseña nueva" valor={clave.repetir}
                  onChange={cambiarCampoClave} autoComplete="new-password" visible={verClave} />
                <button type="button" className="cfg-show" onClick={() => setVerClave((visible) => !visible)} aria-pressed={verClave}>
                  {verClave ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  {verClave ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                </button>
                <p className="cfg-help">Usá al menos 8 caracteres.</p>
                {errorClave && <p className="cfg-error" role="alert">{errorClave}</p>}
                {claveGuardada && <p className="cfg-ok" role="status"><Check size={16} aria-hidden="true" />Cambiamos tu contraseña.</p>}
                <button className="cfg-button" type="submit" disabled={guardandoClave}>
                  {guardandoClave ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            )}

            <button type="button" className="cfg-row cfg-row--danger" onClick={salir} disabled={saliendo}>
              <span className="cfg-row__icon"><LogOut size={18} aria-hidden="true" /></span>
              <span className="cfg-row__label">{saliendo ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
