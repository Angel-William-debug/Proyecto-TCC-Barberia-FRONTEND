import { usuarioActual } from '@barber-shop/api';
import { EstadoVacio, Tarjeta, ZONA_HORARIA } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { ResumenBarbero } from '@/componentes/barberos/resumen-barbero';

export const metadata = { title: 'Mi día' };

/**
 * «Mi día», el panel del barbero (vistas 101 a 103 del anexo, 14/10/2026).
 *
 * Lo que un barbero viene a mirar, en una pantalla y en el orden en que lo
 * pregunta: a quién atiende hoy (101), qué hizo este mes (102) y cuánto le
 * deben (103). La vista 104, la agenda de un barbero, ya estaba: es la Agenda
 * con el filtro «Barbero».
 *
 * Solo lectura: el barbero no agenda, no cobra ni liquida. Para eso está el
 * mostrador.
 */
export default async function PaginaMiDia() {
  const sesion = await usuarioActual();
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());

  if (!sesion?.idProfesional) {
    return (
      <>
        <EncabezadoVista titulo="Mi día" />
        <Tarjeta className="p-2">
          <EstadoVacio
            icono="scissors"
            titulo="Su cuenta no tiene una ficha de barbero"
            descripcion="Pídale al administrador que la vincule desde Usuarios y roles."
          />
        </Tarjeta>
      </>
    );
  }

  return (
    <>
      <EncabezadoVista
        titulo={`Hola, ${sesion.nombre.split(' ')[0]}`}
        descripcion="Su agenda de hoy, lo que atendió en los últimos 30 días y sus comisiones."
      />
      <ResumenBarbero idProfesional={sesion.idProfesional} hoy={hoy} propio />
    </>
  );
}
