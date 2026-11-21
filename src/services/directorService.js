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

export async function obtenerMetricas() {
  const { data } = await api.get('/director/metricas');
  return data;
}

export async function obtenerUsuarios() {
  const { data } = await api.get('/director/usuarios');
  return Array.isArray(data?.usuarios) ? data.usuarios : [];
}

/** cambios: { rol?, unidad_id?, clase_id?, estado? }. Devuelve el usuario actualizado. */
export async function editarUsuario(id, cambios) {
  const { data } = await api.patch('/director/usuarios/' + encodeURIComponent(id), cambios);
  return data.usuario;
}
