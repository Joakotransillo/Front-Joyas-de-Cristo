import { Link, useLocation } from 'react-router-dom';
import brandLogo from '../assets/joyas-de-cristo-logo-256.png';
import useMomentoDelDia from '../hooks/useMomentoDelDia';
import CampScene from './CampScene';
import './AuthLayout.css';

export const LEMA = '“El amor de Cristo me motiva”';

const NOMBRES_MOMENTO = { dia: 'día', atardecer: 'atardecer', noche: 'noche' };

/**
 * Estructura compartida del login y la solicitud de cuenta:
 * paisaje de campamento (arriba en celular, a la izquierda en computadora) y el formulario.
 * `intro` se muestra sobre el paisaje solo en computadora.
 */
export default function AuthLayout({ intro, labelledBy, children }) {
  const { momento, forzado } = useMomentoDelDia();
  const location = useLocation();

  return (
    <main className="lg" data-momento={momento}>
      <section className="lg-scene" aria-label="Club de Conquistadores Joyas de Cristo">
        <CampScene momento={momento} />

        <div className="lg-intro">
          <div className="lg-intro__brand">
            <img src={brandLogo} alt="Escudo del club" width="72" height="72" />
            <div>
              <p>Club de Conquistadores</p>
              <h2>Joyas de Cristo</h2>
            </div>
          </div>
          <p className="lg-intro__lema">{LEMA}</p>
          {intro}
        </div>
      </section>

      <div className="lg-badge">
        <img src={brandLogo} alt="Escudo del club Joyas de Cristo" width="96" height="96" />
      </div>

      <section className="lg-panel" aria-labelledby={labelledBy}>
        <div className="lg-panel__inner">
          {children}
        </div>
      </section>

      {forzado && (
        <div className="lg-preview" role="status">
          <span>Vista de prueba: cielo de {NOMBRES_MOMENTO[momento]}</span>
          <Link to={location.pathname} state={location.state} replace>Usar la hora real</Link>
        </div>
      )}
    </main>
  );
}
