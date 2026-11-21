import api from './api';

export async function obtenerMiUnidad() {
  const { data } = await api.get('/consejero/mi-unidad');
  return data;
}

export async function obtenerCuadernilloDeConquistador(conquistadorId) {
  const { data } = await api.get('/consejero/conquistadores/' + encodeURIComponent(conquistadorId) + '/cuadernillo');
  return data;
}

/**
 * Firma requisitos del cuadernillo.
 * evaluaciones: [{ conquistador_id, requisitos_ids: [..] }]
 */
export async function firmarRequisitos(evaluaciones) {
  const { data } = await api.post('/consejero/evaluar', { evaluaciones });
  return data;
}
