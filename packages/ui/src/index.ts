/**
 * Sistema de Diseno Barber Shop.
 *
 * Punto de entrada unico. Las vistas importan desde aqui y nunca desde una
 * ruta interna del paquete: eso permite reorganizar el interior sin tocar
 * ninguna pantalla.
 */

// Tokens y utilidades
export { cn } from './utilidades';
export { VALORES, COLOR_TEMA_NAVEGADOR, COLORES_GRAFICO } from './tokens/valores';
export * from './formato';
export * from './estados';
export {
  ICONOS,
  ICONO_DE,
  TAMANO_ICONO,
  type NombreIcono,
  type TamanoIcono,
} from './iconos';

// Componentes
export { Icono, type PropsIcono } from './componentes/icono';
export { Boton, BotonIcono, type PropsBoton, type PropsBotonIcono } from './componentes/boton';
export { ChipEstado, PuntoEstado, type PropsChipEstado } from './componentes/chip-estado';
export { Campo, type PropsCampo } from './componentes/campo';
export {
  Tarjeta,
  TarjetaEncabezado,
  TarjetaCuerpo,
  Indicador,
  type PropsIndicador,
} from './componentes/tarjeta';
export {
  EstadoVacio,
  Esqueleto,
  EsqueletoTabla,
  type PropsEstadoVacio,
} from './componentes/estado-vacio';
export {
  BarraFiltros,
  CampoBusqueda,
  SelectorFiltro,
  SelectorMultiple,
  RangoFechas,
  FiltrosActivos,
  type Opcion,
  type PropsCampoBusqueda,
  type PropsSelectorFiltro,
  type PropsSelectorMultiple,
  type PropsRangoFechas,
  type PropsFiltrosActivos,
} from './componentes/filtros';
export {
  Tabla,
  TablaEncabezado,
  TablaCuerpo,
  Th,
  Tr,
  Td,
  TdCompleta,
  type PropsTabla,
} from './componentes/tabla';
