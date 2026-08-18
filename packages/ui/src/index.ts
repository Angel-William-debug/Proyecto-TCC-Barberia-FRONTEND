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
export {
  PanelLateral,
  type PropsPanelLateral,
  type AnchoPanel,
} from './componentes/panel-lateral';
// --- Campos de formulario (seccion 9.11) -----------------------------------
export { Campo, type PropsCampo } from './componentes/campos/campo-texto';
export {
  CampoSelector,
  type OpcionCampo,
  type PropsCampoSelector,
} from './componentes/campos/campo-selector';
export { CampoArea, type PropsCampoArea } from './componentes/campos/campo-area';
export { Interruptor, type PropsInterruptor } from './componentes/campos/interruptor';
export {
  GrupoCampos,
  FilaCampos,
  CuerpoFormulario,
  AvisoFormulario,
} from './componentes/campos/grupos';
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
// --- Filtros de tabla (seccion 9.9) ----------------------------------------
export { BarraFiltros } from './componentes/filtros/barra-filtros';
export { CampoBusqueda, type PropsCampoBusqueda } from './componentes/filtros/campo-busqueda';
export {
  SelectorFiltro,
  type Opcion,
  type PropsSelectorFiltro,
} from './componentes/filtros/selector-filtro';
export {
  SelectorMultiple,
  type PropsSelectorMultiple,
} from './componentes/filtros/selector-multiple';
export { RangoFechas, type PropsRangoFechas } from './componentes/filtros/rango-fechas';
export {
  FiltrosActivos,
  type PropsFiltrosActivos,
} from './componentes/filtros/filtros-activos';
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
