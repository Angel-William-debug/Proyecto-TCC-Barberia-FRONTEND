import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { generarPdfManual, usuarioActual } from '@barber-shop/api';
import type { NombreRol } from '@barber-shop/tipos';

import { etiquetaRol, rolDelManual } from '.';
import { armarDatosManual } from './manual';

/**
 * Un archivo de `public/ayuda/` (captura o logo), en bytes. Primero del disco
 * (`public/ayuda` viaja con la función gracias a `outputFileTracingIncludes`)
 * y, si no está, por HTTP al mismo sitio. Sin la imagen el manual sale igual.
 */
async function leerPublico(ruta: string, origen: string): Promise<Uint8Array | undefined> {
  const candidatos = [
    join(process.cwd(), 'public', 'ayuda', ruta),
    join(process.cwd(), 'apps', 'web', 'public', 'ayuda', ruta),
  ];
  for (const archivo of candidatos) {
    try {
      return new Uint8Array(await readFile(archivo));
    } catch {
      // siguiente candidato
    }
  }
  try {
    const r = await fetch(`${origen}/ayuda/${ruta}`);
    if (r.ok) return new Uint8Array(await r.arrayBuffer());
  } catch {
    // sin red: el manual sale sin esa imagen
  }
  return undefined;
}

async function pdfDelRol(rol: NombreRol, origen: string): Promise<Buffer> {
  const leidos = new Map<string, Promise<Uint8Array | undefined>>();
  const pdf = await generarPdfManual(
    await armarDatosManual(rol, (ruta) => {
      if (!leidos.has(ruta)) leidos.set(ruta, leerPublico(ruta, origen));
      return leidos.get(ruta)!;
    }),
  );
  return pdf;
}

function nombreArchivo(rol: NombreRol): string {
  return `manual-barber-shop-${etiquetaRol(rol).toLowerCase()}.pdf`;
}

/**
 * La respuesta de `GET …/ayuda/pdf`: el manual del rol de la sesión (o el
 * que pida el administrador con `?rol=`), con el mismo contenido que el
 * centro de ayuda. La comparten el panel y el portal.
 */
export async function responderManualPdf(peticion: Request): Promise<NextResponse> {
  const usuario = await usuarioActual();
  if (!usuario) return new NextResponse('Ingrese al sistema para descargar el manual.', { status: 401 });

  const url = new URL(peticion.url);
  const rol = rolDelManual(usuario.rol, url.searchParams.get('rol'));

  return new NextResponse(new Uint8Array(await pdfDelRol(rol, url.origin)), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombreArchivo(rol)}"`,
      // El contenido cambia solo con un despliegue; una hora de caché
      // privada evita regenerarlo si alguien lo abre dos veces seguidas.
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

/**
 * El manual del cliente, SIN sesión: lo abre la app desde su ayuda. La app
 * no tiene las cookies de la web, y el manual del cliente no tiene nada que
 * no esté ya en `/api/ayuda/cliente`, que también es pública. Los manuales
 * del personal siguen pidiendo sesión.
 */
export async function responderManualClientePdf(peticion: Request): Promise<NextResponse> {
  const url = new URL(peticion.url);
  return new NextResponse(new Uint8Array(await pdfDelRol('cliente', url.origin)), {
    headers: {
      'Content-Type': 'application/pdf',
      // `attachment`: en el teléfono el navegador lo guarda en Descargas en
      // vez de intentar mostrarlo, que en Android no siempre puede.
      'Content-Disposition': `attachment; filename="${nombreArchivo('cliente')}"`,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
