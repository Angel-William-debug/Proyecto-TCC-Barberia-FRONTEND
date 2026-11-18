import { notFound } from 'next/navigation';

import { exigirSesion } from '@barber-shop/api';

import { VistaArticulo } from '@/componentes/ayuda/vista-articulo';
import { articuloPorId, puedeAbrir, rolDelManual } from '@/lib/ayuda';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: articuloPorId(id)?.titulo ?? 'Centro de ayuda' };
}

export default async function PaginaArticuloAyuda({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [usuario, { id }, consulta] = await Promise.all([exigirSesion(), params, searchParams]);
  const articulo = articuloPorId(id);
  // Un artículo de otro rol se trata como inexistente: no hay nada que
  // esconder en él, pero tampoco tiene sentido ofrecérselo a quien no lo usa.
  if (!articulo || !puedeAbrir(usuario.rol, articulo)) notFound();

  return (
    <VistaArticulo
      articulo={articulo}
      rol={rolDelManual(usuario.rol, consulta.rol)}
      rolSesion={usuario.rol}
      base="/panel/ayuda"
    />
  );
}
