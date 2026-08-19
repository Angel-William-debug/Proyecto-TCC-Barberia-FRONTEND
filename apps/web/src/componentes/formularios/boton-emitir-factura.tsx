'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Boton } from '@barber-shop/ui';

import { emitirFactura } from '@/acciones/facturas';

/** CU-025 (anexo) — emite el comprobante de un cobro ya pagado. */
export function BotonEmitirFactura({ idCobro }: { idCobro: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function emitir() {
    setError(null);
    iniciar(async () => {
      const r = await emitirFactura(idCobro);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Boton variante="terciario" tamano="sm" icono="file-text" onClick={emitir} cargando={ocupado}>
        Facturar
      </Boton>
      {error && <span className="text-etiqueta text-peligro">{error}</span>}
    </div>
  );
}
