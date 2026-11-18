import type { DatosManual, SeccionManual, SegmentoManual } from '@barber-shop/api';
import type { NombreRol } from '@barber-shop/tipos';

import { bloquesDe, etiquetaRol, seccionesPara } from '.';
import type { Segmento } from './markdown';

export const PRESENTACION_MANUAL: Record<NombreRol, string> = {
  administrador:
    'Este manual explica, tarea por tarea, cómo se usa Barber Shop con la cuenta de administrador: la operación diaria del mostrador, los catálogos, las compras, las comisiones, los informes, la configuración y las cuentas del personal.',
  recepcionista:
    'Este manual explica, tarea por tarea, cómo se usa Barber Shop desde el mostrador: la agenda, los cobros y comprobantes, los clientes, el inventario y los avisos a los clientes.',
  profesional:
    'Este manual explica cómo usa Barber Shop un barbero: su día, la agenda del equipo, sus comisiones y el ranking.',
  cliente:
    'Este manual explica cómo reservar y administrar sus turnos en Barber Shop, desde la página web o desde la app del teléfono.',
};

/** En papel no hay enlaces: la referencia queda como el título del artículo, destacado. */
function aPapel(segmentos: Segmento[]): SegmentoManual[] {
  return segmentos.map((s) => ({ texto: s.texto, negrita: s.negrita, enlace: Boolean(s.enlace) }));
}

/**
 * El manual de un rol, listo para `generarPdfManual`.
 *
 * No depende de Next ni de la sesión: lo usan la ruta del PDF y
 * `scripts/generar-manuales.ts`, que arma los cuatro PDF de una vez. Cada uno
 * le pasa su forma de conseguir las capturas.
 */
export async function armarDatosManual(
  rol: NombreRol,
  leerCaptura: (archivo: string) => Promise<Uint8Array | undefined>,
): Promise<DatosManual> {
  const secciones: SeccionManual[] = await Promise.all(
    seccionesPara(rol).map(async ({ categoria, articulos }) => ({
      titulo: categoria.titulo,
      descripcion: categoria.descripcion,
      articulos: await Promise.all(
        articulos.map(async (a) => ({
          titulo: a.titulo,
          resumen: a.resumen,
          bloques: bloquesDe(a, rol).map((b) => {
            switch (b.tipo) {
              case 'subtitulo':
                return b;
              case 'parrafo':
                return { tipo: 'parrafo' as const, segmentos: aPapel(b.segmentos) };
              case 'nota':
                return { tipo: 'nota' as const, advertencia: b.advertencia, segmentos: aPapel(b.segmentos) };
              case 'pasos':
              case 'lista':
                return { tipo: b.tipo, items: b.items.map(aPapel) };
            }
          }),
          imagen: a.captura ? await leerCaptura(a.captura.archivo) : undefined,
          descripcionImagen: a.captura?.descripcion,
        })),
      ),
    })),
  );

  const fecha = new Intl.DateTimeFormat('es-PY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Asuncion',
  }).format(new Date());

  return {
    titulo: 'Manual de usuario',
    subtitulo: etiquetaRol(rol),
    presentacion: `${PRESENTACION_MANUAL[rol]} El mismo contenido está en el centro de ayuda del sistema, con un buscador.`,
    fecha,
    secciones,
  };
}
