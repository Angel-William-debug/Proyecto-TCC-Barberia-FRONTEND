'use client';

import { useState, useTransition } from 'react';

import type { MiValoracion } from '@barber-shop/api';
import { Boton, cn } from '@barber-shop/ui';

import { accionValorarTurno } from '@/acciones/portal';

/**
 * Calificar un turno completado, de 1 a 5 estrellas, con un comentario
 * opcional (14/10/2026). Lo usa el Historial del portal. Las notas alimentan
 * la columna «Valoración» del Ranking de barberos.
 *
 * Las estrellas son un grupo de radio (WAI-ARIA): cada una dice «3 de 5
 * estrellas» y la elegida queda marcada. Elegir una abre el comentario y el
 * botón; una ya calificada se muestra resumida y se puede cambiar.
 */
export function CalificarTurno({ idCita, actual }: { idCita: number; actual: MiValoracion | null }) {
  const [puntaje, setPuntaje] = useState(actual?.puntaje ?? 0);
  const [comentario, setComentario] = useState(actual?.comentario ?? '');
  const [editando, setEditando] = useState(!actual);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  function guardar() {
    const datos = new FormData();
    datos.set('idCita', String(idCita));
    datos.set('puntaje', String(puntaje));
    datos.set('comentario', comentario);
    setError(null);
    iniciar(async () => {
      const r = await accionValorarTurno(datos);
      if (!r.ok) return setError(r.error);
      setEditando(false);
    });
  }

  if (!editando) {
    return (
      <div className="text-cuerpo-sm flex flex-wrap items-center gap-2">
        <span className="text-marca" aria-label={`Su calificación: ${puntaje} de 5 estrellas`}>
          {'★'.repeat(puntaje)}
          <span className="text-deshabilitado">{'★'.repeat(5 - puntaje)}</span>
        </span>
        {comentario && <span className="text-secundario">«{comentario}»</span>}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-terciario hover:text-principal cursor-pointer underline"
        >
          Cambiar
        </button>
      </div>
    );
  }

  const visible = hover || puntaje;

  return (
    <div className="bg-fondo border-borde-sutil flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-cuerpo-sm text-secundario">¿Cómo le fue?</span>
        <div role="radiogroup" aria-label="Calificación del turno" className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={puntaje === n}
              aria-label={`${n} de 5 estrellas`}
              onClick={() => setPuntaje(n)}
              onMouseEnter={() => setHover(n)}
              className={cn(
                'cursor-pointer px-0.5 text-2xl leading-none transition-colors',
                n <= visible ? 'text-marca' : 'text-deshabilitado',
              )}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {puntaje > 0 && (
        <>
          <label className="sr-only" htmlFor={`comentario-${idCita}`}>
            Comentario (opcional)
          </label>
          <textarea
            id={`comentario-${idCita}`}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Un comentario para la barbería (opcional)"
            className="bg-superficie border-borde-control text-principal text-cuerpo-sm w-full rounded-md border px-3 py-2"
          />
          {error && <p className="text-cuerpo-sm text-peligro">{error}</p>}
          <div className="flex gap-2">
            <Boton variante="primario" tamano="sm" cargando={guardando} onClick={guardar}>
              Enviar calificación
            </Boton>
            {actual && (
              <Boton variante="terciario" tamano="sm" onClick={() => setEditando(false)} disabled={guardando}>
                Cancelar
              </Boton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
