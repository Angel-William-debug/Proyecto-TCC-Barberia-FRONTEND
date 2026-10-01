import { NextResponse, type NextRequest } from 'next/server';

import { accionRegistrarCliente } from '@/acciones/portal';

/**
 * Alta de cuenta de cliente desde la app movil (CU-001).
 *
 * Crear la cuenta necesita la clave de servicio -crea la credencial, el
 * usuario con rol cliente y su ficha, las tres enlazadas-, y esa clave no
 * puede viajar dentro de la app. Por eso la app no llama a Supabase directo
 * para esto sino a esta ruta.
 *
 * No duplica nada: arma el mismo `FormData` que el formulario web y llama a
 * la misma accion, con las mismas validaciones y los mismos mensajes. Es tan
 * publica como ese formulario.
 *
 * Responde `ResultadoAccion` en JSON: `{ ok: true }`, o `{ ok: false, error,
 * campos? }` con el mensaje de cada campo invalido, que la app muestra debajo
 * del campo como hace la web.
 */

export const dynamic = 'force-dynamic';

export async function POST(peticion: NextRequest) {
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await peticion.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'La solicitud no es válida.' }, { status: 400 });
  }

  const datos = new FormData();
  for (const clave of ['nombre', 'email', 'telefono', 'password', 'repetir']) {
    datos.set(clave, typeof cuerpo[clave] === 'string' ? (cuerpo[clave] as string) : '');
  }

  const resultado = await accionRegistrarCliente(datos);
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 422 });
}
