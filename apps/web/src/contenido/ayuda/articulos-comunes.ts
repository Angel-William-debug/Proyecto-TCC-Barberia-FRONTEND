import type { Articulo } from './tipos';

/**
 * Artículos comunes a varios roles (acceso, uso del panel), los del barbero
 * y las guías que cruzan pantallas.
 */

const PERSONAL = ['administrador', 'recepcionista', 'profesional'] as const;
const TODOS = ['administrador', 'recepcionista', 'profesional', 'cliente'] as const;
const MOSTRADOR = ['administrador', 'recepcionista'] as const;

export const ARTICULOS_COMUNES: readonly Articulo[] = [
  // ---------------------------------------------------------------------------
  // Primeros pasos
  // ---------------------------------------------------------------------------
  {
    id: 'ingresar',
    titulo: 'Ingresar al sistema',
    resumen: 'Cómo iniciar sesión con su correo y su contraseña, y a qué pantalla lo lleva el sistema según su rol.',
    categoria: 'primeros-pasos',
    roles: TODOS,
    palabras: ['iniciar sesión', 'login', 'entrar', 'acceso', 'contraseña'],
    captura: { archivo: '01-ingresar.png', descripcion: 'Pantalla «Ingresar».' },
    cuerpo: `Todos ingresan por la misma pantalla: clientes, recepcionistas, barberos y el administrador. No hay un acceso aparte para el personal; el sistema reconoce su rol y lo lleva a su zona.

1. Abra la dirección de la plataforma en el navegador y presione «Ingresar».
2. Escriba su «Correo electrónico» y su «Contraseña». Con el ícono del ojo puede mostrar u ocultar lo que escribe.
3. Presione «Ingresar».

## A dónde lo lleva cada rol

- **Administrador:** al «Tablero».
- **Recepcionista:** a la «Agenda».
- **Barbero:** a «Mi día».
- **Cliente:** a su portal, en «Mis turnos».

> Si llegó a la pantalla de ingreso desde un enlace guardado, al ingresar el sistema lo devuelve a esa pantalla, siempre que su rol pueda verla.

Si olvidó la contraseña, use «¿Olvidó su contraseña?» y siga [[recuperar-contrasena]]. Si el sistema dice que todavía no confirmó su correo, vea [[confirmar-correo]].

> La app del teléfono es solo para clientes. El personal ingresa siempre desde el navegador.`,
    relacionados: ['recuperar-contrasena', 'confirmar-correo', 'mensajes-de-ingreso'],
  },
  {
    id: 'confirmar-correo',
    titulo: 'Confirmar el correo y reenviar la confirmación',
    resumen: 'Por qué hay que abrir el enlace que llega por correo antes de poder ingresar, y cómo pedirlo de nuevo.',
    categoria: 'primeros-pasos',
    roles: TODOS,
    palabras: ['verificar', 'verificación', 'enlace', 'correo no llegó', 'activar cuenta'],
    cuerpo: `Toda cuenta nueva tiene que confirmar su correo antes de poder ingresar. Vale para el cliente que se registra solo y, desde el 11/11/2026, también para las cuentas del personal que crea el administrador.

1. Abra el correo que le envió Barber Shop. Si no lo ve, revise la carpeta de correo no deseado.
2. Presione el enlace. Se abre la página «¡Correo confirmado!».
3. Presione «Ir a iniciar sesión» e ingrese con su correo y su contraseña.

## Si el correo no llegó o el enlace no funciona

El enlace dura una hora y sirve una sola vez. Si venció, la página dice «El enlace ya no sirve».

1. Vaya a «Ingresar» y escriba su correo y su contraseña.
2. El sistema avisa «Todavía no confirmó su correo» y muestra «Reenviar el correo».
3. Presiónelo. El texto cambia a «Se lo volvimos a enviar.» y le llega un enlace nuevo.

> El enlace siempre abre la página web, aunque la cuenta se haya creado desde la app. Una vez confirmada, puede ingresar donde prefiera.`,
    relacionados: ['ingresar', 'mensajes-de-ingreso'],
  },
  {
    id: 'recuperar-contrasena',
    titulo: 'Recuperar la contraseña',
    resumen: 'Cómo elegir una contraseña nueva con el código de 8 números que llega por correo.',
    categoria: 'primeros-pasos',
    roles: TODOS,
    palabras: ['olvidé', 'olvido', 'restablecer', 'código', 'cambiar contraseña'],
    cuerpo: `Si no recuerda su contraseña, puede elegir una nueva con un código que llega a su correo. Son tres pasos en la misma pantalla.

1. En «Ingresar», presione «¿Olvidó su contraseña?».
2. **Paso 1 de 3:** escriba su correo y presione «Enviar código».
3. **Paso 2 de 3:** abra el correo «Su código para restablecer la contraseña de Barber Shop», escriba el código de 8 números y presione «Verificar código».
4. **Paso 3 de 3:** escriba la «Contraseña nueva» dos veces y presione «Guardar e ingresar».

Al guardar, el sistema lo ingresa directamente y lo lleva a la pantalla de su rol.

## Si algo no sale

- **No llegó el código:** espere a que termine la cuenta regresiva y presione «Reenviar código». Solo se envía un código por minuto.
- **«El código no es correcto o ya venció»:** el código dura una hora. Pida uno nuevo.
- **Se equivocó de correo:** presione «Usar otro correo».
- La contraseña nueva necesita al menos 8 caracteres y tiene que ser distinta de la anterior.

> Por seguridad, el sistema responde lo mismo exista o no una cuenta con ese correo. La barbería nunca le va a pedir este código.`,
    relacionados: ['ingresar', 'cambiar-contrasena'],
  },
  {
    id: 'cambiar-contrasena',
    titulo: 'Cambiar la contraseña desde Mi perfil',
    resumen: 'Cómo cambiar su contraseña sin cerrar la sesión, y qué datos de su cuenta puede ver.',
    categoria: 'primeros-pasos',
    roles: PERSONAL,
    palabras: ['perfil', 'mi cuenta', 'contraseña nueva', 'seguridad'],
    cuerpo: `Para llegar a «Mi perfil», toque su nombre al pie de la barra lateral. Ahí ve su nombre, su correo y su rol.

1. En «Contraseña actual», escriba la que usa hoy.
2. Escriba la «Contraseña nueva» y repítala en «Repita la contraseña nueva».
3. Presione «Cambiar contraseña».

Al terminar aparece «Listo: su contraseña cambió». La próxima vez que ingrese, use la nueva.

## Mensajes posibles

- «La contraseña actual no es correcta.»
- «Use al menos 8 caracteres.»
- «La nueva tiene que ser distinta de la actual.»
- «La contraseña nueva es demasiado débil.»: combine letras, números y algún símbolo.

> Su nombre, su correo y su rol no se cambian desde aquí. Si hay que corregirlos, pídaselo al administrador.

Si es barbero, en «Mi perfil» también encuentra el enlace «Ver mi día, mis servicios y mis comisiones».

Si no recuerda la contraseña actual, cierre la sesión y siga [[recuperar-contrasena]].`,
    relacionados: ['recuperar-contrasena'],
  },
  {
    id: 'mensajes-de-ingreso',
    titulo: 'Sesión vencida y mensajes al ingresar',
    resumen: 'Qué significa cada aviso de la pantalla de ingreso y qué hacer en cada caso.',
    categoria: 'primeros-pasos',
    roles: TODOS,
    palabras: ['error', 'no puedo entrar', 'sesión terminó', 'demasiados intentos'],
    cuerpo: `## «El correo o la contraseña no son correctos.»

Revise que el correo esté bien escrito y la contraseña también. El mensaje no dice cuál de los dos falló, a propósito. Si no la recuerda, siga [[recuperar-contrasena]].

## «Todavía no confirmó su correo.»

Falta abrir el enlace que llegó al crear la cuenta. Presione «Reenviar el correo» y siga [[confirmar-correo]].

## «Demasiados intentos seguidos.»

Espere unos minutos y vuelva a probar.

## «No se pudo conectar con el servidor.»

Revise su conexión a internet e intente de nuevo.

## «Su sesión terminó.»

Por seguridad, la sesión vence después de un tiempo. Ingrese de nuevo: el sistema lo devuelve a la pantalla donde estaba, si su rol puede verla.

## Cuenta desactivada

Si el administrador desactivó su cuenta, no puede ingresar aunque la contraseña sea correcta. Consulte con el administrador.`,
    relacionados: ['ingresar', 'mensajes-frecuentes'],
  },

  // ---------------------------------------------------------------------------
  // Cómo se usa el panel
  // ---------------------------------------------------------------------------
  {
    id: 'moverse-por-el-panel',
    titulo: 'Moverse por el panel',
    resumen: 'La barra lateral, el área de Configuración, la campanita, el tema y cómo salir.',
    categoria: 'uso-del-panel',
    roles: PERSONAL,
    palabras: ['menú', 'barra lateral', 'navegar', 'salir', 'cerrar sesión', 'tema oscuro', 'campana'],
    cuerpo: `## La barra lateral

A la izquierda está el menú, agrupado según para qué se viene: «Operación» (lo que se usa con el cliente enfrente), «Datos generales», «Inventario y compras», «Informes» y «Administración». Cada rol ve solo las secciones que puede usar; un grupo sin entradas no aparece.

En el teléfono, la barra se abre con el botón de menú de arriba.

## El área de Configuración

El administrador entra a «Configuración» desde el grupo «Administración». Al entrar, la barra cambia por la del área: datos del establecimiento, horarios, métodos de pago, notificaciones, usuarios y roles, papelera y auditoría. Para volver, use «Volver al sistema» arriba de la barra.

La recepcionista no tiene esa área: ve «Papelera» directamente en la barra principal.

## Arriba de la pantalla

- **Búsqueda:** la caja «Buscar en el sistema…» (administrador y recepcionista). Vea [[busqueda-global]].
- **Campanita:** muestra cuántas cosas piden atención (alertas de stock y recordatorios que no salieron) y lleva a «Notificaciones». La ven el administrador y la recepcionista.
- **Ayuda:** el ícono del signo de pregunta abre este centro de ayuda, con el manual de su rol y el botón «Descargar manual (PDF)».
- **Tema:** cambia entre claro y oscuro.
- **«Salir»:** cierra la sesión.

Al pie de la barra está su nombre: tóquelo para abrir «Mi perfil».`,
    relacionados: ['busqueda-global', 'cambiar-contrasena'],
  },
  {
    id: 'busqueda-global',
    titulo: 'Buscar en todo el sistema',
    resumen: 'Cómo encontrar un cliente, un servicio, un producto o un barbero desde la caja del encabezado.',
    categoria: 'uso-del-panel',
    roles: MOSTRADOR,
    palabras: ['buscar', 'encontrar', 'búsqueda'],
    cuerpo: `La caja «Buscar en el sistema…» del encabezado busca a la vez en clientes, servicios, productos y barberos.

1. Escriba al menos dos letras y presione Enter.
2. Los resultados aparecen agrupados, hasta 10 por grupo.
3. Toque un resultado para abrirlo:
   - un cliente abre su ficha;
   - un servicio abre «Servicios» filtrado;
   - un producto abre «Inventario» filtrado;
   - un barbero abre su ficha.

> Si no aparece lo que busca, pruebe con menos letras. Para un cliente, también puede buscar por su teléfono.

En el teléfono, la caja aparece dentro de la misma pantalla de búsqueda.

Para buscar dentro de una sola pantalla, use la caja de búsqueda de esa pantalla. Vea [[buscar-y-filtrar]].`,
    relacionados: ['buscar-y-filtrar'],
  },
  {
    id: 'buscar-y-filtrar',
    titulo: 'Buscar y filtrar en una lista',
    resumen: 'Cómo usar la búsqueda, el rango de fechas, los filtros avanzados y las etiquetas de filtros activos.',
    categoria: 'uso-del-panel',
    roles: PERSONAL,
    palabras: ['filtro', 'chips', 'fecha', 'rango', 'ordenar'],
    cuerpo: `Casi todas las listas del panel tienen la misma barra de filtros arriba de la tabla.

- **Búsqueda:** escriba parte de un nombre, un teléfono o el dato que indique la caja.
- **Rango de fechas:** elija «desde» y «hasta». Cada pantalla indica qué fecha filtra (de alta, de pago, de emisión…).
- **Filtros avanzados:** estado, categoría, barbero, método de pago y otros, según la pantalla. En algunos se pueden marcar varias opciones a la vez.

## Las etiquetas de filtros activos

Debajo de la barra aparece una etiqueta por cada filtro que está aplicado, junto con la cantidad de resultados. Para quitar un filtro, quite su etiqueta.

> Los filtros quedan en la dirección de la página. Si copia el enlace y se lo pasa a otra persona del equipo, ella ve la misma lista filtrada.

Los filtros también afectan lo que se exporta: el Excel o el PDF salen con lo que está a la vista. Vea [[exportar]].`,
    relacionados: ['exportar', 'busqueda-global'],
  },
  {
    id: 'exportar',
    titulo: 'Exportar a Excel o PDF, o enviar por correo',
    resumen: 'Cómo descargar una lista en Excel o PDF, o recibirla en su correo.',
    categoria: 'uso-del-panel',
    roles: PERSONAL,
    palabras: ['descargar', 'excel', 'pdf', 'imprimir', 'correo', 'reporte'],
    cuerpo: `Las listas tienen un botón de exportar a la derecha de la barra de filtros.

1. Aplique los filtros que necesite: se exporta lo que está a la vista, con la búsqueda y el rango de fechas activos.
2. Abra el menú de exportar y elija:
   - «Descargar Excel»;
   - «Descargar PDF»;
   - «Enviar por correo».

> «Enviar por correo» manda el PDF siempre al correo de su propia cuenta, no a un cliente. Al terminar aparece «Enviado a…» con su dirección.

Si la descarga falla, aparece «No se pudo exportar» con el botón «Reintentar».

Algunas pantallas tienen además descargas propias, como la ficha PDF de un cliente o los PDFs individuales en un archivo .zip.`,
    relacionados: ['buscar-y-filtrar'],
  },
  {
    id: 'formularios',
    titulo: 'Completar un formulario',
    resumen: 'Cómo funcionan los paneles de alta y edición, los campos obligatorios y los errores.',
    categoria: 'uso-del-panel',
    roles: MOSTRADOR,
    palabras: ['alta', 'editar', 'guardar', 'campos obligatorios', 'error'],
    cuerpo: `Para dar de alta o editar un registro, el sistema abre un panel a la derecha de la pantalla, sin perder la lista que está atrás.

1. Complete los campos. Los obligatorios están marcados con un asterisco.
2. Presione el botón de guardar. Su texto cambia según la pantalla: «Registrar…», «Crear…» o «Guardar cambios».
3. Para salir sin guardar, presione «Cancelar».

## Si algo está mal

Aparece «Revise los campos marcados.», cada campo con problema muestra su error debajo y el cursor va al primero. Corríjalo y vuelva a guardar.

## Números

Puede escribir los montos con puntos de miles y coma decimal, como se escriben en Paraguay.

## Cambios sin guardar

Si cierra el panel después de cambiar algo, el sistema pregunta si quiere descartar los cambios.

> En las pantallas de Configuración no hay panel: los campos están siempre abiertos y aparece la barra «Hay cambios sin guardar» con «Descartar» y «Guardar cambios».`,
    relacionados: ['borrar-o-desactivar'],
  },
  {
    id: 'borrar-o-desactivar',
    titulo: 'Borrar o desactivar: en qué se diferencian',
    resumen: 'Cuándo conviene desactivar un registro y cuándo borrarlo, y qué pasa en cada caso.',
    categoria: 'uso-del-panel',
    roles: MOSTRADOR,
    palabras: ['eliminar', 'inactivo', 'dar de baja', 'activo', 'papelera'],
    cuerpo: `Clientes, servicios, barberos y productos tienen dos formas de dejar de usarse.

## Desactivar

En el formulario de edición, apague el interruptor «… activo» y guarde.

- El registro sigue en la lista, marcado «Inactivo».
- Deja de ofrecerse al agendar, al cobrar o al cargar consumos.
- Conserva todo su historial.
- Se vuelve a activar con el mismo interruptor.

Es lo indicado para un barbero que se fue o un servicio que ya no se ofrece.

## Borrar

Presione el ícono de la papelera en la fila. El sistema pregunta «¿Borrar…?» y avisa «Se puede restaurar desde la Papelera».

- El registro desaparece de las listas.
- No se elimina de la base: queda en la Papelera.
- Se recupera desde [[papelera]].

Es lo indicado para un registro cargado por error.

> Si el registro está vinculado a otros datos (por ejemplo, un servicio con turnos), puede que el sistema no permita borrarlo. En ese caso, desactívelo.`,
    relacionados: ['papelera', 'formularios'],
  },
  {
    id: 'papelera',
    titulo: 'Restaurar un registro desde la Papelera',
    resumen: 'Cómo recuperar un cliente, un producto u otro registro que se borró.',
    categoria: 'uso-del-panel',
    roles: MOSTRADOR,
    palabras: ['recuperar', 'deshacer borrado', 'borrado', 'restaurar'],
    cuerpo: `Todo lo que se borra va a la Papelera. El administrador la encuentra dentro de «Configuración», en el grupo «Mantenimiento». La recepcionista la ve directamente en la barra lateral.

1. Abra «Papelera».
2. En «Catálogo», elija qué tipo de registro busca.
3. Busque por nombre o filtre por «Fecha de borrado».
4. Presione «Restaurar» en la fila. El registro vuelve a su lista.

## Qué catálogos ve cada rol

- **Recepcionista:** Clientes y Productos.
- **Administrador:** Clientes, Servicios, Barberos, Productos, Proveedores, Categorías de servicio, Categorías de producto y Métodos de pago.

## Si no se puede restaurar

Puede pasar que, mientras tanto, otro registro haya tomado un dato que no se puede repetir. Por ejemplo: «Ese correo ya pertenece a otro cliente». Primero cambie el dato del registro que lo está ocupando y después restaure.

> La Papelera muestra los 200 registros más recientes de cada catálogo. No hay borrado definitivo.`,
    relacionados: ['borrar-o-desactivar'],
  },
  {
    id: 'mensajes-frecuentes',
    titulo: 'Mensajes frecuentes del panel',
    resumen: 'Qué significan «No tiene acceso», «No tiene permisos» y otros avisos comunes.',
    categoria: 'uso-del-panel',
    roles: PERSONAL,
    palabras: ['error', 'permiso', 'acceso denegado', 'no puedo'],
    cuerpo: `## «No tiene acceso» / «Su rol no incluye esta sección del sistema»

Llegó a una pantalla que su rol no usa, normalmente por un enlace guardado o escrito a mano. Vuelva con el menú lateral: ahí aparecen solo las secciones de su rol.

## «No tiene permisos para realizar esta operación.»

La base de datos rechazó la acción porque su rol no puede hacerla. Si cree que la necesita, consulte con el administrador.

## «El registro está vinculado a otros datos…»

No se puede borrar porque otros registros lo usan. Desactívelo en lugar de borrarlo. Vea [[borrar-o-desactivar]].

## «Ya existe… con ese nombre» o «con ese correo»

Ese dato no se puede repetir. Busque el registro existente: puede estar en la lista o en la [[papelera]].

## «Revise los campos marcados.»

Hay campos con errores en el formulario. Vea [[formularios]].

## «Su sesión terminó.»

Ingrese de nuevo. Vea [[mensajes-de-ingreso]].`,
    relacionados: ['borrar-o-desactivar', 'mensajes-de-ingreso'],
  },

  // ---------------------------------------------------------------------------
  // Mi día (barbero)
  // ---------------------------------------------------------------------------
  {
    id: 'mi-dia',
    titulo: 'Mi día',
    resumen: 'Su pantalla de inicio: la agenda de hoy, los servicios que hizo y sus comisiones.',
    categoria: 'mi-dia',
    roles: ['profesional'],
    palabras: ['inicio', 'mis turnos', 'resumen', 'barbero'],
    captura: { archivo: '19-mi-dia.png', descripcion: 'Pantalla «Mi día» del barbero.' },
    cuerpo: `Al ingresar, el barbero llega a «Mi día». El encabezado lo saluda por su nombre.

## Los indicadores

- **Turnos de hoy:** cuántos tiene agendados hoy.
- **Servicios, 30 días:** cuántos hizo en el último mes.
- **Comisión pendiente:** lo que todavía no le liquidaron.
- **Liquidado, 30 días:** lo que le pagaron en el último mes.

## Las secciones

- **«Mi agenda de hoy»:** sus turnos del día. «Ver en la agenda» abre la Agenda filtrada por usted. Vea [[agenda-del-barbero]].
- **«Mis servicios realizados»:** fecha, servicio, cliente y monto cobrado.
- **«Mis comisiones pendientes»:** «Ver todas» lleva a Comisiones. Vea [[mis-comisiones]].

> «Mi día» es solo para consultar. Agendar, completar y cobrar los turnos lo hace el mostrador.

Si la pantalla dice «Su cuenta no tiene una ficha de barbero», vea [[sin-ficha-de-barbero]].`,
    relacionados: ['agenda-del-barbero', 'mis-comisiones', 'sin-ficha-de-barbero'],
  },
  {
    id: 'sin-ficha-de-barbero',
    titulo: '«Su cuenta no tiene una ficha de barbero»',
    resumen: 'Qué significa este aviso en Mi día y quién lo resuelve.',
    categoria: 'mi-dia',
    roles: ['profesional'],
    palabras: ['ficha', 'vincular', 'no veo mis turnos', 'error mi día'],
    cuerpo: `Su usuario (con el que ingresa) y su ficha de barbero (con la que se agendan los turnos y se calculan las comisiones) son dos registros distintos que tienen que estar vinculados.

Si «Mi día» muestra «Su cuenta no tiene una ficha de barbero», su usuario todavía no está vinculado a ninguna ficha. Por eso el sistema no sabe qué turnos y qué comisiones mostrarle.

## Cómo se resuelve

Pídale al administrador que vincule su cuenta desde «Usuarios y roles». Él puede:

- vincularla con la ficha que ya existe en «Barberos», si ya lo habían cargado; o
- crear una ficha nueva con su nombre.

Vea [[vincular-usuario-barbero]].

Una vez vinculada, vuelva a abrir «Mi día»: aparecen sus turnos, sus servicios y sus comisiones.`,
    relacionados: ['mi-dia'],
  },
  {
    id: 'agenda-del-barbero',
    titulo: 'Consultar la agenda',
    resumen: 'Cómo ver los turnos del equipo y los suyos, y qué puede hacer el barbero en la Agenda.',
    categoria: 'mi-dia',
    roles: ['profesional'],
    palabras: ['turnos', 'calendario', 'agenda', 'horarios'],
    cuerpo: `El barbero ve la agenda de todo el equipo, para saber cómo viene el día. Es solo para consultar.

## Qué puede hacer

1. Cambiar de vista con «Día», «Semana» o «Mes». En Semana y Mes, muévase con los botones de anterior y siguiente, o vuelva a «Hoy». Al tocar un día, se abre ese día.
2. Ver solo sus turnos con el filtro «Barbero». Para llegar más rápido, use «Ver en la agenda» desde [[mi-dia]]: abre la Agenda ya filtrada por usted.
3. Filtrar por «Estado» o buscar por cliente, teléfono o servicio.
4. Abrir el detalle de un turno con el ícono del ojo: cliente y su teléfono, servicios con su hora y su barbero, total y observaciones.
5. Exportar lo que está viendo. Vea [[exportar]].

## Qué hace el mostrador

El barbero no ve «Nuevo turno», «Confirmar», «Reprogramar», «Cancelar turno», «No asistió» ni «Completar». Todo eso lo hacen la recepcionista o el administrador.

> Cuando el mostrador completa un turno suyo, se genera su comisión. Vea [[mis-comisiones]].`,
    relacionados: ['mi-dia', 'mis-comisiones'],
  },
  {
    id: 'mis-comisiones',
    titulo: 'Mis comisiones',
    resumen: 'Cómo se genera su comisión, qué es pendiente y qué es liquidado, y cómo descargarla.',
    categoria: 'mi-dia',
    roles: ['profesional'],
    palabras: ['comisión', 'pago', 'liquidación', 'cuánto cobro', 'porcentaje'],
    captura: { archivo: '13-comisiones.png', descripcion: 'Pantalla «Comisiones».' },
    cuerpo: `En «Comisiones» el barbero ve solo las suyas.

## Cómo se genera

Cuando el mostrador completa un turno, el sistema calcula su comisión por cada servicio que usted atendió, con el porcentaje cargado en su ficha. La comisión nace en el momento de completar el turno, no al cobrarlo.

## Pendiente y liquidado

- **Pendiente de liquidar:** ya la ganó, pero todavía no se la pagaron.
- **Liquidado:** el administrador ya registró el pago. Una comisión liquidada no se puede modificar.

## Qué puede hacer

- Ver el «Resumen por barbero» con su total a liquidar.
- En el «Detalle», ver cada servicio con fecha, monto cobrado, porcentaje y comisión. Puede filtrar por fecha y por estado.
- Descargar su ficha de liquidación en PDF o exportar el detalle. Vea [[exportar]].

> El botón «Liquidar pendientes» no aparece para el barbero: la liquidación la hace el administrador.

Si cree que falta una comisión, revise en la agenda que el turno figure como «Completado» y consulte con el mostrador.`,
    relacionados: ['mi-dia', 'agenda-del-barbero'],
  },
  {
    id: 'ranking',
    titulo: 'El ranking del equipo',
    resumen: 'Cómo comparar el desempeño de los barberos y qué mide cada criterio.',
    categoria: 'informes',
    roles: ['administrador', 'profesional'],
    palabras: ['ranking', 'desempeño', 'valoración', 'estrellas', 'mejor barbero'],
    captura: { archivo: '15-ranking.png', descripcion: 'Pantalla «Ranking».' },
    cuerpo: `El «Ranking» compara a los barberos activos con un gráfico y una tabla.

1. En «Ordenar por», elija el criterio:
   - «Servicios realizados» (es el criterio por defecto);
   - «Facturación generada»;
   - «Ticket promedio»: cuánto se cobra en promedio por servicio;
   - «Clientes distintos»;
   - «Horas ocupadas»;
   - «Valoración de los clientes».
2. Si quiere, elija un rango de fechas.
3. Lea la tabla: posición, servicios, clientes, facturado, ticket promedio, horas ocupadas, valoración y último servicio.
4. Para guardarlo, expórtelo. Vea [[exportar]].

> El rango de fechas afecta solo a «Horas ocupadas». Las demás columnas usan todo el historial, y la pantalla lo avisa.

## La valoración

Es el promedio de las estrellas (de 1 a 5) que los clientes dan a cada atención completada, desde el historial de su portal o de la app. Un barbero sin calificaciones todavía no tiene valoración.

El barbero ve el ranking completo del equipo, igual que el administrador.`,
    relacionados: ['mis-comisiones'],
  },

  // ---------------------------------------------------------------------------
  // Guías
  // ---------------------------------------------------------------------------
  {
    id: 'guia-turno-a-comision',
    titulo: 'Del turno a la comisión',
    resumen: 'El recorrido completo de un turno: agendarlo, atenderlo, cobrarlo, facturarlo y liquidar la comisión.',
    categoria: 'guias',
    roles: MOSTRADOR,
    palabras: ['proceso', 'flujo', 'paso a paso', 'turno', 'cobro', 'factura', 'comisión'],
    cuerpo: `Este es el camino de un turno, de principio a fin.

1. **Agendar.** En «Agenda», «Nuevo turno»: cliente, día, hora, servicios y barbero. El turno nace «Pendiente». Vea [[agendar-turno]].
2. **Confirmar.** Cuando el cliente confirma, abra el detalle del turno y presione «Confirmar». El cliente con cuenta recibe el aviso.
3. **Completar.** Después de atenderlo, presione «Completar» en la fila y confirme los «Insumos utilizados». En ese momento:
   - se descuentan los productos del stock;
   - se genera la comisión de cada barbero;
   - el turno queda cerrado. Vea [[completar-turno]].
4. **Cobrar.** En «Cobros», «Registrar cobro»: elija el turno y el método de pago. Se cobra el saldo completo. Vea [[registrar-cobro]].
5. **Facturar.** En la fila del cobro pagado, presione «Facturar». El comprobante queda en «Facturas» y se descarga en PDF. Vea [[emitir-factura]].
6. **Liquidar** (solo el administrador). En «Comisiones», «Liquidar pendientes». Vea [[liquidar-comisiones]].

> ! Completar un turno y liquidar una comisión no se pueden deshacer.

> La comisión nace al completar el turno, no al cobrarlo. Un turno completado y todavía no cobrado ya tiene su comisión pendiente.`,
    relacionados: ['agendar-turno', 'completar-turno', 'registrar-cobro', 'emitir-factura', 'liquidar-comisiones'],
  },
  {
    id: 'guia-compra-a-stock',
    titulo: 'De la compra al stock',
    resumen: 'Cómo una orden de compra se convierte en stock y cómo se paga al proveedor.',
    categoria: 'guias',
    roles: ['administrador'],
    palabras: ['proceso', 'compra', 'stock', 'proveedor', 'reponer'],
    cuerpo: `Así se repone un producto, desde la alerta hasta el pago.

1. **Detectar.** Un producto en el mínimo genera una alerta: se ve en la campanita, en «Notificaciones», en el «Tablero» («Pide atención») y en «Inventario», con el aviso de que conviene generar una orden de compra.
2. **Pedir.** En «Compras», «Nueva orden»: proveedor, fecha y una línea por producto con cantidad y precio. Se guarda en estado «Pedido». Vea [[crear-orden-compra]].
3. **Recibir.** Cuando llega la mercadería, abra la orden y presione «Marcar recibida». El stock de cada producto aumenta, convertido de la unidad de compra a la de consumo (por ejemplo, 1 frasco = 500 ml), y queda un movimiento de entrada. Vea [[recibir-orden-compra]].
4. **Pagar.** Con la orden recibida, «Registrar pago»: elija la orden, el método de pago y el monto.

> ! «Marcar recibida» y «Cancelar orden» no se pueden deshacer.

> Si llegó mercadería sin orden de compra, cárguela con un movimiento de entrada en Inventario. Vea [[registrar-movimiento-stock]].`,
    relacionados: ['crear-orden-compra', 'recibir-orden-compra', 'registrar-movimiento-stock'],
  },
  {
    id: 'guia-recordatorio-que-no-sale',
    titulo: 'Cuando un recordatorio no sale',
    resumen: 'Qué hacer si un cliente no recibió el recordatorio de su turno.',
    categoria: 'guias',
    roles: MOSTRADOR,
    palabras: ['recordatorio', 'correo', 'aviso', 'no llegó', 'falló'],
    cuerpo: `El sistema manda solo un recordatorio por correo antes de cada turno. Revisa la cola cada 10 minutos. Si no puede enviarlo, lo deja a la vista.

1. **Detectarlo.** La campanita cuenta los recordatorios que no salieron. Ábrala: lleva a la «Bandeja» de «Notificaciones».
2. **Ver la causa.** Abra el recordatorio con el ícono del ojo. Hay dos casos:
   - **«Sin correo»:** el cliente no tiene correo cargado;
   - **«Falló»:** el envío dio error.
3. **Corregir.** Si faltaba el correo, cárguelo en la ficha del cliente. Vea [[ficha-cliente]].
4. **Reintentar.** Vuelva al recordatorio y presione «Volver a intentar». Queda en cola y sale en la próxima pasada, dentro de diez minutos como mucho. Vea [[reintentar-recordatorio]].

> Solo se puede reintentar el recordatorio de un turno que todavía no pasó.

Si el turno es muy pronto, conviene avisarle al cliente por teléfono.`,
    relacionados: ['reintentar-recordatorio', 'ficha-cliente', 'configurar-recordatorios'],
  },
  {
    id: 'guia-puesta-en-marcha',
    titulo: 'Poner en marcha el sistema',
    resumen: 'El orden recomendado para cargar todo lo necesario antes de empezar a agendar.',
    categoria: 'guias',
    roles: ['administrador'],
    palabras: ['configurar', 'inicio', 'primera vez', 'instalación', 'cargar datos'],
    captura: { archivo: '03-tablero.png', descripcion: 'El «Tablero» del administrador.' },
    cuerpo: `Antes de dar el primer turno, cargue los datos en este orden. Cada paso usa lo que se cargó en el anterior.

1. **Datos del establecimiento:** nombre, RUC, teléfono y dirección. Salen en los comprobantes. Vea [[datos-establecimiento]].
2. **Horarios de atención:** qué días abre y en qué horario. Fuera de esas franjas no se aceptan turnos. Vea [[horarios-atencion]].
3. **Métodos de pago:** con qué se cobra. Tiene que quedar al menos uno habilitado. Vea [[metodos-pago]].
4. **Categorías de servicio y servicios:** con su duración y su precio. Vea [[crear-servicio]].
5. **Categorías de producto y productos:** los insumos, con sus unidades y su stock mínimo. Vea [[crear-producto]].
6. **Recetas:** qué productos consume cada servicio. Vea [[receta-servicio]].
7. **Barberos:** con su porcentaje de comisión. Vea [[registrar-barbero]].
8. **Usuarios del personal:** una cuenta por persona con su rol, y cada barbero vinculado a su ficha. Vea [[crear-usuario]] y [[vincular-usuario-barbero]].
9. **Recordatorios:** con cuánta anticipación se avisa a los clientes. Vea [[configurar-recordatorios]].

> Los clientes se registran solos desde el portal o la app. También los puede cargar la recepción desde «Clientes».`,
    relacionados: ['datos-establecimiento', 'horarios-atencion', 'crear-usuario'],
  },
];
