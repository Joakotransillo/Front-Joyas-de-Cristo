import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

export async function iniciarSesion({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });

  if (!data?.token || !data?.usuario) {
    throw new Error('La respuesta del servidor no contiene una sesión válida.');
  }

  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));

  return data.usuario;
}

export async function solicitarCuenta(datosSolicitud) {
  const { data } = await api.post('/auth/solicitar-cuenta', datosSolicitud);
  return data;
}
export async function obtenerPerfil() {
  const { data } = await api.get('/auth/me');
  return data.usuario;
}

export async function actualizarPerfil(datosPerfil) {
  const { data } = await api.patch('/auth/me', datosPerfil);
  return data;
}

export async function cambiarContrasena(datosPassword) {
  const { data } = await api.patch('/auth/me', datosPassword);
  return data;
}
// Cierra la sesión en el servidor y borra los datos guardados en este equipo.
// Aunque el servidor no responda, la sesión local se limpia igual.
export async function cerrarSesion() {
  try {
    await api.delete('/auth/sesiones');
  } finally {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // Si el navegador bloquea el almacenamiento, no hay nada que borrar.
    }
  }
}
