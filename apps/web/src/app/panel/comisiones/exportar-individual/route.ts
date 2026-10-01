import { NextResponse } from 'next/server';

import { exigirSesion, exportarFichasComisionesZip, MODO_DEMO } from '@barber-shop/api';

/**
 * Opción A del pedido de la profesora: un PDF de liquidación por barbero,
 * empaquetados en un `.zip`.
 */
export async function GET(): Promise<NextResponse> {
  await exigirSesion();

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no puede exportar: no hay datos reales que exportar.',
      { status: 403 },
    );
  }

  try {
    const zip = await exportarFichasComisionesZip();
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="comisiones-fichas.zip"',
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudieron generar las fichas.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
