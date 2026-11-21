import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, RefreshCw, Search, UserCheck, UserCog, UserX, X } from 'lucide-react';
import AppShell, { iniciales } from '../components/AppShell';
import { obtenerPerfil } from '../services/authService';
import { editarUsuario, obtenerCatalogo, obtenerUsuarios } from '../services/directorService';
import { colorDeClase } from '../styles/temaClase';
import './UsuariosPage.css';

const ROLES = [
  { valor: 'CONQUISTADOR', nombre: 'Conquistador', plural: 'Conquistadores' },
  { valor: 'CONSEJERO', nombre: 'Consejero', plural: 'Consejeros' },
  { valor: 'SECRETARIA', nombre: 'Secretaría', plural: 'Secretaría' },
  { valor: 'DIRECTOR', nombre: 'Dirección', plural: 'Dirección' }
];
const nombreRol = (valor) => ROLES.find((rol) => rol.valor === valor)?.nombre || valor;

const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Fila({ usuario, catalogo, puedeEditar, esUnoMismo, onActualizado }) {
  const [modo, setModo] = useState('ver');
  const [rol, setRol] = useState(usuario.rol);
  const [unidadId, setUnidadId] = useState(usuario.unidad ? String(usuario.unidad.id) : '');
  const [claseId, setClaseId] = useState(usuario.clase ? String(usuario.clase.id) : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const inactivo = usuario.estado !== 'ACTIVO';
  const primerNombre = usuario.nombre_completo.trim().split(/\s+/)[0];

  const abrirEdicion = () => {
    setRol(usuario.rol);
    setUnidadId(usuario.unidad ? String(usuario.unidad.id) : '');
    setClaseId(usuario.clase ? String(usuario.clase.id) : '');
    setError('');
    setModo('editar');
  };

  const enviar = async (cambios, mensaje) => {
    setGuardando(true);
    setError('');
    try {
      const actualizado = await editarUsuario(usuario.id, cambios);
      onActualizado(actualizado, mensaje);
      setModo('ver');
    } catch (fallo) {
      setError(fallo?.response?.data?.mensaje || 'No pudimos guardar el cambio. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const guardar = (event) => {
    event.preventDefault();
    const cambios = {};
    if (rol !== usuario.rol) cambios.rol = rol;
    if (unidadId !== (usuario.unidad ? String(usuario.unidad.id) : '')) cambios.unidad_id = unidadId ? Number(unidadId) : null;
    if (claseId !== (usuario.clase ? String(usuario.clase.id) : '')) cambios.clase_id = claseId ? Number(claseId) : null;
    if (Object.keys(cambios).length === 0) {
      setModo('ver');
      return;
    }
    enviar(cambios, `Guardamos los cambios de ${primerNombre}.`);
  };

  return (
    <li className={inactivo ? 'us-row is-off' : 'us-row'}>
      <div className="us-row__main">
        <span className="us-avatar" style={{ '--clase': usuario.rol === 'CONQUISTADOR' && usuario.clase ? colorDeClase(usuario.clase) : 'var(--jc-pino)' }} aria-hidden="true">
          {iniciales(usuario.nombre_completo)}
        </span>
        <div className="us-row__who">
          <strong>{usuario.nombre_completo}{esUnoMismo && <small> (vos)</small>}</strong>
          <span>{usuario.email}</span>
        </div>
        <div className="us-row__tags">
          <span className={'us-tag us-tag--' + usuario.rol.toLowerCase()}>{nombreRol(usuario.rol)}</span>
          {usuario.unidad && <span className="us-tag">{usuario.unidad.nombre}</span>}
          {usuario.rol === 'CONQUISTADOR' && usuario.clase && (
            <span className="us-tag"><i style={{ background: colorDeClase(usuario.clase) }} aria-hidden="true" />{usuario.clase.nombre}</span>
          )}
          {inactivo && <span className="us-tag us-tag--off">Dado de baja</span>}
        </div>
        {puedeEditar && modo === 'ver' && (
          <button type="button" className="us-icon" onClick={abrirEdicion} aria-label={'Editar a ' + usuario.nombre_completo}>
            <Pencil size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {modo === 'editar' && (
        <form className="us-edit" onSubmit={guardar}>
          <div className="us-field">
            <label htmlFor={'us-rol-' + usuario.id}>Rol</label>
            <select id={'us-rol-' + usuario.id} value={rol} onChange={(event) => setRol(event.target.value)} disabled={esUnoMismo}>
              {ROLES.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.nombre}</option>)}
            </select>
          </div>
          <div className="us-field">
            <label htmlFor={'us-unidad-' + usuario.id}>Unidad</label>
            <select id={'us-unidad-' + usuario.id} value={unidadId} onChange={(event) => setUnidadId(event.target.value)}>
              <option value="">Sin unidad</option>
              {catalogo.unidades.map((unidad) => <option key={unidad.id} value={unidad.id}>{unidad.nombre}</option>)}
            </select>
          </div>
          {rol === 'CONQUISTADOR' && (
            <div className="us-field">
              <label htmlFor={'us-clase-' + usuario.id}>Clase</label>
              <select id={'us-clase-' + usuario.id} value={claseId} onChange={(event) => setClaseId(event.target.value)}>
                <option value="">Sin clase</option>
                {catalogo.clases.map((clase) => <option key={clase.id} value={clase.id}>{clase.nombre}</option>)}
              </select>
            </div>
          )}
          {esUnoMismo && <p className="us-note">No podés cambiar tu propio rol ni darte de baja.</p>}
          {error && <p className="us-error" role="alert">{error}</p>}
          <div className="us-actions">
            {!esUnoMismo && (
              inactivo ? (
                <button type="button" className="us-btn us-btn--ghost" disabled={guardando}
                  onClick={() => enviar({ estado: 'ACTIVO' }, `${primerNombre} vuelve a estar activo.`)}>
                  <UserCheck size={17} aria-hidden="true" />Reactivar
                </button>
              ) : (
                <button type="button" className="us-btn us-btn--ghost us-btn--danger" disabled={guardando} onClick={() => setModo('baja')}>
                  <UserX size={17} aria-hidden="true" />Dar de baja
                </button>
              )
            )}
            <span className="us-actions__spacer" />
            <button type="button" className="us-btn us-btn--ghost" onClick={() => setModo('ver')} disabled={guardando}>Cancelar</button>
            <button type="submit" className="us-btn" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      )}

      {modo === 'baja' && (
        <div className="us-edit">
          <p className="us-warn">
            ¿Dar de baja a {primerNombre}? No va a poder entrar a la app. Sus datos y su avance se conservan, y lo podés reactivar cuando quieras.
          </p>
          {error && <p className="us-error" role="alert">{error}</p>}
          <div className="us-actions">
            <span className="us-actions__spacer" />
            <button type="button" className="us-btn us-btn--ghost" onClick={() => setModo('editar')} disabled={guardando}>Volver</button>
            <button type="button" className="us-btn us-btn--danger-fill" disabled={guardando}
              onClick={() => enviar({ estado: 'INACTIVO' }, `${primerNombre} quedó dado de baja.`)}>
              {guardando ? 'Dando de baja...' : 'Sí, dar de baja'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Gestión de usuarios: todo el club, con filtros. La dirección puede cambiar rol, unidad
 * y clase, y dar de baja o reactivar; la secretaría solo consulta.
 */
export default function UsuariosPage() {
  const [perfil, setPerfil] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [catalogo, setCatalogo] = useState({ clases: [], unidades: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [verInactivos, setVerInactivos] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([obtenerUsuarios(), obtenerCatalogo(), obtenerPerfil().catch(() => null)])
      .then(([lista, datosCatalogo, usuario]) => {
        if (!activo) return;
        setUsuarios(lista);
        setCatalogo(datosCatalogo);
        setPerfil(usuario);
      })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar los usuarios. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  const inactivos = usuarios.filter((usuario) => usuario.estado !== 'ACTIVO').length;
  const visibles = useMemo(() => {
    const texto = normalizar(busqueda.trim());
    return usuarios.filter((usuario) => {
      if (!verInactivos && usuario.estado !== 'ACTIVO') return false;
      if (filtroRol !== 'TODOS' && usuario.rol !== filtroRol) return false;
      return !texto || normalizar(usuario.nombre_completo).includes(texto) || normalizar(usuario.email).includes(texto);
    });
  }, [usuarios, busqueda, filtroRol, verInactivos]);

  const cuenta = (valor) => usuarios.filter((usuario) => usuario.rol === valor && (verInactivos || usuario.estado === 'ACTIVO')).length;

  const actualizado = (usuario, mensaje) => {
    setUsuarios((actuales) => actuales.map((item) => (item.id === usuario.id ? usuario : item)));
    setAviso(mensaje);
  };

  const puedeEditar = perfil?.rol === 'DIRECTOR';

  return (
    <AppShell perfil={perfil}>
      <div className="us">
        <header className="us-head">
          <span className="us-head__eyebrow"><UserCog size={16} aria-hidden="true" />Dirección</span>
          <h1>Usuarios del club</h1>
          {!cargando && !error && (
            <p>{usuarios.length - inactivos} activos{inactivos ? ` · ${inactivos} dados de baja` : ''}{!puedeEditar ? ' · solo la dirección puede editar' : ''}</p>
          )}
        </header>

        {cargando ? (
          <div className="us-state" role="status"><span className="us-spinner" aria-hidden="true" />Cargando usuarios...</div>
        ) : error ? (
          <div className="us-state">
            <p role="alert">{error}</p>
            <button type="button" className="us-btn" onClick={() => setIntento((actual) => actual + 1)}>
              <RefreshCw size={18} aria-hidden="true" />Intentar de nuevo
            </button>
          </div>
        ) : (
          <>
            <div className="us-tools">
              <label className="us-search">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">Buscar por nombre o correo</span>
                <input type="search" placeholder="Buscar por nombre o correo" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda"><X size={16} aria-hidden="true" /></button>
                )}
              </label>
              <label className="us-check">
                <input type="checkbox" checked={verInactivos} onChange={(event) => setVerInactivos(event.target.checked)} />
                Mostrar dados de baja
              </label>
            </div>

            <div className="us-roles" role="group" aria-label="Filtrar por rol">
              <button type="button" className={filtroRol === 'TODOS' ? 'is-on' : ''} aria-pressed={filtroRol === 'TODOS'} onClick={() => setFiltroRol('TODOS')}>Todos</button>
              {ROLES.map((rol) => (
                <button key={rol.valor} type="button" className={filtroRol === rol.valor ? 'is-on' : ''} aria-pressed={filtroRol === rol.valor} onClick={() => setFiltroRol(rol.valor)}>
                  {rol.plural} <small>{cuenta(rol.valor)}</small>
                </button>
              ))}
            </div>

            {aviso && (
              <p className="us-aviso" role="status">
                <Check size={18} aria-hidden="true" />{aviso}
                <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">×</button>
              </p>
            )}

            {visibles.length === 0 ? (
              <div className="us-state"><p>No hay usuarios que coincidan con la búsqueda.</p></div>
            ) : (
              <ul className="us-list">
                {visibles.map((usuario) => (
                  <Fila
                    key={usuario.id}
                    usuario={usuario}
                    catalogo={catalogo}
                    puedeEditar={puedeEditar}
                    esUnoMismo={usuario.id === perfil?.id}
                    onActualizado={actualizado}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
