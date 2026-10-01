import { NextResponse } from 'next/server';

import { exigirSesion, generarFichaClientePdf, MODO_DEMO } from '@barber-shop/api';

/**
 * Ficha individual de un cliente en PDF (opción B del pedido de la
 * profesora). Mismo esqueleto que `/panel/facturas/[id]/pdf`: un Route
 * Handler, no una Server Action, porque esta tiene que empujar un binario al
 * navegador.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  await exigirSesion();

  const { id } = await params;
  const idCliente = Number(id);
  if (!Number.isFinite(idCliente)) {
    return new NextResponse('Cliente inválido.', { status: 400 });
  }

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no tiene datos reales de clientes que exportar.',
      { status: 403 },
    );
  }

  try {
    const pdf = await generarFichaClientePdf(idCliente);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="cliente-${idCliente}.pdf"`,
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar la ficha.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
