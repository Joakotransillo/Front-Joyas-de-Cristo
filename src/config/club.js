// Ubicación del club. Se usa para calcular la salida y la puesta del sol del paisaje del login.
// Se puede cambiar sin tocar el código con VITE_CLUB_LATITUD y VITE_CLUB_LONGITUD en el archivo .env.
const numeroOPorDefecto = (valor, porDefecto) => {
  const numero = Number.parseFloat(valor);
  return Number.isFinite(numero) ? numero : porDefecto;
};

export const UBICACION_CLUB = Object.freeze({
  latitud: numeroOPorDefecto(import.meta.env.VITE_CLUB_LATITUD, -34.6085),
  longitud: numeroOPorDefecto(import.meta.env.VITE_CLUB_LONGITUD, -58.9517)
});
