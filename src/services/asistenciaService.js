import api from './api';

export async function obtenerAsistencia({ fecha, unidadId }) {
  const params = { fecha };
  if (unidadId) params.unidad_id = unidadId;
  const { data } = await api.get('/secretaria/asistencia', { params });
  return data;
}

export async function guardarAsistencia({ fecha, unidadId, registros }) {
  const { data } = await api.post('/secretaria/asistencia', {
    fecha,
    unidad_id: unidadId || undefined,
    registros
  });
  return data;
}
