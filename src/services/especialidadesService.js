import api from './api';

export async function obtenerEspecialidades() {
  const { data } = await api.get('/especialidades');
  return Array.isArray(data?.especialidades) ? data.especialidades : [];
}

export async function obtenerEspecialidad(id) {
  const { data } = await api.get('/especialidades/' + encodeURIComponent(id));
  return data;
}
