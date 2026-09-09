import { MODULOS_POR_ROL, type Modulo, type NombreRol } from '@barber-shop/tipos';


import type { EntradaBarra, GrupoBarra } from '@/componentes/armazon/barra-lateral';

/**
 * Estructura de la barra lateral (seccion 6.5 del sistema de diseno).
 *
 * El orden refleja el flujo de trabajo de una jornada: primero lo que se usa
 * con el cliente enfrente, despues lo administrativo. No es alfabetico a
 * proposito.
 *
 * LAS ENTRADAS VAN AGRUPADAS
 *
 * Diecisiete entradas seguidas se leen como una lista, no como un sistema: hay
 * que recorrerlas para encontrar cualquier cosa. Los cinco grupos responden a
 * la pregunta con la que uno llega -"vengo a atender", "vengo a mantener los
 * datos", "vengo a mirar como va el negocio"- en vez de obligar a saber de
 * antemano en que pantalla vive cada dato.
 *
 * El grupo «Datos generales» es ademas un pedido explicito de la Direccion:
 * agrupar en un solo apartado la administracion de las entidades base
 * -clientes, servicios, productos y metodos de pago-. Su primera entrada es
 * la pantalla resumen, que las reune todas con su cantidad de registros.
 *
 * HAY DOS MENUS, NO UNO
 *
 * El de abajo es el del sistema. El segundo -`MENU_CONFIGURACION`- es el del
 * area de configuracion, que reemplaza al primero al entrar en ella. Ver
 * `gruposConfiguracionPara` para el porque.
 */
export interface EntradaMenu extends EntradaBarra {
  modulo: Modulo;
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
  // Una sola entrada, y es una PUERTA, no una pantalla: lleva al area de
  // configuracion, que trae su propia barra lateral. Usuarios, Papelera y
  // Auditoria estaban aca sueltas hasta el 9/9/2026 y se mudaron adentro.
  {
    modulo: 'configuracion',
    etiqueta: 'Configuración',
    ruta: '/panel/configuracion',
    icono: 'settings',
    grupo: 'administracion',
  },
];

// ---------------------------------------------------------------------------
// El area de configuracion
// ---------------------------------------------------------------------------

/**
 * POR QUE UN AREA CON BARRA PROPIA Y NO CUATRO ENTRADAS MAS
 *
 * Agenda y Cobros se abren cien veces al dia. Usuarios, Papelera y Auditoria
 * se abren una vez al mes y solo el administrador. Tenerlas siempre a la vista
 * le cobraba atencion todos los dias a la recepcionista por algo que no toca
 * nunca, y ademas hacia que «Configuración» pareciera una pantalla mas de una
 * lista, cuando en realidad es la portada de todo lo que se ajusta.
 *
 * Al entrar, la barra del sistema se reemplaza por esta y aparece arriba
 * «Volver al sistema». La barra principal baja de diecisiete entradas a trece.
 *
 * LAS RUTAS NO CAMBIARON. `/panel/usuarios`, `/panel/papelera` y
 * `/panel/auditoria` siguen donde estaban: lo que cambia es la barra que las
 * rodea, no su direccion. Cualquier enlace guardado sigue funcionando.
 */
export const GRUPOS_CONFIGURACION = ['establecimiento', 'sistema', 'mantenimiento'] as const;
export type NombreGrupoConfiguracion = (typeof GRUPOS_CONFIGURACION)[number];

export const TITULO_GRUPO_CONFIGURACION: Record<NombreGrupoConfiguracion, string> = {
  establecimiento: 'Establecimiento',
  sistema: 'Sistema',
  mantenimiento: 'Mantenimiento',
};

export interface EntradaMenuConfiguracion extends EntradaBarra {
  modulo: Modulo;
  grupo: NombreGrupoConfiguracion;
}

