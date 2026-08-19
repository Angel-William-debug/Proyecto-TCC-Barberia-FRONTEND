'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Boton } from '@barber-shop/ui';

import { resolverAlerta } from '@/acciones/inventario';

/** CU-022 — marca una alerta de stock como resuelta a mano. */
export function BotonResolverAlerta({ idAlerta }: { idAlerta: number }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();

  function resolver() {
    iniciar(async () => {
      const r = await resolverAlerta(idAlerta);
      if (r.ok) router.refresh();
    });
  }

  return (
    <Boton variante="terciario" tamano="sm" icono="check" onClick={resolver} cargando={ocupado}>
      Marcar resuelta
    </Boton>
  );
}
