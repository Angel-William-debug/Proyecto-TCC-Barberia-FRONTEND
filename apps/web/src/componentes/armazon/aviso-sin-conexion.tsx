'use client';

import { useEffect, useState } from 'react';

import { Icono } from '@barber-shop/ui';

/**
 * Error de conexión (vista 91 del anexo; 15/10/2026).
 *
 * Si el navegador pierde internet, una franja arriba lo dice antes de que la
 * persona intente guardar algo y reciba un error que no entiende. Al volver la
 * conexión, avisa unos segundos y se va sola.
 */
export function AvisoSinConexion() {
  const [estado, setEstado] = useState<'en-linea' | 'sin-conexion' | 'recuperada'>('en-linea');

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const caer = () => {
      clearTimeout(temporizador);
      setEstado('sin-conexion');
    };
    const volver = () => {
      setEstado('recuperada');
      temporizador = setTimeout(() => setEstado('en-linea'), 4000);
    };
    if (!navigator.onLine) caer();
    window.addEventListener('offline', caer);
    window.addEventListener('online', volver);
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener('offline', caer);
      window.removeEventListener('online', volver);
    };
  }, []);

  if (estado === 'en-linea') return null;

  const sinConexion = estado === 'sin-conexion';
  return (
    <div
      role="status"
      className={
        'text-cuerpo-sm fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 font-medium ' +
        (sinConexion
          ? 'bg-[var(--chip-peligro-fondo)] text-peligro'
          : 'bg-[var(--chip-exito-fondo)] text-exito')
      }
    >
      <Icono nombre={sinConexion ? 'circle-x' : 'circle-check'} tamano="sm" />
      {sinConexion
        ? 'Sin conexión a internet. Lo que haga no se va a guardar hasta que vuelva.'
        : 'Conexión recuperada.'}
    </div>
  );
}
