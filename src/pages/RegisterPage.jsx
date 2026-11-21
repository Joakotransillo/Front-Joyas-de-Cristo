import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Mail,
  UserRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { solicitarCuenta } from '../services/authService';
import { calcularEdad, validarDatosPersonales } from '../validators/solicitudValidator';
import './RegisterPage.css';

// Catálogo inicial de database/seed.sql (el backend todavía no expone uno).
// `edad` es la edad habitual de cada clase y se usa para sugerir una.
const CLASES = [
  { id: 1, nombre: 'Amigo', color: '#1E40AF', edad: 10 },
  { id: 2, nombre: 'Compañero', color: '#DC2626', edad: 11 },
  { id: 3, nombre: 'Explorador', color: '#166534', edad: 12 },
  { id: 4, nombre: 'Pionero', color: '#6B7280', edad: 13 },
  { id: 5, nombre: 'Excursionista', color: '#7C3AED', edad: 14 },
  { id: 6, nombre: 'Guía', color: '#CA8A04', edad: 15 }
];
const UNIDADES = [
  { id: 1, nombre: 'Amatista' },
  { id: 2, nombre: 'Esmeralda' },
  { id: 3, nombre: 'Calcedonia' }
];

const PASOS_SOLICITUD = [
  'Completás la solicitud',
  'La secretaría la revisa',
  'El director te da tu cuenta'
];

function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return hoy.getFullYear() + '-' + mes + '-' + dia;
}

