/**
 * Datos ficticios del portal del cliente.
 *
 * Archivo aparte, como `datos-catalogo.ts` y `datos-operacion.ts`, y por la
 * misma razon: los dos existentes ya son largos y estos no los usa ninguna
 * pantalla del panel.
 *
 * El catalogo -servicios y barberos- se deriva del que ya existe en
 * `datos-catalogo.ts` en vez de escribirse de nuevo. Si el portal mostrara
 * precios distintos de los del panel en la misma demostracion, la captura
 * quedaria en evidencia.
 *
 * Los turnos y las franjas se calculan sobre la fecha de hoy, no sobre una
 * fecha fija: si estuvieran congelados, «Mis turnos» apareceria vacio al dia
 * siguiente y la pantalla de reserva no ofreceria ni un horario.
 */

import type {
  FacturaDelCliente,
  FranjaDisponible,
  PerfilCliente,
  TurnoDelCliente,
  VistaPublicoBarbero,
  VistaPublicoHorario,
  UsuarioSesion,
  VistaPublicoServicio,
} from '@barber-shop/tipos';

import {
  CATEGORIAS_SERVICIO_DEMO,
  PROFESIONALES_DEMO,
  SERVICIOS_DEMO,
} from './datos-catalogo';

// ---------------------------------------------------------------------------
// Catalogo publico
// ---------------------------------------------------------------------------

export const SERVICIOS_PORTAL_DEMO: VistaPublicoServicio[] = SERVICIOS_DEMO.map((s) => ({
  id_servicio: s.id_servicio,
  nombre: s.nombre,
  descripcion: s.descripcion,
  categoria:
    CATEGORIAS_SERVICIO_DEMO.find((c) => c.id_categoria === s.id_categoria)?.nombre ?? 'General',
  duracion_min: s.duracion_min,
  precio_base: s.precio_base,
}));

// `porcentaje_com` no se copia. La vista real tampoco lo expone, y que el
// conjunto ficticio lo arrastrara invitaria a mostrarlo en una pantalla.
export const BARBEROS_PORTAL_DEMO: VistaPublicoBarbero[] = PROFESIONALES_DEMO.map((p) => ({
  id_profesional: p.id_profesional,
  nombre: p.nombre,
  especialidad: p.especialidad,
}));

/** Lunes a sabado. Domingo cerrado, como la mayoria de las barberias. */
export const HORARIOS_PORTAL_DEMO: VistaPublicoHorario[] = [
  { dia_semana: 0, hora_apertura: '00:00:00', hora_cierre: '00:00:00', activo: false },
  { dia_semana: 1, hora_apertura: '09:00:00', hora_cierre: '19:00:00', activo: true },
  { dia_semana: 2, hora_apertura: '09:00:00', hora_cierre: '19:00:00', activo: true },
  { dia_semana: 3, hora_apertura: '09:00:00', hora_cierre: '19:00:00', activo: true },
  { dia_semana: 4, hora_apertura: '09:00:00', hora_cierre: '19:00:00', activo: true },
  { dia_semana: 5, hora_apertura: '09:00:00', hora_cierre: '20:00:00', activo: true },
  { dia_semana: 6, hora_apertura: '08:00:00', hora_cierre: '18:00:00', activo: true },
];

// ---------------------------------------------------------------------------
// La persona que esta usando el portal
// ---------------------------------------------------------------------------

export const PERFIL_PORTAL_DEMO: PerfilCliente = {
  idCliente: 1,
  nombre: 'Rodrigo Benítez',
  email: 'rodrigo.benitez@correo.com.py',
  telefono: '0981 234 567',
  direccion: 'Av. Mariscal López 1234, San Lorenzo',
  fechaNacimiento: '1994-03-18',
  fechaRegistro: '2026-02-14T10:30:00-03:00',
};

// ---------------------------------------------------------------------------
// Franjas de reserva
// ---------------------------------------------------------------------------

/** aaaa-MM-dd de una fecha, en hora local. */
function iso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function conHora(dia: string, hora: number, minuto: number): Date {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a!, m! - 1, d!, hora, minuto, 0, 0);
}

/**
 * Franjas libres ficticias, con la misma forma que devuelve
 * `fn_turnos_disponibles`.
 *
 * Se ocupan a proposito algunas horas -las de mas demanda- para que la
 * pantalla muestre los dos casos: franjas con los tres barberos libres y
 * franjas con uno solo. Una grilla donde todo esta disponible no demuestra
 * nada.
 */
