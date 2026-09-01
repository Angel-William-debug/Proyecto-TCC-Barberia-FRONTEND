import Link from 'next/link';

import { misFacturas, misTurnos } from '@barber-shop/api';
import {
  ChipEstado,
  EstadoVacio,
  Icono,
  PRESENTACION_CITA,
  fechaCorta,
  guaranies,
  hora,
} from '@barber-shop/ui';

export const metadata = {
  title: 'Historial',
};

/**
 * Lo que ya paso: turnos anteriores y comprobantes.
 *
 * Las dos listas van juntas en una pantalla y no en dos, porque son la misma
 * pregunta hecha de dos maneras -«cuando vine» y «cuanto pague»- y separarlas
 * obligaria a saltar entre secciones para responder cualquiera de las dos.
 *
 * LOS TURNOS SE MUESTRAN MAS COMPACTOS QUE EN «MIS TURNOS»
 *
 * Un turno que viene se lee entero: hora, barbero, duracion, precio. Uno que
 * ya paso se hojea. Por eso aca cada uno entra en una fila y alla ocupa una
 * tarjeta.
 */
export default async function Historial() {
  const [{ pasados }, facturas] = await Promise.all([misTurnos(), misFacturas()]);

  return (
    <div className="mt-2 flex flex-col gap-10">
      <section>
        <h1 className="font-display text-principal text-display-sm font-semibold">Historial</h1>
        <p className="text-cuerpo text-secundario medida-lectura mt-2">
          Los turnos por los que ya pasó, con el servicio y el barbero que lo atendió.
        </p>

        {pasados.length === 0 ? (
          <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
            <EstadoVacio
              icono="clipboard-list"
              titulo="Todavía no hay visitas registradas"
              descripcion="Cuando pase por la barbería, sus visitas aparecen acá."
            />
          </div>
        ) : (
          <ul className="border-borde-sutil bg-superficie mt-6 divide-y divide-[var(--borde-sutil)] overflow-hidden rounded-lg border">
            {pasados.map((t) => (
              <li key={t.idCita} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-[7rem]">
                  <p className="text-cuerpo text-principal font-medium tabular-nums">
                    {fechaCorta(t.fechaHora)}
                  </p>
                  <p className="text-cuerpo-sm text-terciario tabular-nums">
                    {hora(t.fechaHora)}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-cuerpo text-principal">
                    {t.servicios.map((s) => s.nombre).join(', ') || 'Sin servicios cargados'}
                  </p>
                  {t.servicios[0] && (
                    <p className="text-cuerpo-sm text-terciario mt-0.5 flex items-center gap-1.5">
                      <Icono nombre="scissors" tamano="xs" />
                      {t.servicios[0].barbero}
                    </p>
                  )}
                </div>

                <ChipEstado presentacion={PRESENTACION_CITA[t.estado]} />

                <p className="text-cuerpo text-principal w-24 text-right font-medium tabular-nums">
                  {guaranies(t.total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------------- facturas */}
      <section>
        <h2 className="font-display text-principal text-titulo-1 font-semibold">
          Mis comprobantes
        </h2>
        <p className="text-cuerpo-sm text-terciario medida-lectura mt-2">
          Comprobante interno de la barbería. No reemplaza a una factura legal.
        </p>

        {facturas.length === 0 ? (
          <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
            <EstadoVacio
              icono="file-text"
              titulo="Todavía no hay comprobantes"
              descripcion="Se emiten desde la barbería cuando se cobra un turno."
            />
          </div>
        ) : (
          <ul className="border-borde-sutil bg-superficie mt-6 divide-y divide-[var(--borde-sutil)] overflow-hidden rounded-lg border">
            {facturas.map((f) => (
              <li key={f.idFactura} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-cuerpo text-principal font-medium">
                    Comprobante N.º {f.idFactura}
                  </p>
                  <p className="text-cuerpo-sm text-terciario tabular-nums">
                    {fechaCorta(f.fechaEmision)}
                  </p>
                </div>

                <p className="text-cuerpo text-principal font-medium tabular-nums">
                  {guaranies(f.total)}
                </p>

                <Link
                  href={`/mi-cuenta/comprobantes/${f.idFactura}/pdf`}
                  className="text-cuerpo-sm text-marca hover:text-marca-hover inline-flex items-center gap-1.5 font-medium"
                >
                  <Icono nombre="file-text" tamano="xs" />
                  Descargar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
