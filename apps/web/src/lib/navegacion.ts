import { MODULOS_POR_ROL, type Modulo, type NombreRol } from '@barber-shop/tipos';
import type { NombreIcono } from '@barber-shop/ui';

/**
 * Estructura de la barra lateral (seccion 6.5 del sistema de diseno).
 *
 * El orden refleja el flujo de trabajo de una jornada: primero lo que se usa
 * con el cliente enfrente, despues lo administrativo. No es alfabetico a
 * proposito.
 *
 * LAS ENTRADAS VAN AGRUPADAS
 *
 * Catorce entradas seguidas se leen como una lista, no como un sistema: hay
 * que recorrerlas para encontrar cualquier cosa. Los cinco grupos responden a
 * la pregunta con la que uno llega -"vengo a atender", "vengo a mantener los
 * datos", "vengo a mirar como va el negocio"- en vez de obligar a saber de
 * antemano en que pantalla vive cada dato.
 *
 * El grupo «Datos generales» es ademas un pedido explicito de la Direccion:
 * agrupar en un solo apartado la administracion de las entidades base
 * -clientes, servicios, productos y metodos de pago-. Su primera entrada es
 * la pantalla resumen, que las reune todas con su cantidad de registros.
 */
export interface EntradaMenu {
  modulo: Modulo;
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  grupo: NombreGrupo;
}

export const GRUPOS = [
  'operacion',
  'datos-generales',
  'inventario',
  'informes',
  'administracion',
] as const;
export type NombreGrupo = (typeof GRUPOS)[number];

export const TITULO_GRUPO: Record<NombreGrupo, string> = {
  operacion: 'Operación',
  'datos-generales': 'Datos generales',
  inventario: 'Inventario y compras',
  informes: 'Informes',
  administracion: 'Administración',
};

export const MENU: EntradaMenu[] = [
  // --- Operación: lo que se usa con el cliente enfrente ---------------------
  { modulo: 'agenda', etiqueta: 'Agenda', ruta: '/panel/agenda', icono: 'calendar-days', grupo: 'operacion' },
  { modulo: 'cobros', etiqueta: 'Cobros', ruta: '/panel/cobros', icono: 'receipt', grupo: 'operacion' },
  { modulo: 'facturas', etiqueta: 'Facturas', ruta: '/panel/facturas', icono: 'file-text', grupo: 'operacion' },
  {
    modulo: 'comisiones',
    etiqueta: 'Comisiones',
    ruta: '/panel/comisiones',
    icono: 'hand-coins',
    grupo: 'operacion',
  },

  // --- Datos generales: los catálogos maestros ------------------------------
  {
    modulo: 'datos-generales',
    etiqueta: 'Resumen',
    ruta: '/panel/datos-generales',
    icono: 'clipboard-list',
    grupo: 'datos-generales',
  },
  { modulo: 'clientes', etiqueta: 'Clientes', ruta: '/panel/clientes', icono: 'user-round', grupo: 'datos-generales' },
  { modulo: 'servicios', etiqueta: 'Servicios', ruta: '/panel/servicios', icono: 'sparkles', grupo: 'datos-generales' },
  {
    modulo: 'profesionales',
    etiqueta: 'Barberos',
    ruta: '/panel/barberos',
    icono: 'scissors',
    grupo: 'datos-generales',
  },

  // --- Inventario y compras ------------------------------------------------
  { modulo: 'inventario', etiqueta: 'Inventario', ruta: '/panel/inventario', icono: 'package', grupo: 'inventario' },
  {
    modulo: 'compras',
    etiqueta: 'Compras',
    ruta: '/panel/compras',
    icono: 'clipboard-list',
    grupo: 'inventario',
  },

  // --- Informes ------------------------------------------------------------
  { modulo: 'reportes', etiqueta: 'Reportes', ruta: '/panel/reportes', icono: 'chart-column', grupo: 'informes' },
  { modulo: 'ranking', etiqueta: 'Ranking', ruta: '/panel/ranking', icono: 'trophy', grupo: 'informes' },

  // --- Administración ------------------------------------------------------
  {
    modulo: 'configuracion',
    etiqueta: 'Configuración',
    ruta: '/panel/configuracion',
    icono: 'settings',
    grupo: 'administracion',
  },
  { modulo: 'usuarios', etiqueta: 'Usuarios', ruta: '/panel/usuarios', icono: 'shield-check', grupo: 'administracion' },
  { modulo: 'papelera', etiqueta: 'Papelera', ruta: '/panel/papelera', icono: 'trash-2', grupo: 'administracion' },
  {
    modulo: 'auditoria',
    etiqueta: 'Auditoría',
    ruta: '/panel/auditoria',
    icono: 'scroll-text',
    grupo: 'administracion',
  },
];

/**
 * Filtra el menu segun el rol.
 *
 * Esto NO es control de acceso: la autoridad son las politicas RLS de la base,
 * que se aplican aunque alguien escriba la ruta a mano. Aqui solo se evita
 * ofrecer pantallas que despues van a devolver un error de permisos.
 */
export function menuPara(rol: NombreRol): EntradaMenu[] {
  const permitidos = new Set<Modulo>(MODULOS_POR_ROL[rol]);
  return MENU.filter((e) => permitidos.has(e.modulo));
}

/**
 * El menu ya partido en grupos, sin los que quedaron vacios.
 *
 * Un encabezado de grupo sobre cero entradas es peor que no tener grupos: la
 * recepcionista veria «Administración» seguido de nada.
 */
export function gruposPara(rol: NombreRol): Array<{ grupo: NombreGrupo; entradas: EntradaMenu[] }> {
  const entradas = menuPara(rol);
  return GRUPOS.map((grupo) => ({
    grupo,
    entradas: entradas.filter((e) => e.grupo === grupo),
  })).filter((g) => g.entradas.length > 0);
}
