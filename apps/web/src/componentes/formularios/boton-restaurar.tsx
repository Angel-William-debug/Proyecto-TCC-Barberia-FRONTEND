'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { TablaEscribible } from '@barber-shop/api';
import { Boton } from '@barber-shop/ui';

import { restaurarRegistro } from '@/acciones/catalogo';

/**
 * Restaurar puede fallar legítimamente: si mientras el registro estuvo
 * borrado otro tomó su valor único (el correo de un cliente, el nombre de un
 * servicio dentro de su categoría), la base rechaza la restauración porque
 * quedarían dos vigentes iguales. `errores.ts` traduce ese rechazo a un
 * mensaje que nombra el caso.
 */
export function BotonRestaurar({ tabla, id }: { tabla: TablaEscribible; id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function restaurar() {
    setError(null);
    iniciar(async () => {
      const r = await restaurarRegistro(tabla, id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton variante="secundario" tamano="sm" icono="check" onClick={restaurar} cargando={ocupado}>
        Restaurar
      </Boton>
      {error && <span className="text-etiqueta text-peligro max-w-56 text-right">{error}</span>}
    </div>
  );
}
