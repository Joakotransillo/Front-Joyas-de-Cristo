import { useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2,
  Compass, Mail, MapPin, ShieldCheck, Tent, UserRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/joyas-de-cristo-logo.png';
import AuthBackdrop from '../components/AuthBackdrop';
import { solicitarCuenta } from '../services/authService';
import { validarDatosPersonales } from '../validators/solicitudValidator';
import './RegisterPage.css';

// IDs del catálogo inicial de database/seed.sql. El backend aún no expone un catálogo.
const CLASES = [
  { id: 1, nombre: 'Amigo' },
  { id: 2, nombre: 'Compañero' },
  { id: 3, nombre: 'Explorador' },
  { id: 4, nombre: 'Pionero' },
  { id: 5, nombre: 'Excursionista' },
  { id: 6, nombre: 'Guía' }
];
const UNIDADES = [
  { id: 1, nombre: 'Amatista' },
  { id: 2, nombre: 'Esmeralda' },
  { id: 3, nombre: 'Calcedonia' }
];

function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return hoy.getFullYear() + '-' + mes + '-' + dia;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre_completo: '', fecha_nacimiento: '', email: '',
    clase_sugerida_id: '', unidad_sugerida_id: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solicitud, setSolicitud] = useState(null);

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
    if (Object.keys(errors).length === 0) setStep(2);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const personalErrors = validarDatosPersonales(form);
    const errors = { ...personalErrors };
    if (!form.clase_sugerida_id) {
      errors.clase_sugerida_id = 'Elegí la clase que mejor representa el nivel actual del aspirante.';
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
      setSolicitud(response?.solicitud || null);
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.mensaje || error?.response?.data?.message;
      if (status === 409) {
        setSubmitError('Ya existe una cuenta o solicitud asociada a ese correo. Revisá el dato o consultá con la Secretaría.');
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

  return (
    <main className="login-page register-page">
      <AuthBackdrop />
      <section className="login-stage register-stage" aria-labelledby="register-title">
        <div className="login-brandline">
          <span className="login-brandline__icon"><Compass size={15} strokeWidth={1.7} /></span>
          <span>JOYAS DE CRISTO</span><i aria-hidden="true" /><span>CAMPAMENTO BASE</span>
        </div>

        <div className="login-card register-card">
          <div className="login-seal" aria-hidden="true"><img src={brandLogo} alt="" /></div>
          <div className="login-card__inner register-card__inner">
            {solicitud ? (
              <div className="register-success" role="status" aria-live="polite">
                <span className="register-success__icon"><CheckCircle2 size={30} /></span>
                <p className="register-kicker">SOLICITUD ENVIADA A SECRETARÍA</p>
                <h1 id="register-title">¡Gracias, {nombreAspirante}!</h1>
                <p className="register-success__copy">Recibimos los datos del aspirante. La solicitud quedó pendiente de revisión por la Secretaría y la Dirección del club.</p>
                {solicitud.id && <p className="register-request-number">Número de solicitud <strong>#{solicitud.id}</strong></p>}
                <Link className="login-submit register-success__link" to="/login">
                  <span>Volver al inicio de sesión</span><ArrowRight size={18} aria-hidden="true" />
                </Link>
                <p className="register-footnote"><ShieldCheck size={15} /> El alta se habilita cuando la Dirección aprueba la solicitud.</p>
              </div>
            ) : (
              <>
                <div className="login-kicker register-kicker">
                  <span /><Compass size={13} strokeWidth={1.7} aria-hidden="true" />
                  <span>FORMULARIO DE ALTA DE ASPIRANTE</span><span />
                </div>
                <header className="login-heading register-heading">
                  <h1 id="register-title">Anótate en el club</h1>
                  <p>Tu solicitud llegará a la Secretaría y a la Dirección del Campamento Base.</p>
                </header>

                <div className="register-progress" aria-label={'Paso ' + step + ' de 2'}>
                  <div className={step === 1 ? 'register-progress__step is-active' : 'register-progress__step is-complete'}>
                    <span>{step > 1 ? <CheckCircle2 size={15} /> : <Compass size={15} />}</span><span>1. Datos personales</span>
                  </div>
                  <span className="register-progress__connector" aria-hidden="true" />
                  <div className={step === 2 ? 'register-progress__step is-active' : 'register-progress__step'}>
                    <span><Tent size={15} /></span><span>2. Clase y unidad</span>
                  </div>
                </div>

                {step === 1 ? (
                  <form className="register-form" onSubmit={handlePersonalStep} noValidate>
                    <div className="register-section-heading"><h2>Ficha 1/2: información básica</h2><span>PASO INICIAL</span></div>
                    <div className="login-field">
                      <div className="login-field__label-row"><label htmlFor="register-name">Nombre completo del aspirante <b>*</b></label></div>
                      <div className={fieldErrors.nombre_completo ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                        <UserRound size={17} aria-hidden="true" />
                        <input id="register-name" name="nombre_completo" type="text" autoComplete="name" maxLength={150}
                          placeholder="Ej. Lucas Nahuel Benítez" value={form.nombre_completo} onChange={updateField}
                          aria-invalid={Boolean(fieldErrors.nombre_completo)}
                          aria-describedby={fieldErrors.nombre_completo ? 'register-name-error' : undefined} required />
                      </div>
                      {fieldErrors.nombre_completo && <p className="login-field__error" id="register-name-error">{fieldErrors.nombre_completo}</p>}
                    </div>

                    <div className="login-field">
                      <div className="login-field__label-row">
                        <label htmlFor="register-birthday">Fecha de nacimiento <b>*</b></label>
                        <span className="register-age-note">Edad para Conquistadores: 10 a 15 años</span>
                      </div>
                      <div className={fieldErrors.fecha_nacimiento ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                        <CalendarDays size={17} aria-hidden="true" />
                        <input id="register-birthday" name="fecha_nacimiento" type="date" autoComplete="bday" max={fechaDeHoy()}
                          value={form.fecha_nacimiento} onChange={updateField}
                          aria-invalid={Boolean(fieldErrors.fecha_nacimiento)}
                          aria-describedby={fieldErrors.fecha_nacimiento ? 'register-birthday-error' : 'register-age-help'} required />
                      </div>
                      {fieldErrors.fecha_nacimiento
                        ? <p className="login-field__error" id="register-birthday-error">{fieldErrors.fecha_nacimiento}</p>
                        : <p className="register-field-help" id="register-age-help">Si sos menor, ingresá el correo de tu madre, padre o tutor responsable.</p>}
                    </div>

                    <div className="login-field">
                      <div className="login-field__label-row"><label htmlFor="register-email">Correo del aspirante o tutor responsable <b>*</b></label></div>
                      <div className={fieldErrors.email ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                        <Mail size={17} aria-hidden="true" />
                        <input id="register-email" name="email" type="email" inputMode="email" autoComplete="email"
                          autoCapitalize="none" spellCheck="false" maxLength={150} placeholder="aspirante@familia.com"
                          value={form.email} onChange={updateField} aria-invalid={Boolean(fieldErrors.email)}
                          aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} required />
                      </div>
                      {fieldErrors.email && <p className="login-field__error" id="register-email-error">{fieldErrors.email}</p>}
                    </div>

                    <button className="login-submit register-submit" type="submit"><span>Siguiente: elegir clase</span><ArrowRight size={19} aria-hidden="true" /></button>
                    <p className="register-login-prompt"><span>¿Ya tenés una cuenta activa?</span><Link to="/login">Volver al inicio de sesión <ArrowRight size={14} aria-hidden="true" /></Link></p>
                  </form>
                ) : (
                  <form className="register-form" onSubmit={handleRequest} noValidate>
                    <div className="register-section-heading"><h2>Ficha 2/2: clase y unidad</h2><span>ÚLTIMO PASO</span></div>
                    <p className="register-intro">Seleccioná una referencia para orientar a la Secretaría. El equipo del club confirmará la clase y la unidad al revisar la solicitud.</p>
                    <div className="register-choice-grid">
                      <div className="login-field">
                        <div className="login-field__label-row"><label htmlFor="register-class">Clase sugerida <b>*</b></label></div>
                        <div className={fieldErrors.clase_sugerida_id ? 'login-input-wrap has-error' : 'login-input-wrap'}>
                          <Compass size={17} aria-hidden="true" />
                          <select id="register-class" name="clase_sugerida_id" value={form.clase_sugerida_id} onChange={updateField}
                            aria-invalid={Boolean(fieldErrors.clase_sugerida_id)}
                            aria-describedby={fieldErrors.clase_sugerida_id ? 'register-class-error' : undefined} required>
                            <option value="">Elegí una clase</option>
                            {CLASES.map((clase) => <option key={clase.id} value={clase.id}>{clase.nombre}</option>)}
                          </select>
                        </div>
                        {fieldErrors.clase_sugerida_id && <p className="login-field__error" id="register-class-error">{fieldErrors.clase_sugerida_id}</p>}
                      </div>
                      <div className="login-field">
                        <div className="login-field__label-row"><label htmlFor="register-unit">Unidad sugerida <span>OPCIONAL</span></label></div>
                        <div className="login-input-wrap">
                          <MapPin size={17} aria-hidden="true" />
                          <select id="register-unit" name="unidad_sugerida_id" value={form.unidad_sugerida_id} onChange={updateField}>
                            <option value="">Todavía no lo sé</option>
                            {UNIDADES.map((unidad) => <option key={unidad.id} value={unidad.id}>{unidad.nombre}</option>)}
                          </select>
                        </div>
                        <p className="register-field-help">Podés dejar que el club te ayude a elegirla.</p>
                      </div>
                    </div>
                    {submitError && <div className="login-alert" role="alert" aria-live="polite"><AlertCircle size={18} aria-hidden="true" /><p>{submitError}</p></div>}
                    <div className="register-actions">
                      <button className="register-back" type="button" onClick={() => { setStep(1); setSubmitError(''); }}><ArrowLeft size={17} aria-hidden="true" /><span>Volver</span></button>
                      <button className="login-submit register-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? <><span className="login-submit__spinner" aria-hidden="true" /><span>Enviando solicitud...</span></>
                          : <><span>Enviar solicitud</span><ArrowRight size={19} aria-hidden="true" /></>}
                      </button>
                    </div>
                    <p className="register-login-prompt"><span>¿Ya tenés una cuenta activa?</span><Link to="/login">Volver al inicio de sesión <ArrowRight size={14} aria-hidden="true" /></Link></p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <p className="login-stage__caption"><span>AFILIACIÓN: ASOCIACIÓN BONAERENSE · REGIÓN 3</span><span>SOLICITUD PENDIENTE DE REVISIÓN</span></p>
      </section>
    </main>
  );
}