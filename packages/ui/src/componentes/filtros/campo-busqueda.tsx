'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Icono } from '../icono';
import { useFiltros } from './url';
import { cn } from '../../utilidades';

/**
 * Busqueda de texto libre. Escribe el parametro `q`.
 *
 * Espera 400 ms antes de navegar. Es el unico control que espera, y espera por
 * rendimiento: sin eso cada tecla dispara una consulta.
 */
export interface PropsCampoBusqueda {
  /** Nombre del parámetro en la URL. Por convención, `q`. */
  nombre?: string;
  placeholder: string;
  etiqueta?: string;
}

/**
 * Búsqueda libre. Espera 400 ms desde la última tecla antes de navegar: sin
 * esa demora, escribir «González» dispararía ocho consultas.
 */
export function CampoBusqueda({
  nombre = 'q',
  placeholder,
  etiqueta = 'Buscar',
}: PropsCampoBusqueda) {
  const { params, aplicar } = useFiltros();
  const id = useId();
  const valorUrl = params.get(nombre) ?? '';
  const [texto, setTexto] = useState(valorUrl);
  const primeraVez = useRef(true);

  // Sincroniza cuando la URL cambia por fuera: botón Atrás, o «Limpiar todo».
  useEffect(() => {
    setTexto(valorUrl);
  }, [valorUrl]);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    if (texto === valorUrl) return;

    const temporizador = setTimeout(() => aplicar({ [nombre]: texto.trim() || null }), 400);
    return () => clearTimeout(temporizador);
    // `aplicar` y `valorUrl` cambian en cada render de la navegación; incluirlos
    // reiniciaría el temporizador y la búsqueda nunca se dispararía.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="flex min-w-[16rem] flex-1 flex-col gap-2 sm:max-w-sm">
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
      </label>
      <div className="relative flex items-center">
        <span className="text-terciario pointer-events-none absolute left-3">
          <Icono nombre="search" tamano="sm" />
        </span>
        <input
          id={id}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'bg-fondo border-borde-control text-principal placeholder:text-terciario',
            'text-cuerpo h-10 w-full rounded-md border pr-3 pl-9',
          )}
        />
      </div>
    </div>
  );
}