export const MENU_CONFIGURACION: EntradaMenuConfiguracion[] = [
  // --- Establecimiento: lo que describe a la barbería -----------------------
  {
    modulo: 'configuracion',
    etiqueta: 'Datos del establecimiento',
    ruta: '/panel/configuracion',
    icono: 'store',
    grupo: 'establecimiento',
    // Sin esto quedarian DOS entradas resaltadas en Horarios y en Metodos de
    // pago, porque `/panel/configuracion` es prefijo de las dos.
    exacta: true,
  },
  {
    modulo: 'configuracion',
    etiqueta: 'Horarios de atención',
    ruta: '/panel/configuracion/horarios',
    icono: 'clock',
    grupo: 'establecimiento',
  },
  {
    modulo: 'configuracion',
    etiqueta: 'Métodos de pago',
    ruta: '/panel/configuracion/metodos-pago',
    icono: 'credit-card',
    grupo: 'establecimiento',
  },

  // --- Sistema: cómo se comporta -------------------------------------------
  {
    modulo: 'configuracion',
    etiqueta: 'Notificaciones',
    ruta: '/panel/configuracion/notificaciones',
    icono: 'bell',
    grupo: 'sistema',
  },
  {
    modulo: 'usuarios',
    etiqueta: 'Usuarios y roles',
    ruta: '/panel/usuarios',
    icono: 'shield-check',
    grupo: 'sistema',
  },

  // --- Mantenimiento: lo que se revisa, no lo que se ajusta -----------------
  { modulo: 'papelera', etiqueta: 'Papelera', ruta: '/panel/papelera', icono: 'trash-2', grupo: 'mantenimiento' },
  {
    modulo: 'auditoria',
    etiqueta: 'Auditoría',
    ruta: '/panel/auditoria',
    icono: 'scroll-text',
    grupo: 'mantenimiento',
  },
];

/**
 * Las rutas que pertenecen al area.
 *
 * `MarcoLateral` las usa para decidir cual de las dos barras dibuja. Se
 * derivan del menu y no se escriben a mano: agregar una pantalla al area es
 * agregarla arriba, en un solo lugar.
 */
export const RUTAS_AREA_CONFIGURACION: string[] = [
  ...new Set(MENU_CONFIGURACION.map((e) => e.ruta)),
];

/** Adonde vuelve el enlace «Volver al sistema». */
export const SALIDA_AREA_CONFIGURACION = '/panel/agenda';

// ---------------------------------------------------------------------------
// Filtrado por rol
// ---------------------------------------------------------------------------

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

/** El menu del area de configuracion, filtrado por el mismo criterio. */
export function menuConfiguracionPara(rol: NombreRol): EntradaMenuConfiguracion[] {
  const permitidos = new Set<Modulo>(MODULOS_POR_ROL[rol]);
  return MENU_CONFIGURACION.filter((e) => permitidos.has(e.modulo));
}

/**
 * El menu ya partido en grupos, con la forma que espera `BarraLateral`.
 *
 * Se descartan los grupos vacios: un encabezado sobre cero entradas es peor
 * que no tener grupos, porque la recepcionista veria «Administración» seguido
 * de nada.
 *
 * EL GRUPO «ADMINISTRACIÓN» SE ARMA APARTE
 *
 * Quien tiene `configuracion` ve una sola entrada, la puerta al area. Quien no
 * -la recepcionista, que solo alcanza la Papelera- no puede ver una puerta que
 * da a un area de una sola pantalla: sale mas corto ofrecerle esa pantalla
 * directamente, como estaba antes. Por eso el grupo se calcula y no se filtra.
 */
export function gruposPara(rol: NombreRol): GrupoBarra[] {
  const entradas = menuPara(rol);
  const permitidos = new Set<Modulo>(MODULOS_POR_ROL[rol]);

  const administracion = permitidos.has('configuracion')
    ? entradas.filter((e) => e.grupo === 'administracion')
    : menuConfiguracionPara(rol);

  return GRUPOS.map((grupo) => ({
    titulo: TITULO_GRUPO[grupo],
    entradas: grupo === 'administracion' ? administracion : entradas.filter((e) => e.grupo === grupo),
  })).filter((g) => g.entradas.length > 0);
}

/** Los grupos del area de configuracion, listos para `BarraLateral`. */
export function gruposConfiguracionPara(rol: NombreRol): GrupoBarra[] {
  const entradas = menuConfiguracionPara(rol);
  return GRUPOS_CONFIGURACION.map((grupo) => ({
    titulo: TITULO_GRUPO_CONFIGURACION[grupo],
    entradas: entradas.filter((e) => e.grupo === grupo),
  })).filter((g) => g.entradas.length > 0);
}
