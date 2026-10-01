'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Boton } from '@barber-shop/ui';

import { accionGenerarMisRecomendaciones } from '@/acciones/portal';

/**
 * Genera o actualiza las recomendaciones del cliente.
 *
 * Si las que tiene son de las ultimas 24 horas, el servidor no recalcula y
 * lo dice: un boton que «no hace nada» sin explicacion parece roto.
 */
export function BotonMisRecomendaciones({ hayRecomendaciones }: { hayRecomendaciones: boolean }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<{ tono: 'error' | 'info'; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();

  function generar() {
    setAviso(null);
    iniciar(async () => {
      const r = await accionGenerarMisRecomendaciones();
      if (!r.ok) {
        setAviso({ tono: 'error', texto: r.error });
        return;
      }
      if (r.cantidad === 0) {
        // Paso con la cuenta de prueba: habia probado cinco de los seis
        // servicios, y el sexto no lo habia pedido nadie. No hay error; no
        // hay nada que recomendar, y hay que decirlo.
        setAviso({
          tono: 'info',
          texto:
            'Por ahora no tenemos servicios nuevos para recomendarle: ya probó casi todo lo ' +
            'que ofrecemos, o lo que le falta todavía no lo pidió nadie.',
        });
      } else if (!r.nuevas) {
        setAviso({
          tono: 'info',
          texto: 'Sus recomendaciones ya están al día. Se actualizan una vez por día.',
        });
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Boton
        variante={hayRecomendaciones ? 'secundario' : 'primario'}
        icono="sparkles"
        onClick={generar}
        cargando={ocupado}
      >
        {hayRecomendaciones ? 'Actualizar' : 'Ver mis recomendaciones'}
      </Boton>
      {aviso && (
        <p
          role={aviso.tono === 'error' ? 'alert' : 'status'}
          className={aviso.tono === 'error' ? 'text-cuerpo-sm text-peligro' : 'text-cuerpo-sm text-terciario'}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
