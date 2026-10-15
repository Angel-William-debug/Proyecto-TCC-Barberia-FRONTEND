'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { TablaEscribible } from '@barber-shop/api';
import { BotonIcono, useConfirmar } from '@barber-shop/ui';

import { borrarRegistro } from '@/acciones/borrado';

/**
 * Botón de borrar genérico, para las pantallas de catálogo. Pide
 * confirmación con `useConfirmar` (antes `window.confirm`) -el mismo que usa
 * `PanelLateral` para "hay cambios sin guardar"- porque no existe todavía un
 * componente de diálogo propio en el sistema de diseño.
 */
export function BotonBorrar({
  tabla,
  id,
  nombre,
}: {
  tabla: TablaEscribible;
  id: number;
  nombre: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const confirmar = useConfirmar();

  async function borrar() {
    const ok = await confirmar({
      titulo: `¿Borrar «${nombre}»?`,
      mensaje: 'Se puede restaurar desde la Papelera.',
      textoConfirmar: 'Borrar',
      peligro: true,
    });
    if (!ok) return;

    setError(null);
    iniciar(async () => {
      const r = await borrarRegistro(tabla, id);
      if (!r.ok) {
        setError(r.error);
        window.alert(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <BotonIcono
      icono="trash-2"
      etiqueta={`Borrar ${nombre}`}
      // §9.3 del sistema de diseño: «Eliminar» usa peligro-sutil, no
      // terciario -ahi mismo se ve el ejemplo con este icono exacto-. Esto
      // es compartido por todas las tablas del sistema, no solo Clientes.
      variante="peligro-sutil"
      tamano="sm"
      onClick={borrar}
      disabled={ocupado}
      aria-invalid={error ? true : undefined}
    />
  );
}
