'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId } from 'react';

import { BotonIcono, cn } from '@barber-shop/ui';

/**
 * Selector de un día, con flechas para moverse al anterior y al siguiente.
 *
 * La agenda no necesita un rango sino un día concreto, y sobre todo necesita
 * que pasar al día siguiente sea un clic: es el gesto que un recepcionista
 * repite treinta veces por jornada.
 */
export function FiltroFecha({ valor, nombre = 'fecha' }: { valor: string; nombre?: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const id = useId();

  function ir(nuevaFecha: string) {
    const siguientes = new URLSearchParams(params.toString());
    siguientes.set(nombre, nuevaFecha);
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  function correr(dias: number) {
    // Se construye en UTC a mediodía para que sumar un día no caiga en el
    // día anterior por el desfase horario.
    const [a, m, d] = valor.split('-').map(Number);
    const base = new Date(Date.UTC(a!, m! - 1, d!, 12));
    base.setUTCDate(base.getUTCDate() + dias);
    ir(base.toISOString().slice(0, 10));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        Día
      </label>
      <div className="flex items-center gap-2">
        <BotonIcono
          icono="chevron-left"
          etiqueta="Día anterior"
          variante="secundario"
          onClick={() => correr(-1)}
        />
        <input
          id={id}
          type="date"
          value={valor}
          onChange={(e) => e.target.value && ir(e.target.value)}
          className={cn(
            'bg-fondo border-borde-control text-principal',
            'text-cuerpo h-10 rounded-md border px-3',
          )}
        />
        <BotonIcono
          icono="chevron-right"
          etiqueta="Día siguiente"
          variante="secundario"
          onClick={() => correr(1)}
        />
      </div>
    </div>
  );
}
