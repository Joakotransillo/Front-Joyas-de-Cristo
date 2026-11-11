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