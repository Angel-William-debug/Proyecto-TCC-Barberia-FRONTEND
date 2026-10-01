import { MarcoSesion } from '@/componentes/sesion/marco-sesion';
import { ResultadoConfirmacion } from '@/componentes/sesion/resultado-confirmacion';

export const metadata = { title: 'Correo confirmado' };

/**
 * Adonde lleva el enlace del correo de confirmacion (CU-001, desde el
 * 1/10/2026). La confirmacion ya la hizo Supabase antes de redirigir aca;
 * esta pagina solo cuenta como salio. Ver `registrarCliente()`.
 */
export default function PaginaCuentaConfirmada() {
  return (
    <MarcoSesion titulo="Confirmación de correo" descripcion="Barber Shop">
      <ResultadoConfirmacion />
    </MarcoSesion>
  );
}
