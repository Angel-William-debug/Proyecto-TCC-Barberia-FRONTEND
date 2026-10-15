import Link from 'next/link';
import { notFound } from 'next/navigation';

import { listarProfesionales } from '@barber-shop/api';
import { BotonIcono, ChipEstado, ZONA_HORARIA, porcentaje } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { ResumenBarbero } from '@/componentes/barberos/resumen-barbero';

export const metadata = { title: 'Perfil del barbero' };

/**
 * Perfil del barbero (vista 36 del anexo; 15/10/2026): su ficha y el mismo
 * tablero que él ve en «Mi día» -agenda de hoy, servicios de 30 días y
 * comisiones pendientes-, para que el administrador lo consulte sin tener que
 * armarlo desde tres pantallas.
 */
export default async function PaginaPerfilBarbero({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idProfesional = Number(id);
  if (!Number.isFinite(idProfesional)) notFound();

  const barbero = (await listarProfesionales({})).find((b) => b.id_profesional === idProfesional);
  if (!barbero) notFound();

  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
  const detalle = [barbero.especialidad, barbero.tipo, `comisión ${porcentaje(barbero.porcentaje_com)}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="mb-2">
        <Link href="/panel/barberos" className="inline-flex">
          <BotonIcono icono="chevron-left" etiqueta="Volver a barberos" variante="terciario" tamano="sm" />
        </Link>
      </div>
      <EncabezadoVista
        titulo={barbero.nombre}
        descripcion={detalle}
        accion={
          <ChipEstado
            presentacion={
              barbero.estado
                ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
            }
          />
        }
      />
      <ResumenBarbero idProfesional={idProfesional} hoy={hoy} propio={false} />
    </>
  );
}
