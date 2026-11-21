// Tema de la app según la clase del conquistador: toda la interfaz toma el color de su insignia.

// Clases progresivas en orden, con el color de su insignia (database/seed.sql).
export const CLASES = [
  { nombre: 'Amigo', color: '#1E40AF' },
  { nombre: 'Compañero', color: '#DC2626' },
  { nombre: 'Explorador', color: '#166534' },
  { nombre: 'Pionero', color: '#6B7280' },
  { nombre: 'Excursionista', color: '#7C3AED' },
  { nombre: 'Guía', color: '#CA8A04' }
];

const VERDE_DEL_CLUB = '#1F5A43';

/** Color de la insignia de la clase: el de la base de datos o, si falta, el del catálogo. */
export function colorDeClase(clase) {
  const color = clase?.color_insignia;
  if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) return color;
  return CLASES.find((item) => item.nombre === clase?.nombre)?.color || VERDE_DEL_CLUB;
}

const aRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const aHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

// Mezcla dos colores: t = 0 devuelve a, t = 1 devuelve b.
export function mezclar(a, b, t) {
  const ra = aRgb(a);
  const rb = aRgb(b);
  return aHex(ra.map((v, i) => v + (rb[i] - v) * t));
}

function luminancia(hex) {
  const [r, g, b] = aRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrasteConBlanco = (hex) => 1.05 / (luminancia(hex) + 0.05);

/**
 * Devuelve las variables de color (las mismas de tema.css) teñidas con el color de la clase.
 * El color principal se oscurece lo necesario para que el texto blanco se lea bien
 * (contraste 4.5:1), así funciona también con el dorado de Guía o el verde claro de Pionero.
 */
export function temaDeClase(colorBase) {
  let principal = colorBase;
  for (let i = 0; i < 20 && contrasteConBlanco(principal) < 4.6; i += 1) {
    principal = mezclar(principal, '#000000', 0.08);
  }

  return {
    '--jc-pino': principal,
    '--jc-pino-oscuro': mezclar(principal, '#000000', 0.22),
    '--jc-menu': mezclar(principal, '#000000', 0.12),
    '--jc-salvia': mezclar(colorBase, '#FFFFFF', 0.87),
    '--jc-salvia-fuerte': mezclar(colorBase, '#FFFFFF', 0.7),
    '--jc-arena': mezclar(colorBase, '#F6F2E8', 0.9),
    '--jc-arena-tinta': mezclar(principal, '#5E5A50', 0.55),
    '--jc-borde': mezclar(colorBase, '#E4E6E2', 0.88),
    '--jc-fondo': mezclar(colorBase, '#FCFCFA', 0.965),
    '--jc-clase': colorBase
  };
}

/** Tema para un perfil: solo los conquistadores tienen la app del color de su clase. */
export function temaParaPerfil(perfil) {
  if (perfil?.rol !== 'CONQUISTADOR' || !perfil?.clase) return undefined;
  return temaDeClase(colorDeClase(perfil.clase));
}
