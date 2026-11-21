import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, RefreshCw, X } from 'lucide-react';
import { firmarRequisitos, obtenerCuadernilloDeConquistador } from '../services/consejeroService';
import './EvaluacionModal.css';

const estaFirmado = (requisito) => Boolean(requisito.firmado || requisito.completado);

function fechaCorta(valor) {
  if (!valor) return '';
  const fecha = new Date(typeof valor === 'string' ? valor.replace(' ', 'T') : valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(fecha).replace('.', '');
}

/**
 * Evaluación presencial del sábado: el consejero tilda los requisitos que el conquistador
 * cumplió y los firma todos juntos. Los ya firmados se muestran pero no se pueden destildar.
 */
export default function EvaluacionModal({ conquistador, onCerrar, onFirmado }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [tipo, setTipo] = useState('REGULAR');
  const [elegidos, setElegidos] = useState(() => new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [errorFirma, setErrorFirma] = useState('');
  const panel = useRef(null);
  const nombreCorto = conquistador.nombre_completo?.trim().split(/\s+/)[0] || 'el conquistador';

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    obtenerCuadernilloDeConquistador(conquistador.id)
      .then((respuesta) => { if (activo) setDatos(respuesta); })
      .catch((fallo) => {
        if (activo) setError(fallo?.response?.data?.mensaje || 'No pudimos cargar el cuadernillo. Revisá la conexión e intentá de nuevo.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [conquistador.id, intento]);

  // Cierra con Escape, bloquea el scroll de fondo y devuelve el foco al cerrar.
  useEffect(() => {
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const alTeclear = (event) => {
      if (event.key === 'Escape' && !firmando) onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflow;
      if (anterior && typeof anterior.focus === 'function') anterior.focus();
    };
  }, [onCerrar, firmando]);

  const cuadernillos = Array.isArray(datos?.cuadernillos) ? datos.cuadernillos : [];
  const libro = cuadernillos.find((item) => item.tipo === tipo) || cuadernillos[0] || null;
  const areas = Array.isArray(libro?.categorias) ? libro.categorias : [];
  const tipos = [...new Set(cuadernillos.map((item) => item.tipo))];

  const descripcionPorId = useMemo(() => {
    const mapa = new Map();
    for (const item of cuadernillos) {
      for (const area of item.categorias || []) {
        for (const requisito of area.requisitos || []) mapa.set(requisito.id, requisito);
      }
    }
    return mapa;
  }, [cuadernillos]);

  const alternar = (id) => {
    setErrorFirma('');
    setElegidos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(id)) siguientes.delete(id);
      else siguientes.add(id);
      return siguientes;
    });
  };

  const alternarArea = (pendientes, todosElegidos) => {
    setErrorFirma('');
    setElegidos((actuales) => {
      const siguientes = new Set(actuales);
      for (const requisito of pendientes) {
        if (todosElegidos) siguientes.delete(requisito.id);
        else siguientes.add(requisito.id);
      }
      return siguientes;
    });
  };

  const firmar = async () => {
    setFirmando(true);
    setErrorFirma('');
    try {
      const resultado = await firmarRequisitos([{ conquistador_id: conquistador.id, requisitos_ids: [...elegidos] }]);
      onFirmado({ conquistador, cantidad: resultado?.firmas_creadas ?? elegidos.size });
    } catch (fallo) {
      setErrorFirma(fallo?.response?.data?.mensaje || 'No pudimos guardar las firmas. Intentá de nuevo.');
      setConfirmando(false);
    } finally {
      setFirmando(false);
    }
  };

  const cantidad = elegidos.size;

  return (
    <div className="ev-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !firmando) onCerrar(); }}>
      <div
        className="ev"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ev-titulo"
        tabIndex={-1}
        ref={panel}
        style={{ '--clase': conquistador.clase?.color_insignia || 'var(--jc-pino)' }}
      >
        <header className="ev-head">
          <div>
            <small>Evaluación del sábado</small>
            <h2 id="ev-titulo">{conquistador.nombre_completo}</h2>
            {conquistador.clase && <span className="ev-head__class"><i aria-hidden="true" />Clase {conquistador.clase.nombre}</span>}
          </div>
          <button type="button" className="ev-close" onClick={onCerrar} disabled={firmando} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="ev-body">
          {cargando ? (
            <div className="ev-state" role="status"><span className="ev-spinner" aria-hidden="true" />Cargando cuadernillo...</div>
          ) : error ? (
            <div className="ev-state">
              <p role="alert">{error}</p>
              <button type="button" className="ev-button ev-button--ghost" onClick={() => setIntento((actual) => actual + 1)}>
                <RefreshCw size={16} aria-hidden="true" />Intentar de nuevo
              </button>
            </div>
          ) : areas.every((area) => (area.requisitos || []).length === 0) ? (
            <div className="ev-state"><p>El cuadernillo de {datos?.clase?.nombre || 'esta clase'} todavía no tiene requisitos cargados.</p></div>
          ) : (
            <>
              {tipos.length > 1 && (
                <div className="ev-switch" role="group" aria-label="Tipo de cuadernillo">
                  {tipos.map((opcion) => (
                    <button key={opcion} type="button" className={libro?.tipo === opcion ? 'is-on' : ''} aria-pressed={libro?.tipo === opcion} onClick={() => setTipo(opcion)}>
                      {opcion === 'AVANZADA' ? 'Avanzada' : 'Regular'}
                    </button>
                  ))}
                </div>
              )}

              {areas.filter((area) => (area.requisitos || []).length > 0).map((area) => {
                const requisitos = area.requisitos || [];
                const pendientes = requisitos.filter((requisito) => !estaFirmado(requisito));
                const firmados = requisitos.length - pendientes.length;
                const todosElegidos = pendientes.length > 0 && pendientes.every((requisito) => elegidos.has(requisito.id));
                return (
                  <section className="ev-area" key={area.id} aria-label={area.nombre}>
                    <div className="ev-area__head">
                      <h3>{area.nombre}</h3>
                      <span>{firmados}/{requisitos.length}</span>
                      {pendientes.length > 0 && (
                        <button type="button" className="ev-all" onClick={() => alternarArea(pendientes, todosElegidos)}>
                          {todosElegidos ? 'Quitar todos' : 'Marcar todos'}
                        </button>
                      )}
                    </div>
                    <ul className="ev-list">
                      {requisitos.map((requisito) => {
                        const firmado = estaFirmado(requisito);
                        const marcado = firmado || elegidos.has(requisito.id);
                        const lecturas = Array.isArray(requisito.referencias_lectura) ? requisito.referencias_lectura : [];
                        return (
                          <li key={requisito.id}>
                            <label className={firmado ? 'ev-req is-done' : marcado ? 'ev-req is-on' : 'ev-req'}>
                              <input
                                type="checkbox"
                                checked={marcado}
                                disabled={firmado || firmando}
                                onChange={() => alternar(requisito.id)}
                              />
                              <span className="ev-req__box" aria-hidden="true">{marcado && <Check size={14} strokeWidth={3} />}</span>
                              <span className="ev-req__text">
                                <span>
                                  <b>{requisito.numero_item}.</b> {lecturas.length > 0 ? requisito.descripcion.split(':')[0] : requisito.descripcion}
                                </span>
                                {lecturas.length > 0 && (
                                  <small>Leyó {firmado ? lecturas.length : (requisito.lecturas_completadas || []).length} de {lecturas.length} capítulos</small>
                                )}
                                {firmado && <small className="ev-req__signed">Firmado{requisito.fecha_firma ? ' el ' + fechaCorta(requisito.fecha_firma) : ''}</small>}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </>
          )}
        </div>

        {!cargando && !error && (
          <footer className="ev-foot">
            {errorFirma && <p className="ev-error" role="alert">{errorFirma}</p>}
            {confirmando ? (
              <div className="ev-confirm">
                <p>
                  <AlertTriangle size={18} aria-hidden="true" />
                  Vas a firmar {cantidad} {cantidad === 1 ? 'requisito' : 'requisitos'} de {nombreCorto}. Las firmas no se pueden deshacer desde la app.
                </p>
                <ul className="ev-confirm__list">
                  {[...elegidos].slice(0, 4).map((id) => (
                    <li key={id}>{descripcionPorId.get(id)?.descripcion?.split(':')[0]}</li>
                  ))}
                  {cantidad > 4 && <li>y {cantidad - 4} más</li>}
                </ul>
                <div className="ev-actions">
                  <button type="button" className="ev-button ev-button--ghost" onClick={() => setConfirmando(false)} disabled={firmando}>Volver</button>
                  <button type="button" className="ev-button" onClick={firmar} disabled={firmando}>
                    {firmando ? 'Firmando...' : 'Confirmar firma'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="ev-actions">
                <span className="ev-count">
                  {cantidad === 0 ? 'Tildá lo que cumplió hoy' : `${cantidad} ${cantidad === 1 ? 'seleccionado' : 'seleccionados'}`}
                </span>
                <button type="button" className="ev-button" onClick={() => setConfirmando(true)} disabled={cantidad === 0}>
                  Firmar{cantidad > 0 ? ` ${cantidad}` : ''}
                </button>
              </div>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
