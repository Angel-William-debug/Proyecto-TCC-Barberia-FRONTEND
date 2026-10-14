/**
 * Envio de correo transaccional via Brevo.
 *
 * Distinto del SMTP de Brevo que ya usa Supabase Auth para sus propios
 * correos (confirmacion de cuenta, codigo de recuperacion): ese canal solo
 * manda las plantillas fijas de Auth. Esto llama a la API HTTP transaccional
 * de Brevo para mandar un correo arbitrario con datos propios de la
 * aplicacion -como un reporte adjunto-, con una API key distinta de las
 * credenciales SMTP.
 *
 * Vive en `compartido` y sin saber nada de reportes a proposito: cualquier
 * modulo que necesite mandar un correo con datos de la app puede reusarlo.
 */

import { entornoPrivado } from '../entorno';
import { ErrorAplicacion } from '../errores';

export interface AdjuntoCorreo {
  nombreArchivo: string;
  contenido: Buffer;
  tipoMime: string;
}

export interface OpcionesCorreo {
  destinatarioEmail: string;
  destinatarioNombre?: string;
  asunto: string;
  textoPlano: string;
  /** Un parrafo por entrada. Si se omite, el correo va solo en texto plano. */
  parrafosHtml?: string[];
  adjuntos?: AdjuntoCorreo[];
}

/** Envoltorio HTML minimo, con estilos en linea para que lo respeten los clientes de correo. */
function plantillaSimple(parrafos: string[]): string {
  const cuerpo = parrafos
    .map((p) => `<p style="margin:0 0 16px;color:#14110f;font-size:15px;line-height:1.5;">${p}</p>`)
    .join('');

  return `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
      <div style="height:6px;background:#855b19;border-radius:4px 4px 0 0;"></div>
      <div style="padding:24px;background:#fbf4e4;border:1px solid #e7e1d7;border-top:none;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 20px;font-size:18px;font-weight:bold;color:#14110f;">
          BARBER<span style="color:#855b19;">SHOP</span>
        </p>
        ${cuerpo}
      </div>
    </div>
  `;
}

/**
 * Manda un correo via la API transaccional de Brevo.
 *
 * Si falta la API key o el remitente, falla con un mensaje distinto al de un
 * rechazo de Brevo -asi se distingue "todavia no se configuro" de "Brevo lo
 * rechazo" al probar esto por primera vez.
 */
export async function enviarCorreo(opciones: OpcionesCorreo): Promise<void> {
  const { claveBrevo, correoRemitente } = entornoPrivado();

  if (!claveBrevo || !correoRemitente) {
    throw new ErrorAplicacion('El envío de correo no está configurado en el servidor.');
  }

  const cuerpo = {
    sender: { name: 'Barber Shop', email: correoRemitente },
    to: [{ email: opciones.destinatarioEmail, name: opciones.destinatarioNombre }],
    subject: opciones.asunto,
    textContent: opciones.textoPlano,
    ...(opciones.parrafosHtml ? { htmlContent: plantillaSimple(opciones.parrafosHtml) } : {}),
    ...(opciones.adjuntos?.length
      ? {
          attachment: opciones.adjuntos.map((a) => ({
            name: a.nombreArchivo,
            content: a.contenido.toString('base64'),
          })),
        }
      : {}),
  };

  let respuesta: Response;
  try {
    respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': claveBrevo,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(cuerpo),
    });
  } catch (causa) {
    throw new ErrorAplicacion(
      'No se pudo enviar el correo. Intente nuevamente en unos instantes.',
      'correo-brevo',
      causa,
    );
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    console.error(`Brevo rechazo el envio (HTTP ${respuesta.status}): ${detalle}`);
    throw new ErrorAplicacion(
      'No se pudo enviar el correo. Intente nuevamente en unos instantes.',
      'correo-brevo',
    );
  }
}