export function franjasDemo(
  fecha: string,
  duracionMin: number,
  idProfesional?: number,
): FranjaDisponible[] {
  const horario = HORARIOS_PORTAL_DEMO[conHora(fecha, 12, 0).getDay()];
  if (!horario?.activo) return [];

  const barberos = BARBEROS_PORTAL_DEMO.filter(
    (b) => idProfesional == null || b.id_profesional === idProfesional,
  ).map((b) => b.id_profesional);

  const apertura = Number(horario.hora_apertura.slice(0, 2));
  const cierre = Number(horario.hora_cierre.slice(0, 2));

  const franjas: FranjaDisponible[] = [];

  for (let minutos = apertura * 60; minutos + duracionMin <= cierre * 60; minutos += 15) {
    const inicio = conHora(fecha, Math.floor(minutos / 60), minutos % 60);
    if (inicio.getTime() <= Date.now()) continue;

    // Entre las 17 y las 19 queda un solo barbero; al mediodia, dos.
    const hora = inicio.getHours();
    const ocupados = hora >= 17 ? barberos.length - 1 : hora === 12 ? 1 : 0;
    const libres = barberos.slice(ocupados);

    if (!libres.length) continue;

    franjas.push({
      inicio: inicio.toISOString(),
      hora_local: `${String(hora).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}:00`,
      barberos_disponibles: libres.length,
      ids_barberos: libres,
    });
  }

  return franjas;
}

// ---------------------------------------------------------------------------
// Turnos del cliente
// ---------------------------------------------------------------------------

function turno(
  idCita: number,
  desplazamientoDias: number,
  hora: number,
  estado: TurnoDelCliente['estado'],
  idsServicio: number[],
  idProfesional: number,
): TurnoDelCliente {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + desplazamientoDias);
  const inicio = conHora(iso(fecha), hora, 0);

  const barbero =
    BARBEROS_PORTAL_DEMO.find((b) => b.id_profesional === idProfesional)?.nombre ?? 'Barbero';

  const servicios = idsServicio.map((id) => {
    const s = SERVICIOS_DEMO.find((x) => x.id_servicio === id)!;
    return {
      idServicio: s.id_servicio,
      nombre: s.nombre,
      barbero,
      duracionMin: s.duracion_min,
      precio: s.precio_base,
    };
  });

  const duracionTotalMin = servicios.reduce((suma, s) => suma + s.duracionMin, 0);

  return {
    idCita,
    reservadoEn: new Date(inicio.getTime() - 3 * 86_400_000).toISOString(),
    fechaHora: inicio.toISOString(),
    fechaHoraFin: new Date(inicio.getTime() + duracionTotalMin * 60_000).toISOString(),
    estado,
    duracionTotalMin,
    total: servicios.reduce((suma, s) => suma + s.precio, 0),
    observaciones: null,
    servicios,
    cancelable:
      (estado === 'pendiente' || estado === 'confirmado') && inicio.getTime() > Date.now(),
  };
}

export function turnosPortalDemo(): {
  proximos: TurnoDelCliente[];
  pasados: TurnoDelCliente[];
} {
  return {
    proximos: [
      turno(1041, 2, 10, 'confirmado', [1, 3], 1),
      turno(1046, 9, 16, 'pendiente', [1], 2),
    ],
    pasados: [
      turno(1012, -12, 11, 'completado', [1, 3], 1),
      turno(1004, -33, 15, 'completado', [2], 2),
      turno(998, -47, 9, 'no_asistio', [1], 3),
      turno(981, -68, 17, 'completado', [5], 1),
    ],
  };
}

// ---------------------------------------------------------------------------
// Facturas
//
// Una por cada turno completado del historial: en el sistema real la factura
// se emite desde un cobro pagado (CU-025), asi que no puede haber una factura
// de un turno al que el cliente no asistio.
// ---------------------------------------------------------------------------

const FACTURAS_BASE: FacturaDelCliente[] = [
  { idFactura: 312, idCita: 1012, fechaEmision: '', total: 95000, estado: 'emitida' },
  { idFactura: 287, idCita: 1004, fechaEmision: '', total: 60000, estado: 'emitida' },
  { idFactura: 251, idCita: 981, fechaEmision: '', total: 85000, estado: 'emitida' },
];

export const FACTURAS_PORTAL_DEMO: FacturaDelCliente[] = FACTURAS_BASE.map((f, i) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - [12, 33, 68][i]!);
  return { ...f, fechaEmision: fecha.toISOString() };
});

// ---------------------------------------------------------------------------
// La sesion del portal en modo demostracion
//
// `USUARIO_DEMO` es un administrador, porque el modo se hizo para recorrer el
// panel. Con esa sesion el portal quedaria inalcanzable: su layout manda al
// panel a cualquiera que no sea cliente, que es justo lo que hay que hacer con
// una sesion real de recepcionista.
//
// Por eso el portal tiene su propia sesion ficticia. No es una excepcion a la
// regla de separacion: es la misma regla aplicada al conjunto de datos, que
// necesita una persona de cada lado del sistema.
// ---------------------------------------------------------------------------

export const SESION_CLIENTE_DEMO: UsuarioSesion = {
  idUsuario: 101,
  authUid: '00000000-0000-0000-0000-000000000101',
  nombre: PERFIL_PORTAL_DEMO.nombre,
  email: PERFIL_PORTAL_DEMO.email ?? 'cliente@correo.com.py',
  rol: 'cliente',
  idProfesional: null,
};
