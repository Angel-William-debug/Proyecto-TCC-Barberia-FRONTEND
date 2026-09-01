/**
 * Seccion 7 del Sistema de Diseno: iconografia.
 *
 * Lucide es la unica fuente de iconos del sistema. Este registro cumple dos
 * funciones:
 *
 *  1. Fija un icono por concepto (seccion 7.4). Que «cliente» sea siempre
 *     `user-round` no se decide en cada pantalla, se decide aqui.
 *  2. Permite que `estados.ts` devuelva el nombre del icono como texto sin
 *     importar componentes de React, lo que lo mantiene utilizable tambien
 *     desde el servidor.
 *
 * Solo se importan los iconos que el sistema realmente usa: `lucide-react`
 * exporta mas de mil quinientos y traerlos todos engordaria el paquete.
 */

import {
  ArrowLeftRight,
  Ban,
  Bell,
  Box,
  Brain,
  Calendar,
  CalendarDays,
  ChartColumn,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  HandCoins,
  Inbox,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Receipt,
  Scissors,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Truck,
  UserRound,
  UserX,
  X,
  type LucideIcon,
} from 'lucide-react';

/** Registro nombre-en-kebab -> componente. */
export const ICONOS = {
  // Dominio
  'calendar-days': CalendarDays,
  calendar: Calendar,
  'user-round': UserRound,
  scissors: Scissors,
  sparkles: Sparkles,
  tag: Tag,
  receipt: Receipt,
  'file-text': FileText,
  'credit-card': CreditCard,
  'hand-coins': HandCoins,
  settings: Settings,
  'shield-check': ShieldCheck,
  clock: Clock,
  package: Package,
  box: Box,
  'arrow-left-right': ArrowLeftRight,
  'triangle-alert': TriangleAlert,
  truck: Truck,
  'clipboard-list': ClipboardList,
  'chart-column': ChartColumn,
  brain: Brain,
  'scroll-text': ScrollText,
  bell: Bell,
  trophy: Trophy,

  // Estados
  'check-check': CheckCheck,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  'circle-dashed': CircleDashed,
  'circle-alert': CircleAlert,
  'user-x': UserX,
  ban: Ban,
  'package-check': PackageCheck,
  'package-x': PackageX,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,

  // Acciones y navegacion
  search: Search,
  download: Download,
  plus: Plus,
  pencil: Pencil,
  'trash-2': Trash2,
  check: Check,
  x: X,
  menu: Menu,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevrons-left': ChevronsLeft,
  'log-out': LogOut,
  'loader-circle': LoaderCircle,
  inbox: Inbox,
  sun: Sun,
  moon: Moon,
} as const satisfies Record<string, LucideIcon>;

export type NombreIcono = keyof typeof ICONOS;

/** Tamanos de la seccion 7.2, en pixeles. */
export const TAMANO_ICONO = {
  xs: 14,
  sm: 16, // predeterminado
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export type TamanoIcono = keyof typeof TAMANO_ICONO;

/**
 * Icono de un concepto del sistema (seccion 7.4).
 *
 * Reutilizar el mismo simbolo para dos conceptos, o dos simbolos para el
 * mismo, degrada la interfaz mas rapido que cualquier error de color. Por eso
 * esta tabla es explicita y no se resuelve por convencion de nombres.
 */
export const ICONO_DE: Record<string, NombreIcono> = {
  agenda: 'calendar-days',
  citas: 'calendar-days',
  clientes: 'user-round',
  profesionales: 'scissors',
  barbero: 'scissors',
  servicios: 'sparkles',
  categorias: 'tag',
  cobros: 'receipt',
  facturas: 'file-text',
  metodosPago: 'credit-card',
  comisiones: 'hand-coins',
  configuracion: 'settings',
  usuarios: 'shield-check',
  horarios: 'clock',
  inventario: 'package',
  productos: 'box',
  movimientos: 'arrow-left-right',
  alertas: 'triangle-alert',
  proveedores: 'truck',
  compras: 'clipboard-list',
  reportes: 'chart-column',
  recomendaciones: 'brain',
  auditoria: 'scroll-text',
  notificaciones: 'bell',
};
