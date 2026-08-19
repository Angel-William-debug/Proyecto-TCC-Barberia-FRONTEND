import { NextResponse } from 'next/server';

import {
  exigirSesion,
  exportarReporteExcel,
  exportarReportePdf,
  TIPOS_REPORTE,
  type TipoReporte,
} from '@barber-shop/api';

const CONTENT_TYPE_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function esTipoReporte(valor: string | null): valor is TipoReporte {
  return valor !== null && (TIPOS_REPORTE as readonly string[]).includes(valor);
}

/**
 * Descarga de un reporte (CU-014) en Excel o PDF.
 *
 * Una Server Action no puede empujar un archivo binario al navegador: por eso
 * el botón "Exportar" de `/panel/reportes` apunta acá con los filtros como
 * query string, en lugar de llamar a una acción.
 */
export async function GET(request: Request): Promise<NextResponse> {
  await exigirSesion();

  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo');
  const formato = url.searchParams.get('formato');

  if (!esTipoReporte(tipo)) {
    return new NextResponse('Tipo de reporte inválido.', { status: 400 });
  }

  const filtro = {
    desde: url.searchParams.get('desde') ?? undefined,
    hasta: url.searchParams.get('hasta') ?? undefined,
    busqueda: url.searchParams.get('q') ?? undefined,
  };

  try {
    if (formato === 'excel') {
      const buffer = await exportarReporteExcel(tipo, filtro);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': CONTENT_TYPE_EXCEL,
          'Content-Disposition': `attachment; filename="${tipo}.xlsx"`,
        },
      });
    }

    const buffer = await exportarReportePdf(tipo, filtro);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${tipo}.pdf"`,
      },
    });
  } catch (causa) {
    const mensaje = causa instanceof Error ? causa.message : 'No se pudo generar el reporte.';
    return new NextResponse(mensaje, { status: 500 });
  }
}
