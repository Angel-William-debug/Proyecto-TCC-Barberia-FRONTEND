'use client';

import { useEffect, useState } from 'react';

export interface ColoresChart {
  texto: string;
  grilla: string;
  tooltipFondo: string;
  peligro: string;
}

const VALORES_INICIALES: ColoresChart = {
  texto: '#9C9284',
  grilla: '#3A322C',
  tooltipFondo: '#2B2521',
  peligro: '#E2685C',
};

function leerColores(): ColoresChart {
  const estilo = getComputedStyle(document.documentElement);
  return {
    texto: estilo.getPropertyValue('--texto-terciario').trim() || VALORES_INICIALES.texto,
    grilla: estilo.getPropertyValue('--borde-sutil').trim() || VALORES_INICIALES.grilla,
    tooltipFondo:
      estilo.getPropertyValue('--fondo-superficie').trim() || VALORES_INICIALES.tooltipFondo,
    peligro: estilo.getPropertyValue('--peligro').trim() || VALORES_INICIALES.peligro,
  };
}

/**
 * Colores de ejes/grilla/tooltip para Chart.js, leídos de las variables CSS
 * del sistema de diseño. Chart.js no entiende `var(...)`, así que hay que
 * resolverlas a valores concretos del lado del cliente.
 *
 * Se vuelven a leer cuando cambia `data-tema` en <html> (ver
 * `componentes/armazon/selector-tema.tsx`), para que el gráfico siga el
 * toggle de tema claro/oscuro sin necesitar recargar la página.
 */
export function usarColoresChart(): ColoresChart {
  const [colores, setColores] = useState<ColoresChart>(VALORES_INICIALES);

  useEffect(() => {
    setColores(leerColores());

    const observador = new MutationObserver(() => setColores(leerColores()));
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tema'],
    });

    return () => observador.disconnect();
  }, []);

  return colores;
}
