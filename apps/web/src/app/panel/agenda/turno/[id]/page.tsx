import { notFound, redirect } from 'next/navigation';

import { obtenerCita } from '@barber-shop/api';

/**
 * Un turno por su número (QA F2-10, 11/11/2026).
 *
 * La agenda no tiene una pantalla por turno: lo que hay es el día. Esta ruta
 * existe para poder enlazar un turno desde la auditoría o desde la actividad
 * de un usuario, y lleva a la agenda de ese día filtrada por su cliente.
 */
export default async function TurnoPorNumero({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const cita = await obtenerCita(id).catch(() => null);
  if (!cita) notFound();

  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date(cita.fecha_hora));
  redirect(`/panel/agenda?fecha=${dia}&q=${encodeURIComponent(cita.cliente.nombre)}`);
}
