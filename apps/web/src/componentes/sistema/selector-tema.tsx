'use client';

import { useEffect, useState } from 'react';

import { BotonIcono } from '@barber-shop/ui';

type Tema = 'oscuro' | 'claro';
const CLAVE = 'barber-shop:tema';

/**
 * Alterna entre los dos temas de la seccion 4.7.
 *
 * El tema se aplica escribiendo `data-tema` en el elemento <html>, que es lo
 * que leen las variables CSS. No hay ninguna clase que recorrer ni ningun
 * componente que volver a renderizar: cambia una sola propiedad y toda la
 * interfaz acompana.
 *
 * El estado inicial se resuelve en el cliente, despues del montaje, porque el
 * servidor no conoce la preferencia guardada.
 */
export function SelectorTema() {
  const [tema, setTema] = useState<Tema>('oscuro');
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE) as Tema | null;
    const inicial: Tema =
      guardado ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro');

    aplicar(inicial);
    setTema(inicial);
    setMontado(true);
  }, []);

  function aplicar(nuevo: Tema) {
    if (nuevo === 'claro') {
      document.documentElement.setAttribute('data-tema', 'claro');
    } else {
      document.documentElement.removeAttribute('data-tema');
    }
  }

  function alternar() {
    const nuevo: Tema = tema === 'oscuro' ? 'claro' : 'oscuro';
    aplicar(nuevo);
    window.localStorage.setItem(CLAVE, nuevo);
    setTema(nuevo);
  }

  // Antes del montaje se reserva el espacio para que la barra no salte.
  if (!montado) return <span className="inline-block h-10 w-10" aria-hidden="true" />;

  return (
    <BotonIcono
      icono={tema === 'oscuro' ? 'sun' : 'moon'}
      etiqueta={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      variante="terciario"
      onClick={alternar}
    />
  );
}
