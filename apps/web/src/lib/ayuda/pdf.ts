import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

import { generarPdfManual, usuarioActual } from '@barber-shop/api';

import { etiquetaRol, rolDelManual } from '.';
import { armarDatosManual } from './manual';

/**
 * La captura de un artículo, en bytes. Primero del disco (`public/` viaja con
 * la función gracias a `outputFileTracingIncludes`) y, si no está, por HTTP
 * al mismo sitio. Sin captura el artículo sale igual.
 */
async function leerCaptura(archivo: string, origen: string): Promise<Uint8Array | undefined> {
  const candidatos = [
    join(process.cwd(), 'public', 'ayuda', 'capturas', archivo),
    join(process.cwd(), 'apps', 'web', 'public', 'ayuda', 'capturas', archivo),
  ];
  for (const ruta of candidatos) {
    try {
      return new Uint8Array(await readFile(ruta));
    } catch {
      // siguiente candidato
    }
  }
  try {
    const r = await fetch(`${origen}/ayuda/capturas/${archivo}`);
    if (r.ok) return new Uint8Array(await r.arrayBuffer());
  } catch {
    // sin red: el artículo sale sin captura
  }
  return undefined;
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

  const capturas = new Map<string, Promise<Uint8Array | undefined>>();
  const pdf = await generarPdfManual(
    await armarDatosManual(rol, (archivo) => {
      if (!capturas.has(archivo)) capturas.set(archivo, leerCaptura(archivo, url.origin));
      return capturas.get(archivo)!;
    }),
  );

  const nombre = `manual-barber-shop-${etiquetaRol(rol).toLowerCase()}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombre}"`,
      // El contenido cambia solo con un despliegue; una hora de caché
      // privada evita regenerarlo si alguien lo abre dos veces seguidas.
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
