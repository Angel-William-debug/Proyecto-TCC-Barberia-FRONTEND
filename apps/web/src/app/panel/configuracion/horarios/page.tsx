import { listarHorarios } from '@barber-shop/api';
import { EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { AjustesHorarios } from '@/componentes/formularios/ajustes-horarios';

export const metadata = { title: 'Horarios de atención' };

/** CU-020 - horario de atencion por dia. Siete filas fijas que solo se editan. */
export default async function PaginaHorarios() {
  const horarios = await listarHorarios();

  return (
    <>
      <EncabezadoVista
        titulo="Horarios de atención"
        descripcion="Las franjas en las que la barbería toma turnos. Es lo que decide qué horas se le ofrecen al cliente al reservar."
      />

      {horarios.length > 0 ? (
        <AjustesHorarios horarios={horarios} />
      ) : (
        <Tarjeta>
          <EstadoVacio
            icono="triangle-alert"
            titulo="No hay horarios cargados"
            descripcion="La instalación carga los siete días. Sin ninguno, la agenda no puede ofrecer turnos. Verifique los datos iniciales de la base."
          />
        </Tarjeta>
      )}
    </>
  );
}
