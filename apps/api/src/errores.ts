/**
 * Traduccion de errores de PostgreSQL a mensajes que un recepcionista pueda
 * entender.
 *
 * La base hace cumplir 38 restricciones CHECK, 37 claves foraneas, 12 indices
 * unicos y 19 disparadores. Cuando alguno se dispara, PostgREST devuelve algo
 * como:
 *
 *     'new row for relation "citas" violates check constraint "citas_estado_check"'
 *
 * Mostrar ese texto al usuario seria inaceptable. Peor todavia seria mostrar
 * «Error inesperado», que oculta una regla de negocio perfectamente conocida.
 */

import type { PostgrestError } from '@supabase/supabase-js';

export class ErrorAplicacion extends Error {
  constructor(
    message: string,
    /** Regla de negocio o caso de uso que lo origina, cuando se conoce. */
    readonly regla?: string,
    readonly causa?: unknown,
  ) {
    super(message);
    this.name = 'ErrorAplicacion';
  }
}

/**
 * Reglas cuyo incumplimiento la base rechaza con una excepcion explicita.
 * El texto de la izquierda es el que aparece en el mensaje de PostgreSQL.
 */
const REGLAS_DE_NEGOCIO: Array<{ patron: RegExp; mensaje: string; regla: string }> = [
  {
    patron: /RN-009/,
    mensaje: 'El cliente necesita al menos 3 servicios en su historial para generar recomendaciones.',
    regla: 'RN-009',
  },
  {
    patron: /RN-018b/,
    mensaje: 'No se puede completar un turno de un día que todavía no llegó.',
    regla: 'RN-018b',
  },
  {
    patron: /RN-008b/,
    mensaje: 'La fecha de nacimiento no puede ser futura.',
    regla: 'RN-008b',
  },
  {
    patron: /RN-018/,
    mensaje: 'Esta cita ya está completada o cancelada y no puede modificarse.',
    regla: 'RN-018',
  },
  {
    patron: /RN-024/,
    mensaje: 'Solo se puede registrar un cobro sobre una cita completada.',
    regla: 'RN-024',
  },
  {
    patron: /RN-025/,
    mensaje: 'El monto supera el saldo pendiente de esa cita.',
    regla: 'RN-025',
  },
  {
    patron: /RN-027/,
    mensaje: 'Una comisión liquidada no puede modificarse ni revertirse.',
    regla: 'RN-027',
  },
  {
    patron: /RN-028/,
    mensaje: 'Solo se puede pagar una orden de compra que ya fue recibida.',
    regla: 'RN-028',
  },
  {
    patron: /CU-018 A1/,
    mensaje: 'El monto supera el saldo pendiente de esa orden.',
    regla: 'CU-018 A1',
  },
  {
    patron: /RN-031/,
    mensaje: 'El stock disponible no alcanza. Confirme la excepción para continuar.',
    regla: 'RN-031',
  },
  {
    patron: /RN-015/,
    mensaje: 'El barbero ya tiene otro turno en ese horario.',
    regla: 'RN-015',
  },
  {
    patron: /CU-020: la barberia no atiende/,
    mensaje: 'La barbería no atiende ese día.',
    regla: 'CU-020',
  },
  {
    patron: /CU-020/,
    mensaje: 'Ese horario queda fuera del horario de atención de la barbería.',
    regla: 'CU-020',
  },
  {
    patron: /No se puede mover un turno al pasado/,
    mensaje: 'No se puede mover un turno a un momento que ya pasó.',
    regla: 'CU-006',
  },
  {
    patron: /No se puede agendar una cita en el pasado/,
    mensaje: 'No se puede agendar un turno en un momento que ya pasó.',
    regla: 'CU-005',
  },
  {
    patron: /MOV-001/,
    mensaje: 'Indique el motivo del movimiento.',
    regla: 'MOV-001',
  },
  {
    patron: /MOV-002/,
    mensaje: 'La cantidad debe ser mayor a cero.',
    regla: 'MOV-002',
  },
  {
    patron: /MOV-003/,
    mensaje: 'El conteo coincide con el stock del sistema: no hay nada que ajustar.',
    regla: 'MOV-003',
  },
];

