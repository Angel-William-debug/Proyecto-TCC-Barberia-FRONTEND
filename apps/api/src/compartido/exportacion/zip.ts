import JSZip from 'jszip';

/**
 * Empaqueta varios PDFs individuales en un solo `.zip` (opción A del pedido
 * de la profesora: un documento por persona, no una tabla con todos). Un
 * botón no puede disparar N descargas simultáneas -el navegador las bloquea-,
 * así que se bajan juntas en un solo archivo.
 */
export async function generarZip(
  archivos: Array<{ nombre: string; contenido: Buffer }>,
): Promise<Buffer> {
  const zip = new JSZip();
  for (const archivo of archivos) {
    zip.file(archivo.nombre, archivo.contenido);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

/** Nombre de archivo seguro a partir de un nombre de persona: sin acentos, sin espacios. */
export function nombreArchivoSeguro(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'sin-nombre'
  );
}
