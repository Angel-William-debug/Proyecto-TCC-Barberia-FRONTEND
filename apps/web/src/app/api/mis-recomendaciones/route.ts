import { NextResponse, type NextRequest } from 'next/server';

import {
  ErrorAplicacion,
  clienteConToken,
  generarMisRecomendacionesCon,
  misRecomendacionesCon,
} from '@barber-shop/api';

/**
 * Las recomendaciones del cliente, para la app movil (CU-013).
 *
 *   GET  -> las que tiene, con cuantas visitas lleva y el minimo de RN-009.
 *   POST -> las genera; si las que tiene son de las ultimas 24 horas, las
 *           devuelve sin recalcular (`nuevas: false`).
 *
 * La app no tiene las cookies de la web: se identifica con su token de
 * Supabase en `Authorization: Bearer ...`. Con ese token la base aplica las
 * mismas politicas RLS que a la sesion web del mismo cliente. El calculo
 * usa la conexion de sistema, pero solo para el cliente de ese token: ver
 * `generarMisRecomendacionesCon` en `apps/api/src/modulos/portal.ts`.
 *
 * El portal web no pasa por aca: usa la accion de servidor, con la sesion de
 * las cookies y la misma logica.
 */

export const dynamic = 'force-dynamic';

function token(peticion: NextRequest): string | null {
  const cabecera = peticion.headers.get('authorization') ?? '';
  const [tipo, valor] = cabecera.split(' ');
  return tipo?.toLowerCase() === 'bearer' && valor ? valor : null;
}

async function responder(
  peticion: NextRequest,
  hacer: (t: string) => Promise<unknown>,
): Promise<NextResponse> {
  const t = token(peticion);
  if (!t) {
    return NextResponse.json({ error: 'Falta el token de sesión.' }, { status: 401 });
  }

  try {
    return NextResponse.json(await hacer(t));
  } catch (causa) {
    // Un token vencido o falso hace fallar la primera consulta. `traducirError`
    // lo convierte en «La sesion expiro» (PGRST301); un token mal formado
    // puede llegar como error de JWT. Los dos son 401, para que la app pida
    // volver a ingresar.
    const texto = causa instanceof Error ? causa.message : '';
    if (/jwt|token|sesion expiro/i.test(texto)) {
      return NextResponse.json({ error: 'La sesión venció. Ingrese de nuevo.' }, { status: 401 });
    }
    if (causa instanceof ErrorAplicacion) {
      return NextResponse.json({ error: causa.message, regla: causa.regla ?? null }, { status: 422 });
    }
    return NextResponse.json(
      { error: 'No se pudieron obtener las recomendaciones. Intente de nuevo.' },
      { status: 500 },
    );
  }
}

export function GET(peticion: NextRequest) {
  return responder(peticion, (t) => misRecomendacionesCon(clienteConToken(t)));
}

export function POST(peticion: NextRequest) {
  return responder(peticion, (t) => generarMisRecomendacionesCon(clienteConToken(t)));
}
