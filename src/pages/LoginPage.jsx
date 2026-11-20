import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  BookOpen,
  Eye,
  EyeOff,
  Library,
  LockKeyhole,
  Mail,
  Medal
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout, { LEMA } from '../components/AuthLayout';
import useMomentoDelDia from '../hooks/useMomentoDelDia';
import { iniciarSesion, obtenerPerfil } from '../services/authService';
import { validarLogin } from '../validators/loginValidator';

const getRememberedEmail = () => {
  try {
    return window.localStorage.getItem('correo_recordado') || '';
  } catch {
    return '';
  }
};

const limpiarSesionGuardada = () => {
  try {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('usuario');
  } catch {
    // Si el navegador bloquea el almacenamiento, no hay sesión que limpiar.
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saludo } = useMomentoDelDia();

  const [email, setEmail] = useState(getRememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(Boolean(email));
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Página que la persona quería abrir antes de que le pidiéramos iniciar sesión.
  const destino = location.state?.from?.pathname && location.state.from.pathname !== '/login'
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/dashboard';

  // Si ya hay una sesión válida en este equipo, entra directo sin pedir los datos de nuevo.
  useEffect(() => {
    let token = null;
    try {
      token = window.localStorage.getItem('token');
    } catch {
      token = null;
    }
    if (!token) return undefined;

    let cancelado = false;
    obtenerPerfil()
      .then(() => {
        if (!cancelado) navigate(destino, { replace: true });
      })
      .catch(() => {
        if (!cancelado) limpiarSesionGuardada();
      });

    return () => {
      cancelado = true;
    };
    // Solo se revisa al abrir la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const errors = validarLogin({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (rememberEmail) {
        window.localStorage.setItem('correo_recordado', normalizedEmail);
      } else {
        window.localStorage.removeItem('correo_recordado');
      }
    } catch {
      // El ingreso continúa aunque el navegador bloquee el almacenamiento opcional del correo.
    }

    setIsSubmitting(true);
    try {
      await iniciarSesion({ email: normalizedEmail, password });
      navigate(destino, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400) {
        setSubmitError('El correo o la contraseña no son correctos.');
      } else if (status === 403) {
        setSubmitError('Tu cuenta todavía no está activa. Consultá con el director del club.');
      } else if (!error?.response) {
        setSubmitError('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
      } else {
        setSubmitError('No pudimos iniciar sesión. Intentá nuevamente en unos minutos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setFieldErrors((current) => ({ ...current, email: '' }));
    setSubmitError('');
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setFieldErrors((current) => ({ ...current, password: '' }));
    setSubmitError('');
  };

  const revisarMayusculas = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return (
    <AuthLayout
      labelledBy="lg-title"
      intro={(
        <ul className="lg-intro__list">
          <li><BookOpen size={18} aria-hidden="true" />Tu cuadernillo de clase</li>
          <li><Medal size={18} aria-hidden="true" />Tus especialidades</li>
          <li><Library size={18} aria-hidden="true" />Libros y videos del club</li>
        </ul>
      )}
    >
      <header className="lg-heading">
        <h1 id="lg-title">{saludo}</h1>
        <p className="lg-heading__lema">{LEMA}</p>
        <p className="lg-heading__sub">Ingresá con la cuenta que te dio el director.</p>
      </header>

      <form className="lg-form" onSubmit={handleSubmit} noValidate>
        <div className="lg-field">
          <label htmlFor="login-email">Correo</label>
          <div className={fieldErrors.email ? 'lg-input has-error' : 'lg-input'}>
            <Mail size={18} aria-hidden="true" />
            <input
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              maxLength={150}
              placeholder="tu.correo@gmail.com"
              value={email}
              onChange={handleEmailChange}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              required
            />
          </div>
          {fieldErrors.email && <p className="lg-field__error" id="login-email-error">{fieldErrors.email}</p>}
        </div>

        <div className="lg-field">
          <label htmlFor="login-password">Contraseña</label>
          <div className={fieldErrors.password ? 'lg-input has-error' : 'lg-input'}>
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu contraseña"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={revisarMayusculas}
              onKeyUp={revisarMayusculas}
              onBlur={() => setCapsLockOn(false)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={[
                fieldErrors.password ? 'login-password-error' : '',
                capsLockOn ? 'login-caps' : ''
              ].filter(Boolean).join(' ') || undefined}
              required
            />
            <button
              className="lg-input__toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {capsLockOn && (
            <p className="lg-field__caps" id="login-caps">
              <ArrowUp size={15} aria-hidden="true" />Las mayúsculas están activadas
            </p>
          )}
          {fieldErrors.password && <p className="lg-field__error" id="login-password-error">{fieldErrors.password}</p>}
        </div>

        <div className="lg-form__options">
          <label className="lg-check">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => setRememberEmail(event.target.checked)}
            />
            Recordar mi correo
          </label>
          <button
            type="button"
            className="lg-link"
            onClick={() => setShowHelp((visible) => !visible)}
            aria-expanded={showHelp}
            aria-controls="login-help"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {showHelp && (
          <p className="lg-help" id="login-help">
            Pedile a tu consejero o al director del club que te genere una contraseña nueva.
          </p>
        )}

        {submitError && (
          <div className="lg-alert" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{submitError}</p>
          </div>
        )}

        <button className="lg-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="lg-submit__spinner" aria-hidden="true" />
              Ingresando...
            </>
          ) : 'Ingresar'}
        </button>
      </form>

      <p className="lg-register">
        ¿Sos nuevo en el club? <Link to="/solicitar-cuenta">Pedí tu cuenta</Link>
      </p>
    </AuthLayout>
  );
}
