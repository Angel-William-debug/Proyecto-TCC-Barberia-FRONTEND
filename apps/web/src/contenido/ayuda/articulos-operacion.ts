import type { Articulo } from './tipos';

/**
 * Lo que se usa en el mostrador: agenda, cobros, facturas, clientes,
 * inventario y avisos. Lo leen la recepcionista y el administrador.
 */
export const ARTICULOS_OPERACION: readonly Articulo[] = [
  // ---------------------------------------------------------------------------
  // Agenda
  // ---------------------------------------------------------------------------
  {
    id: 'ver-la-agenda',
    titulo: 'Ver la agenda por día, semana o mes',
    resumen: 'Cómo moverse por la agenda, filtrarla por barbero o estado y leer sus indicadores.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['calendario', 'citas', 'turnos del día', 'semana', 'mes', 'filtrar', 'barbero'],
    captura: { archivo: '08-agenda.png', descripcion: 'La agenda en la vista Día' },
    cuerpo: `La Agenda reúne todos los turnos de la barbería. Se abre desde «Agenda» en la barra lateral; para la recepcionista es la pantalla de inicio.

## Cambiar de vista

1. Elija «Día», «Semana» o «Mes» arriba de la lista.
2. En la vista Día, cambie la fecha con el filtro de fecha.
3. En Semana y Mes, use «← Semana anterior» / «Mes anterior», «Hoy» y «Semana siguiente →» / «Mes siguiente →».
4. En el calendario, toque un día para abrirlo en la vista Día.

## Buscar y filtrar

- Escriba en la búsqueda un cliente, un teléfono o un servicio.
- Use el filtro «Barbero» para ver la agenda de una sola persona.
- Use «Estado» para ver, por ejemplo, solo los Pendientes. Puede elegir varios estados a la vez.

## Los indicadores

Arriba de la lista se ven «Turnos del día» (o de la semana o del mes), «Completados» y «Facturado», que suma los turnos completados del período que está mirando.

## Exportar

El botón de exportar ofrece «Descargar Excel», «Descargar PDF» y «Enviar por correo», y exporta el rango que se está viendo, con los filtros aplicados. Ver [[exportar]].

> Cada turno tiene un ícono de ojo para ver su detalle: cliente con su teléfono, servicios en orden con hora y barbero, total, observaciones y, si se canceló, el motivo.`,
    relacionados: ['agendar-turno', 'estados-del-turno', 'buscar-y-filtrar'],
  },
  {
    id: 'agendar-turno',
    titulo: 'Agendar un turno',
    resumen: 'Cargar un turno nuevo con uno o más servicios, cada uno con su barbero.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['nuevo turno', 'reservar', 'cita', 'reserva', 'dar turno'],
    cuerpo: `1. En la Agenda, presione «Nuevo turno». Si el día está vacío, el botón aparece también en el centro.
2. Elija el cliente. Si todavía no está registrado, primero cárguelo: ver [[registrar-cliente]].
3. Elija la fecha y la hora. La lista ofrece horas en punto dentro del horario de atención, sin el recreo de almuerzo.
4. Agregue el servicio y su barbero. Para sumar otro servicio, presione «Agregar otro servicio»; el ícono de papelera quita una línea.
5. Si hace falta, escriba «Notas del turno».
6. Revise la duración total y el precio, que se calculan en vivo, y presione «Agendar turno».

El turno nace **Pendiente**. Si es de otro día, la agenda salta a ese día.

## Cómo se ordenan los servicios

Los servicios de un mismo turno se atienden uno detrás del otro. El sistema controla que cada barbero esté libre en su propia franja.

> El precio y la duración se copian del catálogo al agendar. Si después cambia el precio de un servicio, los turnos ya dados no cambian.

## Mensajes que puede ver

- «El barbero seleccionado ya tiene otro turno en ese horario.»: elija otra hora u otro barbero.
- «Ese horario queda fuera del horario de atención de la barbería.»
- «La barbería no atiende ese día»: aparece en el campo de hora. Ver [[horarios-atencion]].
- «No se puede agendar un turno en un momento que ya pasó.»
- «Cada servicio necesita un barbero asignado.»

Solo se ofrecen los barberos y servicios activos.`,
    relacionados: ['confirmar-turno', 'estados-del-turno', 'guia-turno-a-comision'],
  },
  {
    id: 'confirmar-turno',
    titulo: 'Confirmar un turno',
    resumen: 'Pasar un turno de Pendiente a Confirmado cuando el cliente asegura que viene.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['confirmación', 'cita', 'aviso al cliente'],
    cuerpo: `Un turno nace Pendiente. Confírmelo cuando el cliente le asegure que viene, por ejemplo después de llamarlo.

1. En la Agenda, busque el turno y presione el ícono de ojo.
2. En el detalle, presione «Confirmar».

El turno pasa a **Confirmado**. Si el cliente usa la app, le llega el aviso «La barbería confirmó su turno…».

> El botón «Confirmar» solo aparece en los turnos Pendientes. Un turno ya confirmado no necesita nada más hasta el día de la atención.

> El cliente también puede confirmar su propio turno desde la app del teléfono, con «Confirmar asistencia» o desde el recordatorio. En ese caso lo verá Confirmado sin haber hecho nada.`,
    relacionados: ['estados-del-turno', 'reprogramar-turno', 'cancelar-turno'],
  },
  {
    id: 'reprogramar-turno',
    titulo: 'Reprogramar un turno',
    resumen: 'Mover un turno a otro día u hora sin cancelarlo.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['cambiar hora', 'mover turno', 'cambiar fecha', 'posponer', 'cita'],
    cuerpo: `1. En la Agenda, abra el detalle del turno con el ícono de ojo.
2. Presione «Reprogramar».
3. Cambie el día, la hora y, si quiere, las observaciones.
4. Presione «Guardar el cambio».

Si el cliente tiene cuenta, recibe un aviso con la hora nueva y la anterior.

## Cuándo se puede

Solo se reprograma un turno **Pendiente o Confirmado** cuya hora todavía no pasó. Un turno completado o cancelado ya no se modifica.

## Mensajes que puede ver

- «El barbero ya tiene otro turno en ese horario.»
- «No se puede mover un turno a un momento que ya pasó.»
- «Ese horario queda fuera del horario de atención de la barbería.»
- «Solo se puede cambiar un turno pendiente o confirmado.»`,
    relacionados: ['agendar-turno', 'cancelar-turno'],
  },
  {
    id: 'cancelar-turno',
    titulo: 'Cancelar un turno',
    resumen: 'Cancelar un turno indicando el motivo.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['anular turno', 'borrar turno', 'eliminar cita', 'suspender'],
    cuerpo: `1. En la Agenda, abra el detalle del turno con el ícono de ojo.
2. Presione «Cancelar turno».
3. Escriba el motivo, de al menos 3 caracteres. Es obligatorio.
4. Presione «Cancelar el turno».

El turno queda **Cancelado** y su horario vuelve a estar libre. Si el cliente usa la app, recibe el aviso «La barbería canceló su turno…». El motivo se ve después en el detalle del turno.

> ! Cancelar no se puede deshacer. Si el cliente cambia de idea, agende un turno nuevo. Si solo quiere otra hora, use [[reprogramar-turno]].

## Mensajes que puede ver

- «Escriba por qué se cancela el turno.»: falta el motivo o es muy corto.
- «Ese turno ya no se puede cancelar.»: ya está completado, cancelado o su hora pasó. Si el cliente no vino, use [[marcar-no-asistio]].

> El cliente también puede cancelar sus propios turnos desde el portal web o la app.`,
    relacionados: ['reprogramar-turno', 'marcar-no-asistio', 'estados-del-turno'],
  },
  {
    id: 'marcar-no-asistio',
    titulo: 'Marcar que el cliente no asistió',
    resumen: 'Registrar que el cliente no se presentó a un turno que ya pasó.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['ausente', 'faltó', 'no vino', 'inasistencia', 'no show'],
    cuerpo: `Cuando la hora del turno ya pasó y el cliente no se presentó:

1. En la Agenda, abra el detalle del turno con el ícono de ojo.
2. Presione «No asistió».

El turno queda en estado **No asistió**. No genera cobro ni comisión, y el cliente no puede calificarlo.

> El botón aparece solo cuando la hora del turno ya pasó. Antes de esa hora, si el cliente avisa que no viene, corresponde [[cancelar-turno]].

> Marcar las inasistencias mantiene correcta la tasa de cancelación del Tablero y de los Reportes.`,
    relacionados: ['estados-del-turno', 'cancelar-turno'],
  },
  {
    id: 'completar-turno',
    titulo: 'Completar un turno y registrar los insumos',
    resumen: 'Cerrar un turno atendido, confirmar los productos usados y dejarlo listo para cobrar.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['cerrar turno', 'terminar', 'atendido', 'insumos', 'consumo', 'finalizar'],
    cuerpo: `Cuando el cliente ya fue atendido:

1. En la Agenda, presione «Completar» en la fila del turno.
2. Confirme en «¿Completar el turno de …?» con «Completar turno».
3. Se abre el panel «Insumos utilizados» con las cantidades que propone la receta de cada servicio. Corríjalas si se usó más o menos.
4. Presione «Confirmar consumo».

## Qué pasa al completar

- El turno queda **Completado** y pasa a Cobros, listo para [[registrar-cobro]].
- Se genera la comisión del barbero, Pendiente de liquidar.
- Al confirmar el consumo, los productos se descuentan del stock.

Si ningún servicio tiene receta, el panel dice «Sin productos que registrar». Ver [[receta-servicio]].

> ! Completar no se puede deshacer: el turno queda cerrado y ya no se modifica.

> ! Si cierra el panel «Insumos utilizados» sin presionar «Confirmar consumo», el turno queda completado sin consumo registrado y no se puede retomar. Confirme siempre antes de cerrar.

> No se puede completar un turno de un día que todavía no llegó.

Si no alcanza el stock, ver [[falta-stock-al-completar]].`,
    relacionados: ['falta-stock-al-completar', 'registrar-cobro', 'guia-turno-a-comision'],
  },
  {
    id: 'falta-stock-al-completar',
    titulo: 'Qué hacer si falta stock al completar un turno',
    resumen: 'Resolver el aviso «No alcanza el stock» en el panel de insumos.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['sin stock', 'no alcanza', 'stock insuficiente', 'insumos', 'negativo'],
    cuerpo: `El stock nunca puede quedar negativo. Si en el panel «Insumos utilizados» una cantidad supera lo que hay, el campo muestra «No alcanza el stock» y «Confirmar consumo» queda bloqueado.

## Cómo resolverlo

1. Revise la cantidad: si se cargó de más, corríjala.
2. Si la cantidad es correcta, falta registrar mercadería. Use el enlace a Inventario, que se abre en otra pestaña.
3. En Inventario, registre la entrada del producto o un ajuste según lo que contó. Ver [[registrar-movimiento-stock]].
4. Vuelva a la pestaña de la Agenda y presione «Actualizar stock».
5. Presione «Confirmar consumo».

> ! No cierre el panel para «arreglarlo después»: si lo cierra sin confirmar, el turno queda completado sin consumo y no se puede retomar.

> Si el producto se compró a un proveedor con orden de compra, el administrador lo registra al marcar la orden como recibida. Ver [[crear-orden-compra]].`,
    relacionados: ['completar-turno', 'registrar-movimiento-stock', 'consultar-stock'],
  },
  {
    id: 'estados-del-turno',
    titulo: 'Los estados de un turno',
    resumen: 'Qué significa cada estado, quién lo cambia y qué se puede hacer en cada uno.',
    categoria: 'agenda',
    roles: ['administrador', 'recepcionista'],
    palabras: ['pendiente', 'confirmado', 'completado', 'cancelado', 'no asistió', 'en proceso', 'colores'],
    cuerpo: `Cada turno muestra su estado con un color.

- **Pendiente**: así nace todo turno, lo cargue el mostrador o lo reserve el cliente. Se puede confirmar, reprogramar o cancelar.
- **Confirmado**: el cliente aseguró que viene. Lo confirma el mostrador con «Confirmar» o el propio cliente desde la app. Se puede reprogramar o cancelar.
- **En proceso**: aparece como estado y como filtro, pero ningún botón lo asigna. Un turno en este estado también se puede completar.
- **Completado**: el cliente fue atendido. Genera la comisión, descuenta los insumos y habilita el cobro. Ya no se modifica.
- **Cancelado**: lo canceló el mostrador, con motivo, o el cliente desde el portal web o la app. Ya no se modifica.
- **No asistió**: la hora pasó y el cliente no vino. Lo marca el mostrador.

## Qué botón aparece en cada caso

- «Confirmar»: solo en Pendiente.
- «Reprogramar» y «Cancelar turno»: en Pendiente o Confirmado, mientras la hora no pasó.
- «No asistió»: en Pendiente o Confirmado, cuando la hora ya pasó.
- «Completar»: en Pendiente, Confirmado o En proceso.

> ! Completado y Cancelado son estados finales: «Esta cita ya está completada o cancelada y no puede modificarse.»`,
    relacionados: ['confirmar-turno', 'cancelar-turno', 'completar-turno', 'marcar-no-asistio'],
  },

  // ---------------------------------------------------------------------------
  // Cobros y facturas
  // ---------------------------------------------------------------------------
  {
    id: 'registrar-cobro',
    titulo: 'Registrar el cobro de un turno',
    resumen: 'Cobrar un turno completado por su saldo, con un método de pago.',
    categoria: 'cobros',
    roles: ['administrador', 'recepcionista'],
    palabras: ['pago', 'cobrar', 'caja', 'efectivo', 'tarjeta', 'parcial', 'anular cobro'],
    captura: { archivo: '09-cobros.png', descripcion: 'La pantalla de Cobros' },
    cuerpo: `1. En Cobros, presione «Registrar cobro».
2. Elija el turno. La lista muestra los turnos completados que tienen saldo, como «cliente · fecha · saldo».
3. Revise el total del turno y lo ya cobrado.
4. Elija el «Método de pago».
5. Presione «Registrar cobro».

El «Monto a cobrar» no se edita: es siempre el saldo completo del turno. El cobro queda **Pagado** con la fecha y hora del momento.

## Lo que conviene saber

- Solo se cobra un turno **Completado**. Si todavía no lo completó, ver [[completar-turno]].
- Un cobro usa **un solo método de pago**. No hay cobros parciales ni pagos divididos.
- El botón «Registrar cobro» está deshabilitado cuando no hay turnos pendientes de cobro.
- Los métodos que se ofrecen los define el administrador. Ver [[metodos-pago]].

> ! Un cobro no se anula ni se edita desde la pantalla. Revise el turno y el método antes de confirmar.

## Mensajes que puede ver

- «Ese turno ya no tiene saldo pendiente de cobro.»: otra persona lo cobró mientras tanto.
- «Elija el método de pago.»

Arriba se ven «Cobrado», «Pendiente de cobro» y «Movimientos». Después de cobrar, emita el comprobante: [[emitir-factura]].`,
    relacionados: ['emitir-factura', 'guia-turno-a-comision'],
  },
  {
    id: 'emitir-factura',
    titulo: 'Emitir la factura de un cobro',
    resumen: 'Generar el comprobante interno de un cobro pagado y descargarlo en PDF.',
    categoria: 'cobros',
    roles: ['administrador', 'recepcionista'],
    palabras: ['comprobante', 'factura', 'recibo', 'ticket', 'imprimir'],
    cuerpo: `1. En Cobros, busque el cobro. Debe estar **Pagado**.
2. Presione «Facturar».
3. Cuando la factura está emitida, el botón cambia a «Ver factura», que abre el PDF en otra pestaña para imprimirlo o enviarlo.

La factura copia el detalle del turno en el momento de emitirse: no cambia aunque después se edite un servicio. Lleva los datos de la barbería que carga el administrador en Configuración.

> El comprobante es **interno**: no tiene validez fiscal ni reemplaza a una factura legal ante la SET.

## Mensajes que puede ver

- «Este cobro ya tiene una factura emitida.»: cada cobro tiene una sola factura.
- «Solo se puede facturar un cobro pagado.»
- «El turno no tiene servicios para facturar.»

El cliente con cuenta ve sus comprobantes en el portal y puede descargarlos. Para buscar facturas ya emitidas, ver [[consultar-facturas]].`,
    relacionados: ['consultar-facturas', 'registrar-cobro'],
  },
  {
    id: 'consultar-facturas',
    titulo: 'Consultar y descargar facturas',
    resumen: 'Buscar comprobantes emitidos, descargarlos y exportar el listado.',
    categoria: 'cobros',
    roles: ['administrador', 'recepcionista'],
    palabras: ['comprobantes', 'anular factura', 'SET', 'fiscal', 'descargar pdf'],
    captura: { archivo: '10-facturas.png', descripcion: 'El listado de Facturas' },
    cuerpo: `La pantalla Facturas lista los comprobantes emitidos. Aquí no se crean: se emiten desde Cobros con «Facturar» (ver [[emitir-factura]]).

## Qué puede hacer

1. Buscar por nombre del cliente.
2. Filtrar por rango de «Fecha de emisión» y por «Estado» (Emitida, Anulada).
3. Descargar el PDF de una factura con el ícono de descarga.
4. Exportar el listado a Excel o PDF, o enviarlo por correo. Ver [[exportar]].

Arriba se ven «Facturas emitidas» y «Total facturado». El número de factura se muestra con 6 dígitos.

> El comprobante es interno de la barbería: no tiene validez fiscal ante la SET.

> ! Una factura no se anula desde el sistema. El estado «Anulada» existe como filtro, pero no hay botón para anular.

Si la lista está vacía, aparece «Emita una desde un cobro pagado en la pantalla de Cobros.»`,
    relacionados: ['emitir-factura', 'exportar'],
  },

  // ---------------------------------------------------------------------------
  // Clientes
  // ---------------------------------------------------------------------------
  {
    id: 'registrar-cliente',
    titulo: 'Registrar un cliente',
    resumen: 'Dar de alta un cliente desde el mostrador.',
    categoria: 'clientes',
    roles: ['administrador', 'recepcionista'],
    palabras: ['nuevo cliente', 'alta', 'agregar cliente', 'ficha'],
    captura: { archivo: '04-clientes.png', descripcion: 'El listado de Clientes' },
    cuerpo: `1. En Clientes, presione «Registrar cliente».
2. Complete «Nombre y apellido» y «Teléfono». Son obligatorios.
3. Si los tiene, cargue «Fecha de nacimiento», «Correo electrónico» y «Dirección».
4. Use «Notas (uso interno)» para lo que el equipo debe saber. El cliente nunca las ve.
5. Deje encendido «Cliente activo» y presione el botón de guardar.

## Por qué conviene cada dato

- El **teléfono** es obligatorio porque con él se confirma el turno.
- Sin **correo** el cliente no recibe recordatorios.
- La **fecha de nacimiento** habilita el saludo de cumpleaños.

## Mensajes que puede ver

- «Ingrese el nombre completo del cliente.»: mínimo 3 caracteres.
- «Ingrese un teléfono de al menos seis dígitos.»
- «Ingrese un correo con el formato nombre@dominio.com»
- «Ya existe un cliente con ese correo electrónico.»: búsquelo en la lista, o en la [[papelera]] si fue borrado.
- «La fecha de nacimiento no puede ser futura.»

> Los clientes también pueden registrarse solos desde la portada o la app. En ese caso aparecen en esta lista sin que usted haga nada.`,
    relacionados: ['editar-o-desactivar-cliente', 'ficha-cliente', 'agendar-turno'],
  },
  {
    id: 'editar-o-desactivar-cliente',
    titulo: 'Editar, desactivar o borrar un cliente',
    resumen: 'Corregir los datos de un cliente o sacarlo de la lista sin perder su historial.',
    categoria: 'clientes',
    roles: ['administrador', 'recepcionista'],
    palabras: ['modificar cliente', 'eliminar cliente', 'inactivo', 'baja'],
    cuerpo: `## Editar

1. En Clientes, presione el lápiz en la fila del cliente.
2. Corrija los datos en el panel «Editar cliente».
3. Guarde los cambios.

Los cambios quedan registrados en la auditoría del sistema.

## Desactivar

En el mismo formulario, apague «Cliente activo». Un cliente inactivo no se ofrece al agendar, pero conserva todo su historial y sigue en la lista.

## Borrar

1. Presione el ícono de papelera en la fila.
2. Confirme en «¿Borrar «…»?».

El cliente deja de verse en la lista y pasa a la Papelera, desde donde se puede restaurar. Ver [[papelera]] y [[borrar-o-desactivar]].

> Prefiera desactivar a un cliente que dejó de venir. Borrar es para registros cargados por error o duplicados.`,
    relacionados: ['registrar-cliente', 'borrar-o-desactivar', 'papelera'],
  },
  {
    id: 'ficha-cliente',
    titulo: 'La ficha del cliente',
    resumen: 'Ver el historial de servicios, los pagos y las notas internas de un cliente.',
    categoria: 'clientes',
    roles: ['administrador', 'recepcionista'],
    palabras: ['perfil del cliente', 'historial', 'visitas', 'pagos', 'notas'],
    captura: { archivo: '05-perfil-cliente.png', descripcion: 'La ficha de un cliente' },
    cuerpo: `Para abrirla, presione la flecha en la fila del cliente, o elija un cliente en la búsqueda del encabezado.

## Qué muestra

- **Indicadores**: Visitas, Total gastado, Pagado y Última visita.
- **Historial de servicios**: despliegue cada servicio para ver sus observaciones y los productos usados. La marca «(con stock insuficiente)» indica que en ese turno faltó stock.
- **Pagos**: turno, fecha de pago, método, monto y estado.
- **Notas internas**: el lápiz de esa tarjeta abre el formulario de edición del cliente.
- **Recomendaciones**: servicios que el cliente todavía no probó. Ver [[recomendaciones-cliente]].

## Acciones

- «Exportar PDF» descarga la ficha completa. Ver también [[pdf-de-clientes]].
- La flecha «Volver a clientes» regresa al listado.

El historial y los pagos se arman solos a partir de la Agenda y de Cobros: no se cargan a mano.`,
    relacionados: ['recomendaciones-cliente', 'pdf-de-clientes', 'editar-o-desactivar-cliente'],
  },
  {
    id: 'recomendaciones-cliente',
    titulo: 'Generar recomendaciones para un cliente',
    resumen: 'Pedirle al sistema servicios que el cliente todavía no probó y que podrían interesarle.',
    categoria: 'clientes',
    roles: ['administrador', 'recepcionista'],
    palabras: ['sugerencias', 'recomendar', 'afinidad', 'motor', 'inteligencia'],
    cuerpo: `1. Abra la ficha del cliente. Ver [[ficha-cliente]].
2. En la tarjeta de recomendaciones, presione «Generar recomendaciones». Si ya existen, el botón dice «Volver a generar».
3. Lea los servicios sugeridos, cada uno con su porcentaje de afinidad.

El sistema compara los servicios que tomó el cliente con los de clientes parecidos. Cuando no encuentra parecidos, sugiere lo más pedido en la barbería.

## Mensajes que puede ver

- «El cliente necesita al menos 3 servicios…»: con menos historial no hay suficiente información para recomendar.
- «El motor de recomendaciones no está disponible ahora»: presione «Reintentar» en unos minutos.

> El cliente ve sus propias recomendaciones en el portal, en «Para usted», y puede reservarlas desde ahí.`,
    relacionados: ['ficha-cliente'],
  },
  {
    id: 'pdf-de-clientes',
    titulo: 'Descargar fichas de clientes en PDF',
    resumen: 'Bajar la ficha de un cliente o la de todos en un archivo .zip.',
    categoria: 'clientes',
    roles: ['administrador', 'recepcionista'],
    palabras: ['zip', 'exportar clientes', 'imprimir ficha', 'pdf individual'],
    cuerpo: `## La ficha de un cliente

- En el listado de Clientes, presione el ícono de descarga en la fila del cliente.
- O, dentro de su ficha, presione «Exportar PDF».

## Las fichas de varios clientes

1. En Clientes, aplique la búsqueda y los filtros que quiera.
2. Abra el menú de exportar y elija «PDFs individuales (.zip)».
3. Se descarga un archivo .zip con un PDF por cliente.

## El listado

El mismo menú ofrece «Descargar Excel», «Descargar PDF» y «Enviar por correo» con la lista de clientes. Ver [[exportar]].

> La exportación respeta los filtros activos: si filtró los clientes activos, solo salen esos.`,
    relacionados: ['ficha-cliente', 'exportar'],
  },

  // ---------------------------------------------------------------------------
  // Inventario
  // ---------------------------------------------------------------------------
  {
    id: 'consultar-stock',
    titulo: 'Consultar el stock y sus niveles',
    resumen: 'Ver cuánto hay de cada producto y cuáles están en nivel crítico.',
    categoria: 'inventario',
    roles: ['administrador', 'recepcionista'],
    palabras: ['existencias', 'productos', 'crítico', 'sobrestock', 'valorización'],
    captura: { archivo: '11-inventario.png', descripcion: 'La pantalla de Inventario' },
    cuerpo: `La pantalla Inventario muestra arriba tres indicadores: «Productos», «En nivel crítico» y «Valorización» (lo que vale el stock).

## Los niveles

Cada producto tiene un nivel según su stock mínimo y máximo:

- **Crítico**: está en el mínimo o por debajo. Genera una alerta.
- **Disponible**: entre el mínimo y el máximo.
- **Sobrestock**: por encima del máximo.

Si hay productos críticos, la pantalla avisa: «…Conviene generar una orden de compra…». Ver [[crear-orden-compra]].

## Ver un producto

Presione el ícono de ojo: se ven el stock, el mínimo, el máximo, el nivel, el precio, el rendimiento por unidad de compra y los últimos 30 movimientos. Desde ahí también se registra un movimiento ([[registrar-movimiento-stock]]).

## Filtrar y exportar

Busque por nombre, filtre por nivel de stock y exporte el inventario. Ver [[exportar]].`,
    relacionados: ['registrar-movimiento-stock', 'alertas-de-stock', 'crear-producto'],
  },
  {
    id: 'crear-producto',
    titulo: 'Crear un producto',
    resumen: 'Dar de alta un producto con su unidad de compra, su unidad de uso y su stock mínimo.',
    categoria: 'inventario',
    roles: ['administrador', 'recepcionista'],
    palabras: ['nuevo producto', 'insumo', 'equivalencia', 'unidades', 'categoría de producto'],
    cuerpo: `1. En Inventario, presione «Nuevo producto».
2. Complete «Nombre» y «Categoría».
3. Cargue la «Unidad de compra» (por ejemplo, frasco), la «Unidad de consumo» (por ejemplo, ml) y la «Equivalencia» (cuántas unidades de consumo trae una de compra: 1 frasco = 500 ml).
4. Cargue el «Precio unitario», el «Stock mínimo» y, si quiere, el «Stock máximo».
5. Deje encendido «Producto activo» y guarde.

El producto nace con **stock 0**. Para cargar lo que ya tiene en el local, registre una entrada o un ajuste: [[registrar-movimiento-stock]].

## Por qué importa la equivalencia

Al recibir una orden de compra, el sistema convierte la unidad de compra en unidad de consumo. Las recetas de los servicios descuentan en unidad de consumo.

## Mensajes que puede ver

- «El stock máximo debe ser mayor o igual al mínimo.»
- «La equivalencia debe ser mayor a cero.»
- «El precio no puede ser negativo.»

> El stock actual no se edita desde este formulario: al editar verá «Stock actual: N. Para corregirlo, registre un movimiento de ajuste…».

> Las categorías de producto las crea y edita solo el administrador, desde la tarjeta de categorías de esta misma pantalla, con «Nueva categoría».`,
    relacionados: ['registrar-movimiento-stock', 'consultar-stock', 'receta-servicio'],
  },
  {
    id: 'registrar-movimiento-stock',
    titulo: 'Registrar una entrada, una salida o un ajuste de stock',
    resumen: 'Corregir el stock a mano cuando llega mercadería, se rompe algo o se hace un conteo.',
    categoria: 'inventario',
    roles: ['administrador', 'recepcionista'],
    palabras: ['ajustar stock', 'conteo', 'merma', 'rotura', 'entrada', 'salida', 'corregir stock'],
    cuerpo: `1. En Inventario, abra el producto con el ícono de ojo.
2. Presione «Registrar movimiento».
3. Elija el «Tipo»: «Entrada: llegó mercadería sin orden de compra», «Salida: merma, rotura o uso interno» o «Ajuste: corregir según lo que se contó».
4. Escriba la «Cantidad». En un ajuste, escriba lo que **contó**: el sistema registra la diferencia.
5. Escriba el «Motivo».
6. Presione «Guardar movimiento», o «Volver» para salir sin guardar.

## Mensajes que puede ver

- «Escriba el motivo.»: mínimo 3 caracteres.
- «Indique una cantidad mayor a cero.»: en el ajuste se acepta 0.
- «El conteo coincide con el stock del sistema: no hay nada que ajustar.»
- «El stock disponible no alcanza…»: una salida no puede dejar el stock negativo.

> La mercadería que llega con orden de compra no se carga aquí: entra sola cuando el administrador marca la orden como recibida. Ver [[crear-orden-compra]].`,
    relacionados: ['movimientos-de-inventario', 'consultar-stock', 'falta-stock-al-completar'],
  },
  {
    id: 'alertas-de-stock',
    titulo: 'Las alertas de stock',
    resumen: 'Qué es una alerta de stock, dónde aparece y cómo marcarla resuelta.',
    categoria: 'inventario',
    roles: ['administrador', 'recepcionista'],
    palabras: ['aviso', 'mínimo', 'campana', 'crítico', 'reponer'],
    cuerpo: `Cuando un producto cae a su stock mínimo, el sistema genera una alerta sola. La ve en:

- la tarjeta de alertas de Inventario;
- la bandeja de Notificaciones, a la que lleva la campanita del encabezado ([[bandeja-de-notificaciones]]);
- el Tablero del administrador y los Reportes (Stock crítico).

## Qué hacer

1. Reponga el producto: con una orden de compra ([[crear-orden-compra]]) o registrando una entrada ([[registrar-movimiento-stock]]).
2. En Inventario, presione «Marcar resuelta» en la alerta que figura «Sin resolver».

> Si el stock vuelve a caer al mínimo, aparece una alerta nueva.`,
    relacionados: ['consultar-stock', 'bandeja-de-notificaciones'],
  },
  {
    id: 'movimientos-de-inventario',
    titulo: 'Consultar los movimientos de inventario',
    resumen: 'Ver quién movió el stock, cuándo y por qué.',
    categoria: 'inventario',
    roles: ['administrador', 'recepcionista'],
    palabras: ['historial de stock', 'entradas', 'salidas', 'ajustes', 'trazabilidad'],
    cuerpo: `La tabla de movimientos de Inventario lista cada cambio de stock: tipo, producto, cantidad, motivo, fecha y quién lo hizo.

## Filtrar

- Busque por producto o por motivo.
- Filtre por fecha.
- Filtre por tipo: Entrada, Salida o Ajuste.

## De dónde salen los movimientos

- **Entrada**: una orden de compra recibida o una entrada manual.
- **Salida**: los insumos confirmados al completar un turno, o una salida manual por merma o rotura.
- **Ajuste**: una corrección después de contar.

Los últimos 30 movimientos de un producto también se ven en su ficha, con el ícono de ojo.`,
    relacionados: ['registrar-movimiento-stock', 'completar-turno'],
  },

  // ---------------------------------------------------------------------------
  // Avisos y recordatorios
  // ---------------------------------------------------------------------------
  {
    id: 'bandeja-de-notificaciones',
    titulo: 'La bandeja de notificaciones',
    resumen: 'Revisar lo que pide atención: recordatorios que no salieron y alertas de stock.',
    categoria: 'notificaciones',
    roles: ['administrador', 'recepcionista'],
    palabras: ['campana', 'campanita', 'avisos', 'pendientes', 'alertas'],
    cuerpo: `La campanita del encabezado muestra cuántas cosas piden atención y lleva a Notificaciones.

## La Bandeja

- **Recordatorios que no salieron**: el cliente no tenía correo o el envío falló. Ábralos con el ícono de ojo. Ver [[reintentar-recordatorio]].
- **Alertas de stock**: productos en su mínimo, con el enlace «Ir a inventario». Ver [[alertas-de-stock]].

## Próximos recordatorios

Lista los turnos de los próximos 7 días con el correo del cliente, cuándo sale su recordatorio («Sale a partir de» o «En la próxima pasada») y su estado, por ejemplo «Programado».

> Los recordatorios salen solos cada 10 minutos. La anticipación la define el administrador: [[configurar-recordatorios]].

Para ver todo lo que se envió, use [[historial-de-envios]].`,
    relacionados: ['reintentar-recordatorio', 'historial-de-envios', 'guia-recordatorio-que-no-sale'],
  },
  {
    id: 'reintentar-recordatorio',
    titulo: 'Reintentar un recordatorio que no salió',
    resumen: 'Volver a mandar el recordatorio de un turno cuando falló o el cliente no tenía correo.',
    categoria: 'notificaciones',
    roles: ['administrador', 'recepcionista'],
    palabras: ['reenviar', 'correo', 'falló', 'sin correo', 'recordatorio'],
    cuerpo: `1. Si el problema era **Sin correo**, primero cargue el correo en la ficha del cliente ([[editar-o-desactivar-cliente]]). Si no, el reintento vuelve a quedar Sin correo.
2. En Notificaciones, abra el recordatorio desde la Bandeja con el ícono de ojo.
3. Presione «Volver a intentar».

Verá: «Quedó en cola. Sale en la próxima pasada… dentro de diez minutos como mucho.»

## Cuándo se puede

Solo se reintenta un **recordatorio por correo** que falló o que no tenía correo, de un turno que todavía no pasó.

## Mensajes que puede ver

- «El turno ya pasó o no está vigente…»
- «Solo se puede reintentar un recordatorio que falló o que no tenía correo.»

> El sistema reintenta solo los envíos que fallan, hasta un tope. «Volver a intentar» reinicia esa cuenta.`,
    relacionados: ['bandeja-de-notificaciones', 'guia-recordatorio-que-no-sale'],
  },
  {
    id: 'historial-de-envios',
    titulo: 'El historial de envíos',
    resumen: 'Consultar todos los correos y avisos que el sistema mandó a los clientes.',
    categoria: 'notificaciones',
    roles: ['administrador', 'recepcionista'],
    palabras: ['correos enviados', 'avisos', 'push', 'mensajes', 'notificaciones enviadas'],
    cuerpo: `En Notificaciones, el «Historial de envíos» lista cada aviso que salió o intentó salir.

## Filtrar

- Busque por cliente, correo o mensaje.
- Filtre por fecha.
- Filtre por «Estado»: Enviado, En cola, Falló, Sin correo o Sin app.
- Filtre por «Tipo»: Recordatorio por correo, Confirmación por correo, o Aviso: turno confirmado / cancelado / reprogramado.

## Ver un envío

Con el ícono de ojo se ve el destino, las fechas, el mensaje o el error, y el turno, con el enlace «Ver en la agenda».

> «Sin app» significa que el aviso era para la app del teléfono y el cliente no la tiene instalada. No es un error.

> Confirmar, cancelar o reprogramar un turno genera avisos al cliente. Lo que hace el propio cliente no le genera aviso.`,
    relacionados: ['bandeja-de-notificaciones', 'reintentar-recordatorio'],
  },

  // ---------------------------------------------------------------------------
  // Catálogos
  // ---------------------------------------------------------------------------
  {
    id: 'datos-generales',
    titulo: 'Datos generales',
    resumen: 'La portada de los catálogos: cuántos registros hay y dónde se administra cada uno.',
    categoria: 'catalogos',
    roles: ['administrador', 'recepcionista'],
    palabras: ['catálogos', 'resumen', 'maestros'],
    cuerpo: `«Datos generales» → «Resumen», en la barra lateral, muestra una tarjeta por catálogo con su cantidad de registros: Clientes, Servicios, Categorías de servicio, Barberos, Productos, Categorías de producto, Proveedores y Métodos de pago.

Haga clic en una tarjeta para ir a la pantalla donde se administra ese catálogo. Esta pantalla no edita nada.

> La recepcionista solo ve las tarjetas de lo que puede abrir. Proveedores y Métodos de pago los administra el administrador.

## Quién cambia qué

- **Clientes y Productos**: recepcionista y administrador.
- **Servicios, Barberos y sus categorías**: solo el administrador. La recepcionista los consulta ([[consultar-servicios-y-barberos]]).
- **Proveedores y Métodos de pago**: solo el administrador.`,
    relacionados: ['registrar-cliente', 'crear-producto', 'consultar-servicios-y-barberos'],
  },
  {
    id: 'consultar-servicios-y-barberos',
    titulo: 'Consultar servicios y barberos',
    resumen: 'Ver el catálogo de servicios, sus recetas y el equipo, en modo consulta.',
    categoria: 'catalogos',
    roles: ['recepcionista'],
    palabras: ['precios', 'duración', 'catálogo', 'equipo', 'receta'],
    captura: { archivo: '06-servicios.png', descripcion: 'El catálogo de servicios' },
    cuerpo: `La recepcionista puede ver Servicios y Barberos para responder consultas y agendar, pero no modificarlos: esas pantallas no muestran botones de alta, edición ni borrado.

## Servicios

- Busque por nombre o descripción y filtre por categoría o estado.
- Con el ícono de ojo verá el detalle de los últimos 90 días: veces realizado, facturado, última vez y reparto por barbero.
- Con el ícono de caja verá la receta: qué productos consume el servicio y en qué cantidad.

## Barberos

- Busque por nombre o especialidad y filtre por tipo o estado.
- Verá la especialidad, el tipo de contratación y el estado de cada uno.

> Si un precio, una duración o un barbero está mal cargado, avísele al administrador: él los cambia.

> Un servicio o un barbero inactivo no se ofrece al agendar.`,
    relacionados: ['agendar-turno', 'datos-generales'],
  },
];
