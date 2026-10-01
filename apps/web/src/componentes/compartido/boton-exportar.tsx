import Link from 'next/link';

import { MODO_DEMO, type TipoReporte } from '@barber-shop/api';
import { Boton } from '@barber-shop/ui';

import { fecha, texto, type Parametros } from '@/lib/filtros';

/**
 * Botones de exportar (Excel y PDF) para cualquier panel con un `TipoReporte`
 * equivalente. Apunta a la misma ruta genérica que ya usa la pantalla de
 * Reportes (`/panel/reportes/exportar`) — no hay lógica de exportación nueva
 * acá, solo el atajo para no tener que ir a Reportes a buscar el tipo
 * correspondiente.
 *
 * Reutiliza `q`/`desde`/`hasta` de los filtros ya aplicados en la propia
 * pantalla, si los tiene (mismos parámetros que `datosReporte()` entiende).
 * Los filtros propios de cada tabla que `datosReporte()` todavía no filtra
 * (por ejemplo "estado" en Clientes) no se pasan: exportar siempre trae el
 * universo que ese tipo de reporte sabe filtrar, no cada control de la
 * pantalla.
 */
export function BotonExportar({
  tipo,
  searchParams,
}: {
  tipo: TipoReporte;
  searchParams?: Parametros;
}) {
  if (MODO_DEMO) {
    return (
      <p className="text-cuerpo-sm text-terciario">
        La exportación no está disponible en modo demostración.
      </p>
    );
  }

  const query = new URLSearchParams();
  query.set('tipo', tipo);
  const desde = searchParams && fecha(searchParams, 'desde');
  const hasta = searchParams && fecha(searchParams, 'hasta');
  const busqueda = searchParams && texto(searchParams, 'q');
  if (desde) query.set('desde', desde);
  if (hasta) query.set('hasta', hasta);
  if (busqueda) query.set('q', busqueda);

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/panel/reportes/exportar?${query.toString()}&formato=excel`}>
        <Boton variante="secundario" icono="download">
          Excel
        </Boton>
      </Link>
      <Link href={`/panel/reportes/exportar?${query.toString()}&formato=pdf`}>
        <Boton variante="secundario" icono="download">
          PDF
        </Boton>
      </Link>
    </div>
  );
}