function claseSugeridaPorEdad(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento);
  return CLASES.find((clase) => clase.edad === edad) || null;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    email: '',
    clase_sugerida_id: '',
    unidad_sugerida_id: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitud, setSolicitud] = useState(null);

  const sugerida = claseSugeridaPorEdad(form.fecha_nacimiento);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const handlePersonalStep = (event) => {
    event.preventDefault();
    const errors = validarDatosPersonales(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Marca de entrada la clase que corresponde a la edad; la persona la puede cambiar.
    if (!form.clase_sugerida_id && sugerida) {
      setForm((current) => ({ ...current, clase_sugerida_id: String(sugerida.id) }));
    }
    setStep(2);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const personalErrors = validarDatosPersonales(form);
    const errors = { ...personalErrors };
    if (!form.clase_sugerida_id) {
      errors.clase_sugerida_id = 'Elegí la clase que corresponde al aspirante.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (Object.keys(personalErrors).length > 0) setStep(1);
      return;
    }

    const datosSolicitud = {
      nombre_completo: form.nombre_completo.trim(),
      fecha_nacimiento: form.fecha_nacimiento,
      email: form.email.trim().toLowerCase(),
      clase_sugerida_id: Number(form.clase_sugerida_id),
      unidad_sugerida_id: form.unidad_sugerida_id ? Number(form.unidad_sugerida_id) : null
    };

    setIsSubmitting(true);
    try {
      const response = await solicitarCuenta(datosSolicitud);
      setSolicitud(response?.solicitud || {});
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.mensaje || error?.response?.data?.message;
      if (status === 409) {
        setSubmitError('Ya hay una cuenta o una solicitud con ese correo. Revisalo o consultá con la secretaría del club.');
      } else if (status === 400 && serverMessage) {
        setSubmitError(serverMessage);
      } else if (!error?.response) {
        setSubmitError('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
      } else {
        setSubmitError('No pudimos enviar la solicitud. Intentá nuevamente en unos minutos.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nombreAspirante = form.nombre_completo.trim().split(/\s+/)[0];

  const intro = (
    <ol className="lg-intro__list rg-intro-steps">
      {PASOS_SOLICITUD.map((paso, indice) => (
        <li key={paso}><span className="rg-intro-steps__num">{indice + 1}</span>{paso}</li>
      ))}
    </ol>
  );

  if (solicitud) {
    return (
      <AuthLayout labelledBy="rg-title" intro={intro}>
        <div className="rg-done" role="status">
          <span className="rg-done__icon"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></span>
          <h1 id="rg-title">¡Gracias, {nombreAspirante}!</h1>
          <p className="rg-done__copy">Recibimos tu solicitud. Cuando el director habilite tu cuenta, vas a poder ingresar con el correo que dejaste.</p>
          {solicitud.id && <p className="rg-done__number">Solicitud n.º {solicitud.id}</p>}

          <ol className="rg-timeline">
            <li className="is-done"><span><Check size={14} strokeWidth={3} aria-hidden="true" /></span>Solicitud enviada</li>
            <li><span>2</span>La secretaría la revisa</li>
            <li><span>3</span>El director aprueba tu cuenta</li>
          </ol>

          <Link className="lg-submit rg-done__link" to="/login">Volver al inicio</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout labelledBy="rg-title" intro={intro}>
      <header className="lg-heading">
        <h1 id="rg-title">Sumate al club</h1>
        <p className="rg-heading__sub">Completá la solicitud y la secretaría del club la revisa.</p>
      </header>

      <div className="rg-steps" aria-label={'Paso ' + step + ' de 2'}>
        <div className={step === 1 ? 'rg-steps__item is-active' : 'rg-steps__item is-done'}>
          <span>{step > 1 ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : '1'}</span>Tus datos
        </div>
        <i aria-hidden="true" />
        <div className={step === 2 ? 'rg-steps__item is-active' : 'rg-steps__item'}>
          <span>2</span>Clase y unidad
        </div>
      </div>

      {step === 1 ? (
        <form className="lg-form" onSubmit={handlePersonalStep} noValidate>
          <div className="lg-field">
            <label htmlFor="register-name">Nombre completo</label>
            <div className={fieldErrors.nombre_completo ? 'lg-input has-error' : 'lg-input'}>
              <UserRound size={18} aria-hidden="true" />
              <input
                id="register-name"
                name="nombre_completo"
                type="text"
                autoComplete="name"
                maxLength={150}
                placeholder="Lucas Nahuel Benítez"
                value={form.nombre_completo}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.nombre_completo)}
                aria-describedby={fieldErrors.nombre_completo ? 'register-name-error' : undefined}
                required
              />
            </div>
            {fieldErrors.nombre_completo && <p className="lg-field__error" id="register-name-error">{fieldErrors.nombre_completo}</p>}
          </div>

          <div className="lg-field">
            <label htmlFor="register-birthday">Fecha de nacimiento</label>
            <div className={fieldErrors.fecha_nacimiento ? 'lg-input has-error' : 'lg-input'}>
              <CalendarDays size={18} aria-hidden="true" />
              <input
                id="register-birthday"
                name="fecha_nacimiento"
                type="date"
                autoComplete="bday"
                max={fechaDeHoy()}
                value={form.fecha_nacimiento}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.fecha_nacimiento)}
                aria-describedby={fieldErrors.fecha_nacimiento ? 'register-birthday-error' : 'register-birthday-help'}
                required
              />
            </div>
            {fieldErrors.fecha_nacimiento
              ? <p className="lg-field__error" id="register-birthday-error">{fieldErrors.fecha_nacimiento}</p>
              : <p className="rg-help" id="register-birthday-help">El club es para chicos de 10 a 15 años.</p>}
          </div>

          <div className="lg-field">
            <label htmlFor="register-email">Correo de contacto</label>
            <div className={fieldErrors.email ? 'lg-input has-error' : 'lg-input'}>
              <Mail size={18} aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                maxLength={150}
                placeholder="familia@gmail.com"
                value={form.email}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'register-email-error' : 'register-email-help'}
                required
              />
            </div>
            {fieldErrors.email
              ? <p className="lg-field__error" id="register-email-error">{fieldErrors.email}</p>
              : <p className="rg-help" id="register-email-help">Si sos menor, usá el correo de tu mamá, papá o tutor.</p>}
          </div>

          <button className="lg-submit" type="submit">Continuar</button>
        </form>
      ) : (
        <form className="lg-form" onSubmit={handleRequest} noValidate>
          <fieldset className="rg-group" aria-describedby={fieldErrors.clase_sugerida_id ? 'register-class-error' : 'register-class-help'}>
            <legend>Clase</legend>
            <p className="rg-help" id="register-class-help">
              {sugerida
                ? `Por tu edad te corresponde ${sugerida.nombre}. Podés elegir otra si ya la hiciste.`
                : 'Elegí la clase que vas a hacer este año.'}
            </p>
            <div className="rg-classes">
              {CLASES.map((clase) => (
                <label key={clase.id} className="rg-class" style={{ '--rg-clase': clase.color }}>
                  <input
                    type="radio"
                    name="clase_sugerida_id"
                    value={clase.id}
                    checked={form.clase_sugerida_id === String(clase.id)}
                    onChange={updateField}
                  />
                  <span className="rg-class__dot" aria-hidden="true" />
                  <span className="rg-class__name">{clase.nombre}</span>
                  <span className="rg-class__age">{clase.edad} años</span>
                </label>
              ))}
            </div>
            {fieldErrors.clase_sugerida_id && <p className="lg-field__error" id="register-class-error">{fieldErrors.clase_sugerida_id}</p>}
          </fieldset>

          <fieldset className="rg-group">
            <legend>Unidad <span>(opcional)</span></legend>
            <div className="rg-units">
              {[{ id: '', nombre: 'Todavía no sé' }, ...UNIDADES].map((unidad) => (
                <label key={unidad.id || 'ninguna'} className="rg-unit">
                  <input
                    type="radio"
                    name="unidad_sugerida_id"
                    value={unidad.id}
                    checked={form.unidad_sugerida_id === String(unidad.id)}
                    onChange={updateField}
                  />
                  <span>{unidad.nombre}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {submitError && (
            <div className="lg-alert" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <p>{submitError}</p>
            </div>
          )}

          <div className="rg-actions">
            <button
              className="rg-back"
              type="button"
              onClick={() => { setStep(1); setSubmitError(''); }}
            >
              <ArrowLeft size={18} aria-hidden="true" />Volver
            </button>
            <button className="lg-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="lg-submit__spinner" aria-hidden="true" />
                  Enviando...
                </>
              ) : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      )}

      <p className="lg-register">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </AuthLayout>
  );
}
