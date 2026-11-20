import api from './api';

export async function obtenerInicioConquistador() {
  const { data } = await api.get('/conquis/inicio');
  return data;
}
