import { notFound } from 'next/navigation';

import { exigirSesion } from '@barber-shop/api';

import { VistaArticulo } from '@/componentes/ayuda/vista-articulo';
import { articuloPorId } from '@/lib/ayuda';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: articuloPorId(id)?.titulo ?? 'Ayuda' };
}

export default async function ArticuloAyudaCliente({ params }: { params: Promise<{ id: string }> }) {
  const [usuario, { id }] = await Promise.all([exigirSesion(), params]);
  const articulo = articuloPorId(id);
  if (!articulo || !articulo.roles.includes('cliente')) notFound();

  return <div className="mt-2"><VistaArticulo articulo={articulo} rol="cliente" rolSesion={usuario.rol} base="/mi-cuenta/ayuda" /></div>;
}
