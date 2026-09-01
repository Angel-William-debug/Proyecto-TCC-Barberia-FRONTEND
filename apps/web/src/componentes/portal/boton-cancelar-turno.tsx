'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Boton } from '@barber-shop/ui';

import { accionCancelarTurno } from '@/acciones/portal';

/**
 * Cancelar un turno reservado.
 *
 * Pide confirmacion con `window.confirm`, igual que `BotonBorrar`: el sistema
 * de diseno todavia no tiene un dialogo propio, y cancelar un turno no se
 * deshace desde el portal -para volver a tenerlo hay que reservar de nuevo, y
 * el horario puede haberlo tomado otro-.
 *
 * El boton no decide si el turno se puede cancelar. Eso lo decide la politica
 * `cliente_cancela_su_cita`, que solo alcanza turnos propios en estado
 * pendiente o confirmado; `TarjetaTurno` solo lo muestra cuando ademas el
 * turno no paso todavia.
 */
export function BotonCancelarTurno({ idCita }: { idCita: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function cancelar() {
    if (!window.confirm('¿Cancelar este turno? Para volver a tenerlo habrá que reservar de nuevo.')) {
      return;
    }

    setError(null);
    iniciar(async () => {
      const datos = new FormData();
      datos.set('idCita', String(idCita));

      const r = await accionCancelarTurno(datos);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <p role="alert" className="text-cuerpo-sm text-peligro">
          {error}
        </p>
      )}
      <Boton variante="terciario" tamano="sm" icono="x" onClick={cancelar} cargando={ocupado}>
        Cancelar turno
      </Boton>
    </div>
  );
}
