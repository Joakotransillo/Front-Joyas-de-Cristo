const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarLogin({ email, password }) {
  const errors = {};
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';

  if (!normalizedEmail) {
    errors.email = 'Ingresá tu correo electrónico.';
  } else if (normalizedEmail.length > 150 || !EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = 'Ingresá un correo electrónico válido.';
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'Ingresá tu contraseña.';
  }

  return errors;
}
