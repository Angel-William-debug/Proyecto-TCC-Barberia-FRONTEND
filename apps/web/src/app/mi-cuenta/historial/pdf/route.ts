import { NextResponse } from 'next/server';

import { exigirSesion, generarMiHistorialPdf, MODO_DEMO } from '@barber-shop/api';

/**
 * Opción C del pedido de la profesora: el cliente baja su propio historial
 * en PDF desde su portal, sin que el staff lo genere por él. Mismo esqueleto
 * que `/mi-cuenta/comprobantes/[id]/pdf` -y sin parámetro de id, porque
 * siempre es "mi propio" historial: lo decide la sesión, no la URL-.
 */
export async function GET(): Promise<NextResponse> {
  await exigirSesion();

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no tiene historial real para exportar.',
      { status: 403 },
    );
  }

  try {
    const pdf = await generarMiHistorialPdf();
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="mi-historial.pdf"',
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar el historial.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
