import { NextResponse } from 'next/server';

import { exigirSesion, generarFichaComisionBarberoPdf, MODO_DEMO } from '@barber-shop/api';

/**
 * Ficha de liquidación de UN barbero en PDF, por fila (igual que
 * `/panel/facturas/[id]/pdf`) — antes esto solo existía empaquetado en el
 * `.zip` de la opción en lote.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  await exigirSesion();

  const { id } = await params;
  const idProfesional = Number(id);
  if (!Number.isFinite(idProfesional)) {
    return new NextResponse('Barbero inválido.', { status: 400 });
  }

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no tiene comisiones reales que exportar.',
      { status: 403 },
    );
  }

  try {
    const pdf = await generarFichaComisionBarberoPdf(idProfesional);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="comision-${idProfesional}.pdf"`,
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar la ficha.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
