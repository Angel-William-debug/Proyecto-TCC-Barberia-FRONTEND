'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { TablaEscribible } from '@barber-shop/api';
import { BotonIcono } from '@barber-shop/ui';

import { borrarRegistro } from '@/acciones/catalogo';

/**
 * Botón de borrar genérico, para las pantallas de catálogo. Pide
 * confirmación con `window.confirm` -mismo mecanismo que ya usa
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

  function borrar() {
    if (!window.confirm(`¿Borrar "${nombre}"? Se puede restaurar desde la Papelera.`)) return;

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
      variante="terciario"
      tamano="sm"
      onClick={borrar}
      disabled={ocupado}
      aria-invalid={error ? true : undefined}
    />
  );
}
