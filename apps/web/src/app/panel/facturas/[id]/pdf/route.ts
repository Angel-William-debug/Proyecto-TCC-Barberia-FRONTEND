import { NextResponse } from 'next/server';

import { exigirSesion, generarFacturaPdf, MODO_DEMO } from '@barber-shop/api';

/** Descarga del PDF de una factura (CU-025, anexo). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  await exigirSesion();

  const { id } = await params;
  const idFactura = Number(id);
  if (!Number.isFinite(idFactura)) {
    return new NextResponse('Factura inválida.', { status: 400 });
  }

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no tiene facturas reales que descargar.',
      { status: 403 },
    );
  }

  try {
    const pdf = await generarFacturaPdf(idFactura);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-${idFactura}.pdf"`,
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar el comprobante.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
