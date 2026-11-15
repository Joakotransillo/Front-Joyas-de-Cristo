import api from './api';

export async function obtenerCuadernilloConquistador() {
  const { data } = await api.get('/conquis/cuadernillo');
  return data;
}

export async function actualizarLecturaBiblica(requisitoId, referencia, completado) {
  const { data } = await api.patch(
    '/conquis/cuadernillo/requisitos/' + requisitoId + '/lecturas',
    { referencia, completado }
  );
  return data;
}