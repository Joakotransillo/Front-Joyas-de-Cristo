import { useEffect, useState } from 'react';
import { UBICACION_CLUB } from '../config/club';
import { calcularHorasSolares } from '../utils/horasSolares';

const MOMENTOS = ['dia', 'atardecer', 'noche'];
const MINUTO = 60_000;

// Cuánto dura cada luz alrededor de la salida y la puesta del sol.
const AMANECER_ANTES = 30 * MINUTO;
const AMANECER_DESPUES = 45 * MINUTO;
const ATARDECER_ANTES = 60 * MINUTO;
const ATARDECER_DESPUES = 30 * MINUTO;

/**
 * Elige el cielo según la salida y la puesta del sol reales de ese día en la ubicación del club,
 * así acompaña los cambios de estación.
 */
export function calcularMomento(fecha = new Date(), ubicacion = UBICACION_CLUB) {
  const { salida, puesta } = calcularHorasSolares(fecha, ubicacion.latitud, ubicacion.longitud);

  // Respaldo por horario fijo si no se puede calcular el sol (no pasa en Argentina).
  if (!salida || !puesta) {
    const hora = fecha.getHours();
    if (hora >= 20 || hora < 6) return 'noche';
    if (hora < 7 || hora >= 18) return 'atardecer';
    return 'dia';
  }

  const ahora = fecha.getTime();
  const sale = salida.getTime();
  const sePone = puesta.getTime();

  if (ahora < sale - AMANECER_ANTES || ahora >= sePone + ATARDECER_DESPUES) return 'noche';
  if (ahora < sale + AMANECER_DESPUES || ahora >= sePone - ATARDECER_ANTES) return 'atardecer';
  return 'dia';
}

/**
 * El saludo acompaña al cielo: cuando en el paisaje se hace de noche, dice "Buenas noches".
 * Desde las 5 de la mañana dice "Buen día" aunque todavía esté oscuro (en invierno amanece tarde),
 * y lo sigue diciendo hasta las 13, como se acostumbra antes del almuerzo.
 */
export function calcularSaludo(momento, fecha = new Date()) {
  const hora = fecha.getHours();
  if (hora >= 5 && hora < 13) return '¡Buen día!';
  if (momento === 'noche') return '¡Buenas noches!';
  return '¡Buenas tardes!';
}

// En desarrollo se puede forzar un momento con ?cielo=dia|atardecer|noche para revisar cada paisaje.
function leerMomentoForzado() {
  if (!import.meta.env.DEV) return null;
  const valor = new URLSearchParams(window.location.search).get('cielo');
  return MOMENTOS.includes(valor) ? valor : null;
}

export default function useMomentoDelDia() {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    // Revisa la hora cada minuto para que el paisaje cambie solo si la página queda abierta.
    const intervalo = window.setInterval(() => setAhora(new Date()), MINUTO);
    return () => window.clearInterval(intervalo);
  }, []);

  const forzado = leerMomentoForzado();
  const momento = forzado || calcularMomento(ahora);

  return {
    momento,
    saludo: calcularSaludo(momento, ahora),
    forzado: Boolean(forzado)
  };
}
