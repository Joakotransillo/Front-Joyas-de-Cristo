const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcularEdad(fechaNacimiento) {
  const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumplio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (aunNoCumplio) edad -= 1;
  return edad;
}

export function validarDatosPersonales({ nombre_completo, fecha_nacimiento, email }) {
  const errores = {};
  const nombre = nombre_completo?.trim() || '';
  const correo = email?.trim() || '';

  if (!nombre) {
    errores.nombre_completo = 'Ingresá el nombre completo del aspirante.';
  } else if (nombre.length < 2 || nombre.length > 150) {
    errores.nombre_completo = 'El nombre debe tener entre 2 y 150 caracteres.';
  }

  if (!fecha_nacimiento) {
    errores.fecha_nacimiento = 'Seleccioná la fecha de nacimiento.';
  } else {
    const edad = calcularEdad(fecha_nacimiento);
    if (edad === null || edad < 0) {
      errores.fecha_nacimiento = 'Ingresá una fecha de nacimiento válida.';
    } else if (edad < 10 || edad > 15) {
      errores.fecha_nacimiento = 'Para esta solicitud, la edad debe estar entre 10 y 15 años.';
    }
  }

  if (!correo) {
    errores.email = 'Ingresá un correo electrónico de contacto.';
  } else if (correo.length > 150 || !EMAIL_REGEX.test(correo)) {
    errores.email = 'Revisá el formato del correo electrónico.';
  }

  return errores;
}