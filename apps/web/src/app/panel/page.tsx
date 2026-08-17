import { redirect } from 'next/navigation';

/** El panel no tiene pantalla propia: entra directo a la agenda del dia. */
export default function PaginaPanel() {
  redirect('/panel/agenda');
}
