import type { Articulo } from './tipos';

/**
 * Artículos que solo le sirven al administrador: catálogos, compras,
 * comisiones, informes, configuración, usuarios y auditoría.
 */
export const ARTICULOS_ADMINISTRACION: readonly Articulo[] = [
  // --- Informes ---------------------------------------------------------------
  {
    id: 'tablero',
    titulo: 'Leer el Tablero',
    resumen: 'Qué muestra cada bloque del Tablero y adónde lleva cada enlace.',
    categoria: 'informes',
    roles: ['administrador'],
    palabras: ['inicio', 'resumen', 'indicadores', 'kpi', 'pide atención', 'ingresos del mes'],
    captura: { archivo: '03-tablero.png', descripcion: 'El Tablero del administrador' },
    cuerpo: `El Tablero es la pantalla que se abre al ingresar como administrador. Muestra el mes calendario en curso, en hora de Asunción, y no tiene filtros.

## Los indicadores del mes

- **Ingresos del mes**: la suma de los cobros del mes.
- **Servicios completados**: los turnos cerrados con «Completar».
- **Clientes atendidos**: cuántos clientes distintos pasaron por la barbería.
- **Cancelaciones**: el porcentaje de turnos cancelados.

## Los bloques

- **Hoy**: los próximos seis turnos pendientes o confirmados. El enlace «Agenda» abre la agenda.
- **Pide atención**: lo que alguien tiene que resolver. Cada línea lleva a su pantalla: productos en nivel crítico (Inventario), recordatorios que no salieron (Notificaciones), órdenes de compra esperando entrega (Compras) y comisiones por liquidar (Comisiones). Si no hay nada, dice «Nada urgente».
- **Lo más pedido**: los cinco servicios más solicitados. El enlace «Reportes» abre los reportes completos.
- **Ingresos por mes**: un gráfico con lo cobrado en cada mes.

> Los números salen de las mismas consultas que Reportes, Agenda y Notificaciones, así que siempre coinciden con esas pantallas.`,
    relacionados: ['reportes', 'alertas-de-stock', 'liquidar-comisiones'],
  },
  {
    id: 'reportes',
    titulo: 'Consultar y generar reportes',
    resumen: 'Los indicadores y gráficos de Reportes, y cómo generar un reporte para descargarlo o enviarlo por correo.',
    categoria: 'informes',
    roles: ['administrador'],
    palabras: ['informe', 'estadísticas', 'excel', 'pdf', 'cumpleaños', 'inactivos', 'retención', 'fidelización'],
    captura: { archivo: '14-reportes.png', descripcion: 'La pantalla de Reportes' },
    cuerpo: `Reportes reúne los indicadores del negocio y un generador de reportes exportables.

## Lo que se ve al abrir

- Los indicadores del mes: **Ingresos del período**, **Clientes atendidos**, **Servicios completados** y **Tasa de cancelación**.
- Los gráficos y tablas: «Ingresos por mes», «Stock crítico» (con lo que falta de cada producto), «Comisiones pendientes» por barbero y «Servicios más solicitados».
- «Retención de clientes»: cuántos volvieron, cuántos tienen visitas y cuántos están inactivos, más la lista de clientes frecuentes. Cada cliente lleva a su ficha y el enlace «Ver inactivos» abre ese reporte.

## Generar un reporte

1. Vaya a la sección «Generar reporte».
2. Elija el «Tipo de reporte»: general (indicadores mensuales), clientes, proveedores, cobros, inventario, comisiones liquidadas, comisiones pendientes, clientes inactivos, cumpleaños del mes, barberos, servicios, usuarios, agenda, órdenes de compra, auditoría, ranking o facturas.
3. Si hace falta, acote con «Buscar dentro del reporte» y el rango de fechas.
4. Revise la vista previa, que muestra hasta 50 filas.
5. Use el menú de exportar: «Descargar Excel», «Descargar PDF» o «Enviar por correo». El archivo trae todas las filas, no solo las 50 de la vista previa.

> «Enviar por correo» manda el PDF siempre al correo de su propia cuenta. Si el reporte no tiene filas, aparece «Sin datos para exportar».`,
    relacionados: ['exportar', 'tablero', 'ranking'],
  },

  // --- Catálogos --------------------------------------------------------------
  {
    id: 'crear-servicio',
    titulo: 'Crear, editar o dar de baja un servicio',
    resumen: 'Cómo cargar un servicio con su categoría, duración y precio, y cómo editarlo, desactivarlo o borrarlo.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['nuevo servicio', 'precio', 'duración', 'corte', 'catálogo', 'desactivar servicio'],
    captura: { archivo: '06-servicios.png', descripcion: 'El catálogo de servicios' },
    cuerpo: `El catálogo de servicios es lo que se ofrece al agendar y al reservar desde el portal. Solo el administrador lo modifica; la recepcionista lo consulta.

## Crear un servicio

1. Abra **Servicios** y presione «Nuevo servicio».
2. Complete «Nombre del servicio», «Categoría», «Duración» (en minutos) y «Precio base» (en guaraníes). La «Descripción» es opcional.
3. Deje encendido «Servicio activo» si ya se puede ofrecer.
4. Presione el botón de guardar.

Si todavía no hay categorías, cree una primero: [[categorias-de-servicio]].

## Reglas

- La duración tiene que ser mayor a cero: define cuánto ocupa el turno en la agenda.
- El precio no puede ser negativo.
- No puede haber dos servicios con el mismo nombre dentro de la misma categoría.
- El precio y la duración se copian al turno cuando se agenda: cambiar el precio no afecta los turnos ya dados.

## Editar, desactivar o borrar

- El lápiz abre el mismo formulario para editar.
- Apague «Servicio activo» para dejar de ofrecerlo al agendar sin perder su historial.
- El ícono de ojo muestra los últimos 90 días: veces realizado, facturado, última vez y reparto por barbero.
- La papelera lo borra; se puede restaurar desde [[papelera]].

> Para indicar qué productos consume el servicio, vea [[receta-servicio]].`,
    relacionados: ['categorias-de-servicio', 'receta-servicio', 'borrar-o-desactivar'],
  },
  {
    id: 'categorias-de-servicio',
    titulo: 'Administrar las categorías de servicio',
    resumen: 'Cómo crear, editar y borrar las categorías que agrupan el catálogo de servicios.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['categoría', 'agrupar servicios', 'rubro'],
    cuerpo: `Las categorías agrupan los servicios en la reserva del cliente y en los reportes. Cada servicio pertenece a una.

## Crear una categoría

1. Abra **Servicios** y baje hasta la tarjeta «Categorías de servicio».
2. Presione «Nueva categoría».
3. Escriba el «Nombre» y, si quiere, una «Descripción».
4. Guarde.

## Editar o borrar

- El lápiz de cada fila abre el formulario para cambiar el nombre o la descripción.
- La papelera la borra. Se puede restaurar desde [[papelera]].
- La columna «Servicios» muestra cuántos servicios tiene cada categoría.

> No puede haber dos categorías con el mismo nombre: el sistema avisa «Ya existe una categoría de servicio con ese nombre.»`,
    relacionados: ['crear-servicio'],
  },
  {
    id: 'receta-servicio',
    titulo: 'Cargar la receta de insumos de un servicio',
    resumen: 'Cómo indicar qué productos consume cada servicio para que se descuenten del stock al completar el turno.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['insumos', 'receta', 'consumo', 'productos del servicio', 'descontar stock'],
    cuerpo: `La receta dice qué productos usa un servicio y en qué cantidad. Al completar un turno, el sistema propone esas cantidades en el panel «Insumos utilizados» y, al confirmarlas, las descuenta del stock.

## Agregar un producto a la receta

1. Abra **Servicios** y, en la fila del servicio, presione el ícono de caja («Receta de …»).
2. En «Agregar producto», elija el «Producto», escriba la «Cantidad» y la «Unidad» (por ejemplo ml, g o unidad).
3. Presione «Agregar a la receta». El panel queda abierto para seguir cargando.

## Quitar un producto

1. Presione el ícono de papelera de la línea.
2. Confirme con «Quitar». Ese producto deja de proponerse al cerrar el turno.

## Reglas

- La cantidad tiene que ser mayor a cero.
- Un mismo producto no puede estar dos veces en la misma receta.
- Solo se pueden elegir productos activos de Inventario. Si falta uno, créelo primero: [[crear-producto]].

> La receta es una sugerencia: al completar el turno se pueden ajustar las cantidades realmente usadas. Vea [[completar-turno]].`,
    relacionados: ['completar-turno', 'crear-producto', 'consultar-stock'],
  },
  {
    id: 'registrar-barbero',
    titulo: 'Registrar o editar un barbero',
    resumen: 'Cómo dar de alta a un barbero con su tipo de contratación y su porcentaje de comisión.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['profesional', 'peluquero', 'equipo', 'comisión', 'porcentaje', 'desactivar barbero'],
    captura: { archivo: '07-barberos.png', descripcion: 'El listado de barberos' },
    cuerpo: `Cada barbero tiene una ficha con su comisión. La ficha es distinta de la cuenta de usuario: un barbero puede existir sin cuenta, y la cuenta se vincula después.

## Registrar un barbero

1. Abra **Barberos** y presione «Registrar barbero».
2. Complete «Nombre y apellido».
3. Si quiere, escriba la «Especialidad» y elija el «Tipo de contratación»: Barbero, Barbero senior, Especialista o Externo.
4. Escriba el «Porcentaje por servicio», entre 0 y 100.
5. Deje encendido «Barbero activo» y guarde.

## Cómo se usa el porcentaje

Cada vez que se completa un turno, el sistema calcula la comisión del barbero con ese porcentaje. Las comisiones se ven y se liquidan en [[liquidar-comisiones]].

## Editar, desactivar o borrar

- El lápiz abre el formulario.
- Un barbero inactivo deja de ofrecerse al agendar y al reservar, pero conserva su historial y sus comisiones.
- La papelera lo borra; se restaura desde [[papelera]].

> Para que el barbero ingrese al sistema y vea «Mi día», créele una cuenta: [[vincular-usuario-barbero]].`,
    relacionados: ['vincular-usuario-barbero', 'perfil-del-barbero', 'liquidar-comisiones'],
  },
  {
    id: 'perfil-del-barbero',
    titulo: 'Ver el perfil de un barbero',
    resumen: 'Qué muestra la ficha de un barbero: su agenda de hoy, sus servicios y sus comisiones pendientes.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['ficha del barbero', 'desempeño', 'resumen del barbero'],
    cuerpo: `El perfil reúne en una pantalla lo mismo que el barbero ve en su «Mi día», para consultarlo sin armarlo desde tres pantallas.

1. Abra **Barberos**.
2. Presione el ícono de ojo en la fila del barbero.

## Qué muestra

- Arriba, su especialidad, tipo, porcentaje de comisión y si está activo.
- Indicadores: **Turnos de hoy** (con el próximo), **Servicios, 30 días** (con lo cobrado), **Comisión pendiente** y **Liquidado, 30 días**.
- «Agenda de hoy», con el enlace «Ver en la agenda», que abre la agenda filtrada por ese barbero.
- «Servicios realizados» en los últimos 30 días.
- «Comisiones pendientes», con el enlace «Ver todas», que lleva a Comisiones.

Para volver, use la flecha «Volver a barberos».`,
    relacionados: ['registrar-barbero', 'liquidar-comisiones'],
  },
  {
    id: 'categorias-de-producto',
    titulo: 'Administrar las categorías de producto',
    resumen: 'Cómo crear, editar y borrar las categorías que ordenan el inventario.',
    categoria: 'catalogos',
    roles: ['administrador'],
    palabras: ['categoría de producto', 'rubro', 'insumos', 'inventario'],
    cuerpo: `Las categorías de producto ordenan el inventario. Cada producto pertenece a una. Se administran desde la pantalla **Inventario**.

## Crear una categoría

1. Abra **Inventario** y vaya a la tarjeta de categorías.
2. Presione «Nueva categoría».
3. Escriba el nombre y guarde.

## Editar o borrar

- El lápiz abre el formulario para cambiarla.
- La papelera la borra. Se puede restaurar desde [[papelera]].

> La recepcionista ve las categorías, pero solo el administrador las crea, edita o borra.`,
    relacionados: ['crear-producto', 'consultar-stock'],
  },

  // --- Compras ----------------------------------------------------------------
  {
    id: 'crear-orden-compra',
    titulo: 'Crear una orden de compra',
    resumen: 'Cómo pedir mercadería a un proveedor con una orden de compra.',
    categoria: 'compras',
    roles: ['administrador'],
    palabras: ['pedido', 'comprar', 'reponer stock', 'orden'],
    captura: { archivo: '12-compras.png', descripcion: 'Órdenes de compra y proveedores' },
    cuerpo: `La orden de compra registra lo que se le pide a un proveedor. El stock no cambia al crearla: cambia cuando se marca como recibida.

## Crear la orden

1. Abra **Compras** y presione «Nueva orden».
2. Elija el «Proveedor». Solo aparecen los proveedores activos.
3. Revise la «Fecha del pedido» (por defecto, hoy) y el «Estado» (por defecto, «Pedido»).
4. En cada línea elija el «Producto», la «Cantidad» y el «Precio unitario». El precio se propone desde el catálogo y se puede cambiar.
5. Use «Agregar otro producto» para sumar líneas; el ícono de papelera quita una.
6. Revise el «Total de la orden» y el aviso «Al recibirla, suma … al stock».
7. Presione «Crear orden».

## Mensajes posibles

- «Elija el proveedor.»
- «Agregue al menos un producto.»
- «La cantidad de cada producto debe ser mayor que cero.»
- «El precio no puede ser negativo.»

> Si un producto está en nivel crítico, Inventario y el Tablero lo avisan: es la señal para crear una orden.

El paso siguiente es [[recibir-orden-compra]].`,
    relacionados: ['recibir-orden-compra', 'proveedores', 'guia-compra-a-stock'],
  },
  {
    id: 'recibir-orden-compra',
    titulo: 'Recibir o cancelar una orden de compra',
    resumen: 'Cómo marcar una orden como recibida para que entre el stock, o cancelarla.',
    categoria: 'compras',
    roles: ['administrador'],
    palabras: ['recepción', 'llegó la mercadería', 'anular orden', 'entrada de stock'],
    cuerpo: `Mientras una orden está en estado «Pedido» se puede recibir o cancelar. Las dos acciones son definitivas.

## Marcar la orden como recibida

1. Abra **Compras** y presione el ícono de ojo de la orden.
2. Revise las líneas y presione «Marcar recibida».
3. Confirme. El aviso dice: «El stock de cada producto se suma ahora y no se puede deshacer.»

Al recibirla, cada producto suma su cantidad al stock, convertida de la unidad de compra a la unidad de uso (por ejemplo, 1 frasco = 500 ml), y queda un movimiento de entrada en Inventario.

## Cancelar la orden

1. En el detalle de la orden, presione «Cancelar orden».
2. Confirme. El stock no cambia.

> ! Recibir y cancelar no se pueden deshacer. Si se recibió por error, corrija el stock con un movimiento de ajuste: [[registrar-movimiento-stock]].

Si al confirmar aparece «Esa orden ya no esta pendiente: alguien la recibio o la cancelo», otra persona la cambió mientras tanto: recargue la pantalla.

Después de recibirla ya se puede pagar: [[pagar-proveedor]].`,
    relacionados: ['pagar-proveedor', 'consultar-stock', 'guia-compra-a-stock'],
  },
  {
    id: 'proveedores',
    titulo: 'Administrar los proveedores',
    resumen: 'Cómo crear, editar, desactivar y consultar a los proveedores.',
    categoria: 'compras',
    roles: ['administrador'],
    palabras: ['proveedor', 'distribuidor', 'razón social', 'contacto'],
    cuerpo: `Los proveedores se administran en la pantalla **Compras**.

## Crear un proveedor

1. Presione «Nuevo proveedor».
2. Complete la «Razón social». «Teléfono», «Correo» y «Dirección» son opcionales.
3. Deje encendido «Proveedor activo» y guarde.

## Consultar un proveedor

El ícono de ojo abre su ficha: contacto, total comprado, órdenes esperando entrega y la lista de sus órdenes.

## Desactivar o reactivar

- Para dejar de usarlo, edítelo con el lápiz y apague «Proveedor activo».
- Un proveedor desactivado sigue en la lista, marcado «Inactivo», con todo su historial. Lo único que cambia es que ya no se ofrece al crear una orden.
- Para volver a usarlo, edítelo y encienda «Proveedor activo».

## Borrar

La papelera lo borra; se puede restaurar desde [[papelera]]. Si solo quiere dejar de usarlo, es mejor desactivarlo: vea [[borrar-o-desactivar]].`,
    relacionados: ['crear-orden-compra', 'borrar-o-desactivar'],
  },
  {
    id: 'pagar-proveedor',
    titulo: 'Registrar un pago a un proveedor',
    resumen: 'Cómo registrar lo que se le pagó a un proveedor por una orden recibida.',
    categoria: 'compras',
    roles: ['administrador'],
    palabras: ['pago', 'saldo', 'deuda con proveedor', 'cuenta por pagar'],
    cuerpo: `Los pagos a proveedores se registran sobre órdenes ya recibidas, y pueden hacerse en partes hasta saldar la orden.

1. Abra **Compras** y presione «Registrar pago».
2. Elija la orden. Solo aparecen las órdenes recibidas que todavía tienen saldo.
3. Elija el «Método de pago».
4. Revise el «Monto». Se propone igual al saldo y se puede bajar para pagar una parte.
5. Guarde.

## Mensajes posibles

- «Solo se puede pagar una orden de compra que ya fue recibida.»
- «El monto supera el saldo pendiente de esa orden.»
- «El monto debe ser mayor a cero.»

> Si el botón «Registrar pago» está deshabilitado, no hay órdenes recibidas con saldo pendiente.

El detalle de cada orden (ícono de ojo) muestra lo pagado y el saldo. Los pagos se filtran por fecha y estado en su propia tabla.`,
    relacionados: ['recibir-orden-compra', 'metodos-pago'],
  },

  // --- Comisiones -------------------------------------------------------------
  {
    id: 'liquidar-comisiones',
    titulo: 'Liquidar las comisiones de los barberos',
    resumen: 'Cómo registrar el pago de las comisiones pendientes de uno o de todos los barberos.',
    categoria: 'comisiones',
    roles: ['administrador'],
    palabras: ['pagar comisiones', 'liquidación', 'sueldo', 'porcentaje del barbero'],
    captura: { archivo: '13-comisiones.png', descripcion: 'La pantalla de Comisiones' },
    cuerpo: `Cada turno completado genera una comisión «Pendiente de liquidar» para el barbero que lo atendió, con su porcentaje. Liquidar es registrar que se le pagó.

## Liquidar

1. Abra **Comisiones**. El «Resumen por barbero» muestra lo pendiente de cada uno y el «Total a liquidar».
2. Presione «Liquidar pendientes».
3. Elija un «Barbero», o no elija ninguno para liquidar a todos.
4. Revise la lista y el total.
5. Presione «Confirmar liquidación».

Las comisiones pasan a «Liquidado» con la fecha de hoy.

> ! Una liquidación no se puede deshacer: «Una comisión liquidada no puede modificarse ni revertirse.»

## Consultar el detalle

La tabla «Detalle» tiene una fila por servicio: barbero, servicio, fecha, cobrado, porcentaje y comisión. Se puede buscar por barbero o servicio y filtrar por fecha, barbero y estado.

> La comisión nace al completar el turno, no al cobrarlo. Vea [[guia-turno-a-comision]].

Si no hay nada pendiente, el botón está deshabilitado o aparece «No hay comisiones pendientes para liquidar.»`,
    relacionados: ['fichas-de-liquidacion', 'guia-turno-a-comision', 'mis-comisiones'],
  },
  {
    id: 'fichas-de-liquidacion',
    titulo: 'Descargar las fichas de liquidación',
    resumen: 'Cómo bajar el PDF de liquidación de un barbero o de todos en un .zip.',
    categoria: 'comisiones',
    roles: ['administrador'],
    palabras: ['pdf de comisiones', 'comprobante de liquidación', 'zip', 'recibo del barbero'],
    cuerpo: `La ficha de liquidación es un PDF con las comisiones pendientes de un barbero, para entregárselo o archivarlo.

## La ficha de un barbero

1. Abra **Comisiones**.
2. En el «Resumen por barbero», presione el ícono de descarga de la fila del barbero.

## Las fichas de todos

1. En el «Resumen por barbero», abra el menú de exportar.
2. Elija «PDFs individuales por barbero (.zip)». Se descarga un archivo comprimido con una ficha por barbero.

## Mensajes posibles

- «Ese barbero no tiene comisiones pendientes de liquidar.»
- «No hay comisiones pendientes para exportar.»

> Las fichas muestran lo pendiente. Conviene descargarlas antes de liquidar, porque después de liquidar ya no hay pendientes.

El mismo menú permite descargar el resumen en Excel o PDF, o enviarlo por correo: [[exportar]].`,
    relacionados: ['liquidar-comisiones', 'exportar'],
  },

  // --- Configuración ----------------------------------------------------------
  {
    id: 'datos-establecimiento',
    titulo: 'Cargar los datos de la barbería',
    resumen: 'Cómo cargar el nombre, RUC, dirección y contacto que aparecen en comprobantes y reportes.',
    categoria: 'configuracion',
    roles: ['administrador'],
    palabras: ['ruc', 'empresa', 'nombre de la barbería', 'dirección', 'moneda', 'establecimiento'],
    captura: { archivo: '17-configuracion.png', descripcion: 'Datos del establecimiento' },
    cuerpo: `Los datos del establecimiento identifican a la barbería en los comprobantes, en los reportes y en el portal del cliente.

1. Abra **Configuración**. La primera pantalla es «Datos del establecimiento».
2. Complete o corrija los campos: «Nombre de la barbería», «RUC» (con guion y dígito verificador), «Teléfono», «Dirección», «Correo», «Moneda» y «Zona horaria».
3. Al primer cambio aparece la barra «Hay cambios sin guardar».
4. Presione «Guardar cambios», o «Descartar» para volver a lo que estaba.

El sistema confirma con «Los cambios se guardaron.»

## Mensajes posibles

- «Escriba el nombre de la barbería.»
- «La moneda se escribe con tres letras: PYG.»
- «El correo no tiene un formato válido.»

> Los campos están siempre abiertos: no hay botón «Editar». Si intenta salir con cambios sin guardar, el navegador avisa.

Para volver al resto del sistema use «Volver al sistema», arriba de la barra lateral.`,
    relacionados: ['horarios-atencion', 'metodos-pago', 'guia-puesta-en-marcha'],
  },
  {
    id: 'horarios-atencion',
    titulo: 'Definir los horarios de atención',
    resumen: 'Cómo indicar qué días abre la barbería y en qué horario, para que solo se den turnos dentro de él.',
    categoria: 'configuracion',
    roles: ['administrador'],
    palabras: ['horario', 'apertura', 'cierre', 'días de atención', 'feriado', 'cerrado'],
    cuerpo: `El horario de atención limita los turnos que se pueden dar en la Agenda y los que el cliente puede reservar desde el portal y la app.

1. Abra **Configuración** y elija «Horarios de atención».
2. Para cada día, use el interruptor «Abierto» o «Cerrado».
3. En los días abiertos, fije la «Apertura» y el «Cierre».
4. Presione «Guardar cambios». Se guardan los siete días juntos.

## Reglas

- «Falta la hora de apertura.» / «Falta la hora de cierre.»
- «El cierre tiene que ser posterior a la apertura.» Se exige también en los días cerrados, por eso sus horas siguen editables.

## Qué cambia en el resto del sistema

- Un día cerrado no ofrece horarios al reservar: el cliente lee «Ese día la barbería no atiende.»
- Un turno fuera de horario se rechaza con «Ese horario queda fuera del horario de atención de la barbería.»
- El cliente ve este horario en su perfil del portal.`,
    relacionados: ['datos-establecimiento', 'guia-puesta-en-marcha'],
  },
  {
    id: 'metodos-pago',
    titulo: 'Administrar los métodos de pago',
    resumen: 'Cómo crear un método de pago y elegir cuáles se ofrecen al cobrar.',
    categoria: 'configuracion',
    roles: ['administrador'],
    palabras: ['efectivo', 'tarjeta', 'transferencia', 'forma de pago', 'medio de pago'],
    cuerpo: `Los métodos de pago son los que se ofrecen al registrar un cobro y al pagar a un proveedor.

## Crear un método

1. Abra **Configuración** y elija «Métodos de pago».
2. Presione «Nuevo método de pago».
3. Escriba el «Nombre» (al menos tres letras) y presione «Crear método». Nace habilitado.

## Habilitar o deshabilitar

1. Use el interruptor de cada método. La descripción cambia entre «Se ofrece al cobrar» y «No se ofrece al cobrar».
2. Presione «Guardar cambios».

## Reglas

- «Tiene que quedar habilitado al menos un método de pago, o no se podrá cobrar.»
- No puede haber dos con el mismo nombre: «Ya existe un método de pago con ese nombre.»
- Deshabilitar un método no cambia los cobros ya hechos con él.

> Desde esta pantalla no se borra ni se renombra un método: si ya no se usa, deshabilítelo.`,
    relacionados: ['registrar-cobro', 'pagar-proveedor'],
  },
  {
    id: 'configurar-recordatorios',
    titulo: 'Configurar los recordatorios de turno',
    resumen: 'Cómo fijar con cuánta anticipación se avisa al cliente y cuántas veces se reintenta si falla.',
    categoria: 'configuracion',
    roles: ['administrador'],
    palabras: ['recordatorio', 'aviso', 'correo automático', 'anticipación', 'notificación'],
    cuerpo: `El sistema le recuerda el turno al cliente por correo y, si usa la app, en el teléfono. Aquí se fija cuándo.

1. Abra **Configuración** y elija «Notificaciones».
2. En «Se avisa con esta anticipación», escriba los minutos antes del turno. Por ejemplo, 1440 son 24 horas y 120 son 2 horas.
3. En «Reintentos si el aviso falla», indique cuántas veces se vuelve a probar.
4. Presione «Guardar cambios».

## Reglas

- Los dos valores tienen que ser cero o más.
- **Cero en la anticipación desactiva el recordatorio.**
- Los recordatorios salen solos, en pasadas cada diez minutos.

> Un recordatorio que no salió aparece en la bandeja de Notificaciones, donde se puede reintentar a mano.`,
    relacionados: ['datos-establecimiento'],
  },

  // --- Usuarios y auditoría ---------------------------------------------------
  {
    id: 'crear-usuario',
    titulo: 'Crear la cuenta de una persona del personal',
    resumen: 'Cómo crear un usuario con su rol y su contraseña inicial.',
    categoria: 'usuarios',
    roles: ['administrador'],
    palabras: ['alta de usuario', 'cuenta nueva', 'rol', 'recepcionista', 'acceso', 'contraseña inicial'],
    captura: { archivo: '16-usuarios.png', descripcion: 'Usuarios y roles' },
    cuerpo: `Las cuentas del personal las crea el administrador. Los clientes no: se registran solos desde el portal o la app.

1. Abra **Configuración** y elija «Usuarios y roles».
2. Presione «Crear usuario».
3. Complete «Nombre completo» y «Correo».
4. Escriba una contraseña inicial en «Contraseña» y repítala en «Repetir contraseña». Tiene que tener al menos 8 caracteres.
5. Elija el «Rol»: administrador, recepcionista o barbero.
6. Si el rol es barbero, aparece «Ficha de barbero»: vea [[vincular-usuario-barbero]].
7. Guarde.

## Después de crearla

- El sistema avisa: «Usuario creado. Le enviamos a … un correo para verificar su cuenta: hasta que lo abra no puede ingresar.»
- Entregue la contraseña inicial a la persona. Conviene que la cambie desde su perfil.
- Si el correo no le llegó, puede pedirlo de nuevo con «Reenviar el correo» en la pantalla de ingreso.

## Mensajes posibles

- «Las dos contraseñas no coinciden.»
- «Ya existe una cuenta con ese correo.»

> No se envían invitaciones: la contraseña inicial la fija usted y la entrega en mano.`,
    relacionados: ['vincular-usuario-barbero', 'editar-o-desactivar-usuario'],
  },
  {
    id: 'vincular-usuario-barbero',
    titulo: 'Vincular la cuenta de un barbero con su ficha',
    resumen: 'Cómo unir la cuenta de usuario de un barbero con su ficha para que vea «Mi día» y sus comisiones.',
    categoria: 'usuarios',
    roles: ['administrador'],
    palabras: ['ficha de barbero', 'cuenta del barbero', 'mi día', 'vincular', 'asociar'],
    cuerpo: `Un barbero necesita dos cosas: una ficha en **Barberos** (con su comisión) y una cuenta de usuario para ingresar. El vínculo entre las dos se hace al crear la cuenta.

1. En «Usuarios y roles», presione «Crear usuario» y complete los datos.
2. Elija el rol barbero. Aparece el campo «Ficha de barbero».
3. Elija una de dos opciones:
   - «Crear su ficha nueva con este nombre», si el barbero todavía no está cargado.
   - Un barbero de la lista, marcado «(ya cargado en Barberos, sin cuenta)», si ya tiene ficha.
4. Guarde.

Desde ese momento, al ingresar ve **Mi día**, **Agenda**, **Comisiones** y **Ranking**.

## Mensajes posibles

- «Ese barbero ya tiene una cuenta. Elija otro o cree una ficha nueva.»

> Si un barbero entra y ve «Su cuenta no tiene una ficha de barbero», le falta este vínculo. Vea [[sin-ficha-de-barbero]].

En el detalle del usuario (ícono de ojo) aparece el enlace «Ver su perfil de barbero».`,
    relacionados: ['crear-usuario', 'registrar-barbero', 'sin-ficha-de-barbero'],
  },
  {
    id: 'editar-o-desactivar-usuario',
    titulo: 'Cambiar el rol o desactivar un usuario',
    resumen: 'Cómo cambiar el rol de una persona, quitarle el acceso y consultar qué permisos tiene cada rol.',
    categoria: 'usuarios',
    roles: ['administrador'],
    palabras: ['quitar acceso', 'bloquear', 'dar de baja', 'permisos', 'cambiar rol', 'despido'],
    cuerpo: `## Cambiar el rol o desactivar

1. En «Usuarios y roles», presione el lápiz de la persona.
2. Cambie el «Rol», o apague «Usuario activo» para quitarle el acceso.
3. Guarde.

Un usuario inactivo conserva su cuenta y su historial, pero no puede iniciar sesión. Para devolverle el acceso, vuelva a encender «Usuario activo».

> Nombre y correo no se cambian desde aquí: aparecen deshabilitados. Los usuarios no se borran, solo se desactivan.

## Ver el detalle de un usuario

El ícono de ojo muestra:

- si verificó el correo, su último ingreso y cuántas acciones tiene registradas;
- el enlace «Ver su perfil de barbero», si es barbero;
- «Última actividad»: hasta 20 acciones, cada una con un enlace al registro que tocó.

## Permisos por rol

Debajo del listado está la matriz «Permisos por rol», de solo lectura. Muestra qué sección alcanza cada rol. Los roles son fijos y la base de datos hace cumplir estos permisos aunque alguien escriba la dirección a mano.`,
    relacionados: ['crear-usuario', 'auditoria'],
  },
  {
    id: 'auditoria',
    titulo: 'Consultar la auditoría',
    resumen: 'Cómo saber quién cambió qué y cuándo, y abrir el registro afectado.',
    categoria: 'usuarios',
    roles: ['administrador'],
    palabras: ['historial de cambios', 'quién modificó', 'registro', 'log', 'trazabilidad'],
    captura: { archivo: '18-auditoria.png', descripcion: 'La pantalla de Auditoría' },
    cuerpo: `La auditoría registra sola cada alta, modificación y baja. No se puede borrar ni editar.

1. Abra **Configuración** y elija «Auditoría».
2. Busque por usuario o detalle, o filtre por fecha, por tabla y por acción («Alta», «Modificación» o «Baja»).
3. Presione el ícono de ojo de un movimiento para ver el detalle.

## El detalle

- Qué pasó y el detalle completo del cambio.
- «Historia de este registro»: todos los cambios de ese mismo registro, en orden.
- El enlace «Abrir» lleva a la pantalla del registro: un turno abre la agenda de ese día y un cliente abre su ficha.

> La lista muestra los 200 movimientos más recientes que cumplen el filtro. Para ver más atrás, acote las fechas.

El registro también se puede descargar: [[exportar]].`,
    relacionados: ['editar-o-desactivar-usuario', 'exportar'],
  },
];
