import { useId } from 'react';
import './CampScene.css';

const PALETAS = {
  dia: {
    cieloArriba: '#BFDDEA',
    cieloAbajo: '#F6EEDB',
    montanaLejos: '#9DBBA6',
    montanaMedia: '#4F8A6B',
    suelo: '#1F5A43',
    pinos: '#173F30',
    puerta: '#6B3510'
  },
  atardecer: {
    cieloArriba: '#E9875A',
    cieloAbajo: '#F8D9A4',
    montanaLejos: '#B98A7D',
    montanaMedia: '#6E5F52',
    suelo: '#3A4636',
    pinos: '#262F24',
    puerta: '#F2A33A'
  },
  noche: {
    cieloArriba: '#0B1628',
    cieloAbajo: '#1D3557',
    montanaLejos: '#1E3352',
    montanaMedia: '#16273F',
    suelo: '#0E1A2C',
    pinos: '#0A1322',
    puerta: '#F7B955'
  }
};

const ESTRELLAS = [
  [40, 200, 1.6], [96, 236, 1.2], [150, 196, 1.8], [210, 252, 1.1], [262, 210, 1.5],
  [318, 240, 1.2], [380, 196, 1.7], [540, 214, 1.3], [570, 268, 1.1], [24, 290, 1.2],
  [120, 300, 1.4], [240, 316, 1.1], [352, 292, 1.3], [500, 300, 1.2], [70, 120, 1.3],
  [200, 90, 1.5], [330, 60, 1.2], [420, 130, 1.4], [560, 100, 1.2], [130, 40, 1.1]
];

function Pino({ x, y, ancho }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${ancho / 30})`}
      d="M15 0L4 18h6L1 32h8L0 46h30l-9-14h8l-9-14h6zM13 46h4v7h-4z"
    />
  );
}

/**
 * Paisaje de campamento que cambia de cielo según el momento del día.
 * Es decorativo: los lectores de pantalla lo ignoran.
 */
export default function CampScene({ momento = 'dia', className = '' }) {
  const id = useId().replace(/:/g, '');
  const p = PALETAS[momento] || PALETAS.dia;
  const esNoche = momento === 'noche';

  return (
    <svg
      className={`camp-scene camp-scene--${momento} ${className}`}
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`cielo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.cieloArriba} />
          <stop offset="1" stopColor={p.cieloAbajo} />
        </linearGradient>
        <radialGradient id={`brillo-${id}`}>
          <stop offset="0" stopColor="#F2A33A" stopOpacity={esNoche ? 0.55 : 0.3} />
          <stop offset="1" stopColor="#F2A33A" stopOpacity="0" />
        </radialGradient>
        <mask id={`luna-${id}`}>
          <rect width="600" height="600" fill="#fff" />
          <circle cx="486" cy="228" r="30" fill="#000" />
        </mask>
      </defs>

      <rect width="600" height="600" fill={`url(#cielo-${id})`} />

      {momento === 'dia' && (
        <g>
          <circle cx="470" cy="250" r="44" fill="#F5C063" />
          <g fill="#FFFFFF" opacity=".85">
            <ellipse cx="350" cy="214" rx="40" ry="12" />
            <ellipse cx="376" cy="205" rx="26" ry="12" />
            <ellipse cx="560" cy="300" rx="30" ry="9" />
          </g>
          <g fill="none" stroke="#6F8F86" strokeWidth="2" strokeLinecap="round">
            <path d="M220 280q8-7 16 0q7-5 14 0" />
            <path d="M262 262q6-5 12 0q5-4 10 0" />
          </g>
        </g>
      )}

      {momento === 'atardecer' && (
        <g>
          <circle cx="450" cy="292" r="68" fill="#F4B860" opacity=".5" />
          <circle cx="450" cy="292" r="50" fill="#EE8E44" />
          <g fill="none" stroke="#8A4A2E" strokeWidth="2" strokeLinecap="round">
            <path d="M120 260q8-7 16 0q7-5 14 0" />
            <path d="M160 240q6-5 12 0q5-4 10 0" />
            <path d="M440 280q7-6 14 0q6-4 12 0" />
          </g>
        </g>
      )}

      {esNoche && (
        <g>
          <g fill="#FFFFFF" className="camp-scene__stars">
            {ESTRELLAS.map(([cx, cy, r], indice) => (
              <circle key={indice} cx={cx} cy={cy} r={r} style={{ animationDelay: `${(indice % 5) * 0.7}s` }} />
            ))}
          </g>
          <path d="M360 118l80-26"stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
          <circle cx="470" cy="236" r="32" fill="#F3E2B5" mask={`url(#luna-${id})`} />
        </g>
      )}

      <path d="M0 380L110 270l70 50 120-130 120 140 70-50 110 70v250H0z" fill={p.montanaLejos} />
      {momento === 'dia' && <path d="M300 190l22 28-12-4-10 14-10-15-12 5z" fill="#F7F3EA" />}
      <path d="M0 450l130-80 100 50 130-90 120 80 120-30v220H0z" fill={p.montanaMedia} />

      <circle cx="216" cy="515" r="120" fill={`url(#brillo-${id})`} />

      <path d="M0 600v-95c110-25 220-13 320-23s200-12 280 10v108z" fill={p.suelo} />

      <g fill={p.pinos}>
        <Pino x={14} y={420} ancho={46} />
        <Pino x={56} y={450} ancho={34} />
        <Pino x={96} y={470} ancho={26} />
        <Pino x={520} y={410} ancho={50} />
        <Pino x={488} y={452} ancho={32} />
        <Pino x={566} y={460} ancho={30} />
      </g>

      <g transform="translate(372 470)">
        <path d="M50 2l48 64H2z" fill="#D9792B" />
        <path d="M50 2l48 64H74z" fill="#B85F1C" />
        <path d="M50 22l15 44H35z" fill={p.puerta} />
        <path d="M50 2v64" stroke="#7A3E14" strokeWidth="1.5" />
      </g>

      <g transform="translate(194 494)" className="camp-scene__fire">
        <path d="M4 40l40-9M4 31l40 9" stroke="#6B4423" strokeWidth="5" strokeLinecap="round" />
        <path className="camp-scene__flame" d="M24 0c4 8 13 12 13 22a13 13 0 0 1-26 0c0-7 4-10 6-15 3 4 4 7 4 7s0-8 3-14z" fill="#F2A33A" />
        <path className="camp-scene__flame camp-scene__flame--inner" d="M24 16c3 4 6 7 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z" fill="#FCE3A1" />
      </g>

      {esNoche && (
        <g fill="#F7B955">
          <circle cx="210" cy="482" r="1.8" />
          <circle cx="220" cy="468" r="1.3" />
          <circle cx="206" cy="456" r="1.1" />
        </g>
      )}
    </svg>
  );
}
