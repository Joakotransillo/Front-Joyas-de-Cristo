// Cálculo de salida y puesta del sol (algoritmo del Almanaque Náutico usado por la NOAA).
// Tiene un margen de error de 1 a 2 minutos, suficiente para elegir el cielo del paisaje.

const RAD = Math.PI / 180;
const CENIT_OFICIAL = 90.833; // Sol justo en el horizonte, incluida la refracción atmosférica.

const normalizar = (valor, maximo) => ((valor % maximo) + maximo) % maximo;

function diaDelAnio(fecha) {
  const inicio = Date.UTC(fecha.getFullYear(), 0, 0);
  const hoy = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return Math.floor((hoy - inicio) / 86_400_000);
}

function calcularEvento(fecha, latitud, longitud, esSalida) {
  const n = diaDelAnio(fecha);
  const horaLongitud = longitud / 15;
  const t = n + ((esSalida ? 6 : 18) - horaLongitud) / 24;

  const anomaliaMedia = 0.9856 * t - 3.289;
  const longitudSol = normalizar(
    anomaliaMedia
      + 1.916 * Math.sin(anomaliaMedia * RAD)
      + 0.020 * Math.sin(2 * anomaliaMedia * RAD)
      + 282.634,
    360
  );

  let ascensionRecta = normalizar(Math.atan(0.91764 * Math.tan(longitudSol * RAD)) / RAD, 360);
  ascensionRecta += Math.floor(longitudSol / 90) * 90 - Math.floor(ascensionRecta / 90) * 90;
  ascensionRecta /= 15;

  const senoDeclinacion = 0.39782 * Math.sin(longitudSol * RAD);
  const cosenoDeclinacion = Math.cos(Math.asin(senoDeclinacion));
  const cosenoHorario = (Math.cos(CENIT_OFICIAL * RAD) - senoDeclinacion * Math.sin(latitud * RAD))
    / (cosenoDeclinacion * Math.cos(latitud * RAD));

  // Fuera de este rango el sol no sale o no se pone ese día (solo pasa cerca de los polos).
  if (cosenoHorario > 1 || cosenoHorario < -1) return null;

  const anguloHorario = (esSalida
    ? 360 - Math.acos(cosenoHorario) / RAD
    : Math.acos(cosenoHorario) / RAD) / 15;

  const horaLocalMedia = anguloHorario + ascensionRecta - 0.06571 * t - 6.622;
  const horaUtc = normalizar(horaLocalMedia - horaLongitud, 24);

  return new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) + horaUtc * 3_600_000);
}

/**
 * Devuelve la salida y la puesta del sol del día de `fecha` en el lugar indicado.
 * Cualquiera de las dos puede ser null en latitudes polares.
 */
export function calcularHorasSolares(fecha, latitud, longitud) {
  return {
    salida: calcularEvento(fecha, latitud, longitud, true),
    puesta: calcularEvento(fecha, latitud, longitud, false)
  };
}
