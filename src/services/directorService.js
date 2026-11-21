import api from './api';

export async function obtenerSolicitudes() {
  const { data } = await api.get('/director/solicitudes');
  return Array.isArray(data?.solicitudes) ? data.solicitudes : [];
}

export async function obtenerCatalogo() {
  const { data } = await api.get('/director/catalogo');
  return {
    clases: Array.isArray(data?.clases) ? data.clases : [],
    unidades: Array.isArray(data?.unidades) ? data.unidades : []
  };
}

/** Aprueba una solicitud. Devuelve el usuario creado y su contraseña temporal. */
export async function aprobarSolicitud(id, { claseId, unidadId }) {
  const { data } = await api.patch(`/director/solicitudes/${encodeURIComponent(id)}/responder`, {
    decision: 'APROBAR',
    clase_id: claseId,
    unidad_id: unidadId
  });
  return data;
}

export async function rechazarSolicitud(id) {
  const { data } = await api.patch(`/director/solicitudes/${encodeURIComponent(id)}/responder`, {
    decision: 'RECHAZAR'
  });
  return data;
}
