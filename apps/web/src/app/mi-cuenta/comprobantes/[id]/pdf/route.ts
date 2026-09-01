import { NextResponse } from 'next/server';

import { exigirSesion, generarFacturaPdf, MODO_DEMO } from '@barber-shop/api';

/**
 * Descarga del comprobante desde el portal (CU-025, anexo).
 *
 * Es una ruta y no una accion de servidor por la misma razon que su gemela del
 * panel: ninguna Server Action puede empujar un archivo binario al navegador.
 *
 * POR QUE EXISTE SI YA ESTA `/panel/facturas/[id]/pdf`
 *
 * Porque el cliente no tiene por que navegar a una URL que empieza con
 * `/panel`. Un manejador de ruta no pasa por el `layout.tsx` de su segmento,
 * asi que aquella funcionaria -y por eso la tentacion de reusarla-, pero
 * dejaria al portal enlazando a la zona del mostrador. La independencia entre
 * las dos mitades tambien se ve en las direcciones.
 *
 * Lo que NO se duplica es la logica: las dos rutas llaman a la misma
 * `generarFacturaPdf()`, y quien puede ver que factura lo sigue decidiendo la
 * politica `cliente_ve_sus_facturas`. Pedir el numero de otra persona devuelve
 * 404, no el comprobante ajeno.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  await exigirSesion();

  const { id } = await params;
  const idFactura = Number(id);
  if (!Number.isFinite(idFactura)) {
    return new NextResponse('Comprobante inválido.', { status: 400 });
  }

  if (MODO_DEMO) {
    return new NextResponse(
      'El modo demostración no tiene comprobantes reales que descargar.',
      { status: 403 },
    );
  }

  try {
    const pdf = await generarFacturaPdf(idFactura);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="comprobante-${idFactura}.pdf"`,
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar el comprobante.';
    return new NextResponse(mensaje, { status: 404 });
  }
}
