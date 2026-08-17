import { MODULOS_POR_ROL, type Modulo, type NombreRol } from '@barber-shop/tipos';
import type { NombreIcono } from '@barber-shop/ui';

/**
 * Estructura de la barra lateral (seccion 6.5 del sistema de diseno).
 *
 * El orden refleja el flujo de trabajo de una jornada: primero lo que se usa
 * con el cliente enfrente (agenda, clientes, cobros), despues lo
 * administrativo. No es alfabetico a proposito.
 */
export interface EntradaMenu {
  modulo: Modulo;
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

export const MENU: EntradaMenu[] = [
  { modulo: 'agenda', etiqueta: 'Agenda', ruta: '/panel/agenda', icono: 'calendar-days' },
  { modulo: 'clientes', etiqueta: 'Clientes', ruta: '/panel/clientes', icono: 'user-round' },
  { modulo: 'servicios', etiqueta: 'Servicios', ruta: '/panel/servicios', icono: 'sparkles' },
  {
    modulo: 'profesionales',
    etiqueta: 'Barberos',
    ruta: '/panel/barberos',
    icono: 'scissors',
  },
  { modulo: 'cobros', etiqueta: 'Cobros', ruta: '/panel/cobros', icono: 'receipt' },
  {
    modulo: 'comisiones',
    etiqueta: 'Comisiones',
    ruta: '/panel/comisiones',
    icono: 'hand-coins',
  },
  { modulo: 'inventario', etiqueta: 'Inventario', ruta: '/panel/inventario', icono: 'package' },
  { modulo: 'compras', etiqueta: 'Compras', ruta: '/panel/compras', icono: 'clipboard-list' },
  { modulo: 'reportes', etiqueta: 'Reportes', ruta: '/panel/reportes', icono: 'chart-column' },
  {
    modulo: 'configuracion',
    etiqueta: 'Configuración',
    ruta: '/panel/configuracion',
    icono: 'settings',
  },
  { modulo: 'auditoria', etiqueta: 'Auditoría', ruta: '/panel/auditoria', icono: 'scroll-text' },
];

/**
 * Filtra el menu segun el rol.
 *
 * Esto NO es control de acceso: la autoridad son las 56 politicas RLS de la
 * base, que se aplican aunque alguien escriba la ruta a mano. Aqui solo se
 * evita ofrecer pantallas que despues van a devolver un error de permisos.
 */
export function menuPara(rol: NombreRol): EntradaMenu[] {
  const permitidos = new Set<Modulo>(MODULOS_POR_ROL[rol]);
  return MENU.filter((e) => permitidos.has(e.modulo));
}