/** Restricciones cuyo nombre identifica el problema con precision. */
const RESTRICCIONES: Record<string, string> = {
  citas_estado_check: 'El estado indicado para la cita no es válido.',
  cobros_cliente_estado_check: 'El estado indicado para el cobro no es válido.',
  pagos_profesional_estado_check: 'El estado indicado para la comisión no es válido.',
  pedidos_estado_check: 'El estado indicado para el pedido no es válido.',
  usuarios_email_key: 'Ya existe un usuario con ese correo electrónico.',
  clientes_email_key: 'Ya existe un cliente con ese correo electrónico.',

  // Indices unicos parciales del borrado logico. Chocan en dos situaciones:
  // al dar de alta con un valor que ya usa un registro vigente, y al RESTAURAR
  // un registro borrado cuyo valor fue tomado mientras tanto. El segundo caso
  // desconcierta si el mensaje no lo nombra: el registro que estorba estuvo
  // invisible todo el tiempo.
  clientes_email_vigente:
    'Ese correo ya pertenece a otro cliente. Si está restaurando un cliente '
    + 'borrado, primero cambie el correo del que lo está ocupando.',
  usuarios_email_vigente:
    'Ese correo ya pertenece a otro usuario. Si está restaurando un usuario '
    + 'borrado, primero cambie el correo del que lo está ocupando.',
  servicios_categoria_nombre_vigente:
    'Ya existe un servicio con ese nombre en la misma categoría.',
  categorias_servicio_nombre_vigente: 'Ya existe una categoría de servicio con ese nombre.',
  categorias_producto_nombre_vigente: 'Ya existe una categoría de producto con ese nombre.',
  metodos_pago_nombre_vigente: 'Ya existe un método de pago con ese nombre.',
  servicio_producto_vigente: 'Ese producto ya está en la receta de este servicio.',
  horarios_atencion_dia_vigente: 'Ya existe un horario definido para ese día.',
  usuarios_email_formato_check: 'El correo electrónico no tiene un formato válido.',
  clientes_email_formato_check: 'El correo electrónico no tiene un formato válido.',
  proveedores_email_formato_check: 'El correo electrónico no tiene un formato válido.',
  servicios_categoria_nombre_key: 'Ya existe un servicio con ese nombre en la misma categoría.',
  profesionales_porcentaje_com_check: 'El porcentaje de comisión debe estar entre 0 y 100.',
  servicios_duracion_min_check: 'La duración debe ser mayor a cero.',
  servicios_precio_base_check: 'El precio no puede ser negativo.',
  productos_stock_min_max_check: 'El stock máximo debe ser mayor o igual al mínimo.',
  pagos_profesional_id_historial_key:
    'Ese servicio ya tiene su comisión registrada. No se puede liquidar dos veces.',
  horarios_atencion_dia_semana_key: 'Ya existe un horario definido para ese día.',
  horarios_atencion_check: 'La hora de cierre debe ser posterior a la de apertura.',
};

/** Codigos de PostgreSQL que llegan sin un nombre de restriccion util. */
const CODIGOS: Record<string, string> = {
  '23503': 'El registro está vinculado a otros datos y no se puede completar la operación.',
  '23505': 'Ya existe un registro con esos datos.',
  '23514': 'Los datos no cumplen una validación de la base.',
  '42501': 'No tiene permisos para realizar esta operación.',
  PGRST116: 'No se encontró el registro solicitado.',
  PGRST301: 'La sesión expiró. Vuelva a iniciar sesión.',
};

export function traducirError(error: PostgrestError | Error | null): ErrorAplicacion {
  if (!error) return new ErrorAplicacion('Ocurrió un error desconocido.');

  const mensaje = error.message ?? '';

  for (const { patron, mensaje: texto, regla } of REGLAS_DE_NEGOCIO) {
    if (patron.test(mensaje)) return new ErrorAplicacion(texto, regla, error);
  }

  for (const [nombre, texto] of Object.entries(RESTRICCIONES)) {
    if (mensaje.includes(nombre)) return new ErrorAplicacion(texto, nombre, error);
  }

  const codigo = (error as PostgrestError).code;
  const porCodigo = codigo ? CODIGOS[codigo] : undefined;
  if (codigo && porCodigo) {
    return new ErrorAplicacion(porCodigo, codigo, error);
  }

  // Ultimo recurso. Se conserva la causa para el registro del servidor, pero
  // no se muestra al usuario.
  return new ErrorAplicacion(
    'No se pudo completar la operación. Intente nuevamente en unos instantes.',
    undefined,
    error,
  );
}

/** Envuelve una consulta de Supabase y convierte el error si lo hay. */
export async function ejecutar<T>(
  consulta: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw traducirError(error);
  if (data === null) {
    throw new ErrorAplicacion('La consulta no devolvió datos.');
  }
  return data;
}
