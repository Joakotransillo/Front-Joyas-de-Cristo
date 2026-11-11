import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
  Flame,
  LockKeyhole,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/joyas-de-cristo-logo.png';
import { iniciarSesion } from '../services/authService';
import { validarLogin } from '../validators/loginValidator';
import AuthBackdrop from '../components/AuthBackdrop';
import './LoginPage.css';

const getRememberedEmail = () => {
  try {
    return window.localStorage.getItem('correo_recordado') || '';
  } catch {
    return '';
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getRememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(Boolean(email));
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400) {
        setSubmitError('El correo o la contraseña no son correctos.');
      } else if (status === 403) {
        setSubmitError('Tu cuenta todavía no está activa. Consultá con el Director del club.');
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

  return (
    <main className="login-page">
      <AuthBackdrop />

      <section className="login-stage" aria-labelledby="login-title">
        <div className="login-brandline">
          <span className="login-brandline__icon"><Compass size={15} strokeWidth={1.7} /></span>
          <span>JOYAS DE CRISTO</span>
          <i aria-hidden="true" />
          <span>CLUB DE CONQUISTADORES</span>
        </div>

        <div className="login-card">
          <div className="login-seal" aria-hidden="true">
            <img src={brandLogo} alt="" />
          </div>

          <div className="login-card__inner">
            <div className="login-kicker">
              <span />
              <Compass size={13} strokeWidth={1.7} aria-hidden="true" />
              <span>ACCESO DE INTEGRANTES</span>
              <span />
            </div>

            <header className="login-heading">
              <h1 id="login-title">Tu lugar en el club</h1>
              <p>Ingresá para continuar tu recorrido y ver tus logros.</p>
            </header>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="login-email">Correo electrónico</label>
                  <span>REQUERIDO</span>
                </div>
                <div className={fieldErrors.email ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                  <Mail size={17} strokeWidth={1.8} aria-hidden="true" />
                  <input
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    id="login-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    maxLength={150}
                    placeholder="tu.correo@ejemplo.com"
                    value={email}
                    onChange={handleEmailChange}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="login-field__error" id="login-email-error">{fieldErrors.email}</p>}
              </div>

              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="login-password">Contraseña</label>
                  <span>PERSONAL</span>
                </div>
                <div className={fieldErrors.password ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                  <LockKeyhole size={17} strokeWidth={1.8} aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresá tu contraseña"
                    value={password}
                    onChange={handlePasswordChange}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    required
                  />
                  <button
                    className="login-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="login-field__error" id="login-password-error">{fieldErrors.password}</p>}
              </div>

              <div className="login-form__options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                  />
                  <span className="login-remember__box" aria-hidden="true" />
                  <span>Recordar mi correo en este equipo</span>
                </label>
                <span className="login-form__hint">SESIÓN PERSONAL</span>
              </div>

              {submitError && (
                <div className="login-alert" role="alert" aria-live="polite">
                  <AlertCircle size={18} strokeWidth={1.8} aria-hidden="true" />
                  <p>{submitError}</p>
                </div>
              )}

              <button className="login-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="login-submit__spinner" aria-hidden="true" />
                    <span>Verificando acceso...</span>
                  </>
                ) : (
                  <>
                    <Flame size={19} strokeWidth={2} aria-hidden="true" />
                    <span>Ingresar al campamento</span>
                    <ArrowRight size={19} strokeWidth={2} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="login-card__footer">
              <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
              <p>El acceso a la plataforma requiere una cuenta habilitada por el Director.</p>
            </div>
            <div className="login-register-cta">
              <span>¿Todavía no sos parte del club?</span>
              <Link to="/solicitar-cuenta">Solicitar acceso <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>

        <p className="login-stage__caption login-stage__caption--centered">
          <span>MARANATHA · ¡CRISTO VIENE!</span>
        </p>
      </section>
    </main>
  );
}
