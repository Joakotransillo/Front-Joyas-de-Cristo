import { Award, Briefcase, Check, Hammer, HandHeart, HeartPulse, Leaf, Sprout, Tent } from 'lucide-react';
import './Parche.css';

// Color e ícono de cada área de especialidades, según palabras del nombre de la categoría.
const AREAS = [
  { claves: ['naturaleza'], color: '#2F7D5B', Icono: Leaf },
  { claves: ['aire libre', 'recreativ', 'acampar'], color: '#0F7A8A', Icono: Tent },
  { claves: ['salud', 'ciencia'], color: '#C2410C', Icono: HeartPulse },
  { claves: ['manual', 'práctic', 'practic', 'doméstic', 'domestic', 'arte'], color: '#B45309', Icono: Hammer },
  { claves: ['misioner', 'comunitari', 'adra'], color: '#9D174D', Icono: HandHeart },
  { claves: ['agr', 'agropecuari'], color: '#4D7C0F', Icono: Sprout },
  { claves: ['profesional', 'vocacional'], color: '#1D4ED8', Icono: Briefcase }
];

export function estiloDeArea(categoria = '') {
  const texto = categoria.toLowerCase();
  return AREAS.find((area) => area.claves.some((clave) => texto.includes(clave))) || { color: '#475569', Icono: Award };
}

/**
 * Parche redondo de una especialidad, con el borde cosido de los parches de tela.
 * Si la especialidad tiene imagen (insignia_url) se usa esa; si no, el ícono del área.
 */
export default function Parche({ especialidad, tamano = 72 }) {
  const { color, Icono } = estiloDeArea(especialidad.categoria);
  const completa = Boolean(especialidad.completada);

  return (
    <span
      className={completa ? 'parche is-done' : 'parche'}
      style={{ '--parche': color, '--tam': `${tamano}px` }}
      aria-hidden="true"
    >
      {especialidad.insignia_url
        ? <img src={especialidad.insignia_url} alt="" />
        : <Icono size={Math.round(tamano * 0.42)} strokeWidth={1.9} />}
      {completa && <span className="parche__ok"><Check size={Math.max(12, Math.round(tamano * 0.18))} strokeWidth={3} /></span>}
    </span>
  );
}
