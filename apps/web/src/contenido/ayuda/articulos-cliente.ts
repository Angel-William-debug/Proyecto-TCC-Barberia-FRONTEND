import type { Articulo } from './tipos';

/**
 * Artículos para el cliente: el portal web (`/mi-cuenta`) y la app del
 * teléfono. Lenguaje simple y sin términos internos del sistema.
 */
export const ARTICULOS_CLIENTE: readonly Articulo[] = [
  // --- Primeros pasos -------------------------------------------------------
  {
    id: 'crear-cuenta',
    titulo: 'Crear su cuenta',
    resumen: 'Cómo registrarse para reservar turnos y confirmar su correo.',
    categoria: 'primeros-pasos',
    roles: ['cliente'],
    palabras: ['registrarse', 'registro', 'alta', 'cuenta nueva', 'inscribirse'],
    captura: { archivo: '02-crear-cuenta.png', descripcion: 'Formulario para crear una cuenta' },
    cuerpo: `Con una cuenta puede reservar turnos, ver su historial y recibir recomendaciones. Se crea una sola vez y sirve igual en la página web y en la app del teléfono.

## Pasos

1. En la página principal, toque «Crear cuenta».
2. Complete «Nombre y apellido», «Correo electrónico», «Teléfono», «Contraseña» y «Repetir contraseña».
3. Toque «Crear cuenta».
4. Aparece «Revise su correo»: le enviamos un enlace de confirmación.
5. Abra ese correo y toque el enlace. Se abre la página «¡Correo confirmado!».
6. Toque «Ir a iniciar sesión» y entre con su correo y su contraseña.

## Lo que pide cada campo

- El nombre, al menos 3 letras.
- Un teléfono de contacto, al menos 6 números.
- Una contraseña de al menos 8 caracteres, escrita igual las dos veces.

> Hasta que abra el enlace del correo no puede ingresar. Si no lo ve, revise la carpeta de correo no deseado. El enlace dura una hora; si venció, lea [[confirmar-correo]].

> Si ya tenía una cuenta con ese correo, no le llega un correo nuevo. En ese caso use «¿Olvidó su contraseña?» desde [[recuperar-contrasena]].`,
    relacionados: ['ingresar', 'confirmar-correo', 'reservar-turno'],
  },

  // --- Reservas ------------------------------------------------------------
  {
    id: 'reservar-turno',
    titulo: 'Reservar un turno',
    resumen: 'Elegir servicios, día, barbero y hora para pedir un turno.',
    categoria: 'reservas',
    roles: ['cliente'],
    palabras: ['cita', 'reserva', 'pedir turno', 'agendar', 'sacar turno', 'horario'],
    captura: { archivo: '21-portal-reservar.png', descripcion: 'Pantalla para reservar un turno' },
    cuerpo: `Desde «Reservar» pide un turno en pocos pasos. Los horarios que ve son los que de verdad están libres.

## Pasos

1. Entre a «Reservar». Se abre la pestaña «Formulario».
2. En «Servicios», elija uno o más. Si elige varios, se atienden seguidos en el mismo turno.
3. En «Día», elija la fecha. En la app aparecen los próximos 21 días; para un día más lejano use [[reservar-desde-calendario]].
4. En «Barbero», deje «Cualquiera, el primero libre» o elija uno.
5. En «Hora», elija un horario de la mañana o de la tarde. Cada uno muestra de qué hora a qué hora es y si queda lugar.
6. Si quiere, abra «Agregar una nota para el barbero (opcional)».
7. Revise el resumen con la duración y el total, y toque el botón «Reservar de … a … con …».

Aparece el aviso «Turno reservado» y vuelve a «Mis turnos».

## Después de reservar

El turno queda **pendiente** hasta que la barbería lo confirma. Cuando lo confirma, en la app le llega un aviso.

> Si no aparece ningún horario, lea [[si-no-hay-horarios]].`,
    relacionados: ['mis-turnos', 'reservar-desde-calendario', 'si-no-hay-horarios'],
  },
  {
    id: 'reservar-desde-calendario',
    titulo: 'Reservar desde el calendario de disponibilidad',
    resumen: 'Ver qué días tienen lugar y elegir un horario libre tocándolo.',
    categoria: 'reservas',
    roles: ['cliente'],
    palabras: ['disponibilidad', 'lugares libres', 'calendario', 'cuándo hay lugar'],
    cuerpo: `La pestaña «Calendario» de «Reservar» muestra el mes completo y le dice de un vistazo qué días tienen lugar.

## Cómo se lee

Cada día tiene un color según cuánto lugar queda:

- **Libre:** hay muchos horarios.
- **Pocos lugares:** quedan algunos.
- **Completo:** no queda ninguno.
- **Cerrado:** la barbería no atiende ese día.

## Pasos

1. En «Reservar», toque la pestaña «Calendario».
2. Arriba, elija los barberos que le interesan («Todos» o algunos).
3. Toque un día. Verá los tramos libres y ocupados de cada barbero.
4. Toque un tramo libre. Vuelve al formulario con el día, el barbero y la hora ya elegidos.
5. Elija el servicio y toque el botón de reservar, como en [[reservar-turno]].

> En la app, este calendario es la forma de reservar un día que está a más de 21 días.`,
    relacionados: ['reservar-turno', 'si-no-hay-horarios'],
  },
  {
    id: 'mis-turnos',
    titulo: 'Ver mis turnos',
    resumen: 'Dónde ver los turnos reservados y el detalle de cada uno.',
    categoria: 'reservas',
    roles: ['cliente'],
    palabras: ['mis citas', 'próximos turnos', 'reservas', 'detalle', 'número de turno'],
    captura: { archivo: '20-portal-turnos.png', descripcion: 'Mis turnos en vista de calendario' },
    cuerpo: `«Mis turnos» es lo primero que ve al ingresar. Tiene dos vistas, que se eligen con las pestañas de arriba.

## Calendario

Muestra el mes con todos sus turnos: los próximos, los completados y los cancelados, cada uno con el color de su estado. Toque un día para ver el detalle de ese día.

## Tarjetas

Muestra solo los turnos que vienen, con el aviso «Tiene N turnos reservados».

## El detalle de un turno

Toque «Ver detalle» para ver:

- los servicios, el barbero, la duración y el precio de cada uno;
- la «Duración total» y el «Total»;
- «Reservado el» y el «Número de turno»;
- «Lo que avisó al reservar», si dejó una nota.

## Estados de un turno

- **Pendiente:** lo reservó y la barbería todavía no lo confirmó.
- **Confirmado:** la barbería lo espera.
- **Completado:** ya se atendió.
- **Cancelado** o **No asistió.**

Desde aquí también puede cancelar un turno: lea [[cancelar-mi-turno]].`,
    relacionados: ['cancelar-mi-turno', 'reservar-turno', 'confirmar-asistencia-y-avisos'],
  },
  {
    id: 'cancelar-mi-turno',
    titulo: 'Cancelar un turno',
    resumen: 'Cómo cancelar un turno reservado y hasta cuándo se puede.',
    categoria: 'reservas',
    roles: ['cliente'],
    palabras: ['anular', 'anular cita', 'dar de baja', 'no puedo ir', 'cancelar reserva'],
    cuerpo: `Si no puede ir, cancele el turno para que el horario quede libre para otra persona.

## Pasos

1. Entre a «Mis turnos».
2. Busque el turno y toque «Cancelar turno».
3. Aparece «¿Cancelar este turno?». Confírmelo: en la web, con «Cancelar turno»; en la app, con «Sí, cancelar».

## Hasta cuándo se puede

- Solo se cancelan turnos **pendientes** o **confirmados**.
- No hay un plazo mínimo: puede cancelar hasta la hora del turno.
- Un turno cuya hora ya pasó no se puede cancelar. Si no fue, la barbería lo marca «No asistió».

Si aparece «Ese turno ya no se puede cancelar.», es porque la hora ya llegó o porque el turno ya fue cancelado o atendido.

> ! Cancelar no se puede deshacer. Para volver a tener el turno hay que reservar de nuevo, y ese horario puede haberse ocupado.

> En la app también puede cancelar desde el recordatorio que le llega al teléfono. Lea [[confirmar-asistencia-y-avisos]].`,
    relacionados: ['mis-turnos', 'reservar-turno'],
  },
  {
    id: 'si-no-hay-horarios',
    titulo: 'No me aparecen horarios para reservar',
    resumen: 'Qué significa cada aviso cuando no hay horarios y qué probar.',
    categoria: 'reservas',
    roles: ['cliente'],
    palabras: ['sin horarios', 'lleno', 'ocupado', 'no puedo reservar', 'error al reservar'],
    cuerpo: `A veces el formulario no ofrece horas. Casi siempre tiene una explicación sencilla.

## Avisos que puede ver

- «Ese día la barbería no atiende.»: es un día cerrado. Elija otra fecha. Los días y horarios de atención están en [[mi-perfil-cliente]], en la web.
- «Ese día está completo…»: no queda ningún lugar. Pruebe otro día.
- «Ese barbero no tiene horarios libres ese día. Pruebe con «Cualquiera».»: el barbero que eligió está ocupado; otro puede tener lugar.
- «Puede que ese día no se atienda o que no quede un hueco tan largo. Pruebe otra fecha.»: si eligió varios servicios, el turno es largo y necesita un hueco más grande.

## Qué probar

1. Elija «Cualquiera, el primero libre» en lugar de un barbero.
2. Quite algún servicio para que el turno sea más corto.
3. Mire el mes en [[reservar-desde-calendario]] para encontrar un día con lugar.

## Si el error aparece al tocar «Reservar»

- «El barbero ya tiene otro turno en ese horario.»: alguien reservó ese horario un momento antes. Elija otro.
- «No se puede agendar un turno en un momento que ya pasó.»: elija una hora posterior.
- «Uno de los servicios elegidos ya no está disponible.»: la barbería dejó de ofrecerlo.
- «Su cuenta todavía no está habilitada para reservar turnos.»: consulte en la barbería.`,
    relacionados: ['reservar-turno', 'reservar-desde-calendario'],
  },

  // --- Su cuenta -----------------------------------------------------------
  {
    id: 'calificar-atencion',
    titulo: 'Calificar una atención',
    resumen: 'Darle de 1 a 5 estrellas a un turno atendido y dejar un comentario.',
    categoria: 'su-cuenta',
    roles: ['cliente'],
    palabras: ['valorar', 'opinión', 'estrellas', 'puntuar', 'comentario', 'reseña'],
    captura: { archivo: '23-portal-historial.png', descripcion: 'Historial con la calificación de un turno' },
    cuerpo: `Su opinión ayuda a la barbería a mejorar y a conocer el trabajo de cada barbero.

## Pasos

1. Entre a «Historial».
2. Busque un turno atendido. Debajo dice «¿Cómo le fue?».
3. Elija de 1 a 5 estrellas.
4. Si quiere, escriba un comentario (hasta 500 caracteres).
5. Toque «Enviar calificación».

## Cambiar una calificación

Toque «Cambiar» en el turno, corrija las estrellas o el comentario y toque «Enviar calificación». Con «Cancelar» deja la que tenía.

## Lo que conviene saber

- Solo se califican turnos **completados**. Los cancelados o los que figuran como «No asistió» no se califican.
- Hay una calificación por turno.
- Si no eligió estrellas, aparece «Elija de 1 a 5 estrellas.».

Funciona igual en la web y en la app.`,
    relacionados: ['comprobantes-e-historial'],
  },
  {
    id: 'comprobantes-e-historial',
    titulo: 'Descargar comprobantes e historial',
    resumen: 'Ver sus visitas pasadas y bajar en PDF el historial y los comprobantes.',
    categoria: 'su-cuenta',
    roles: ['cliente'],
    palabras: ['factura', 'recibo', 'comprobante', 'PDF', 'visitas', 'descargar'],
    captura: { archivo: '23-portal-historial.png', descripcion: 'Historial y comprobantes del cliente' },
    cuerpo: `En «Historial» están todos sus turnos pasados con la fecha, el horario, los servicios, el barbero, el estado y el total.

## Descargar el historial

Toque «Descargar mi historial». Se baja un PDF con todas sus visitas.

## Descargar un comprobante

1. Baje hasta «Mis comprobantes».
2. Toque «Descargar» en el comprobante que necesita.

La barbería emite el comprobante cuando cobra el turno. Si un turno atendido todavía no tiene comprobante, es que todavía no se emitió.

> El comprobante es interno de la barbería: no reemplaza a una factura legal.

> Las descargas en PDF solo están en la página web. En la app puede ver el historial y calificar, pero no descargar.

Si todavía no tiene visitas, verá «Todavía no hay visitas registradas» y «Todavía no hay comprobantes».`,
    relacionados: ['calificar-atencion', 'web-o-app'],
  },
  {
    id: 'para-usted',
    titulo: 'Recomendaciones «Para usted»',
    resumen: 'Servicios que todavía no probó, elegidos según sus gustos.',
    categoria: 'su-cuenta',
    roles: ['cliente'],
    palabras: ['recomendaciones', 'sugerencias', 'servicios nuevos', 'probar algo nuevo'],
    captura: { archivo: '22-portal-para-usted.png', descripcion: 'Recomendaciones para el cliente' },
    cuerpo: `«Para usted» le sugiere servicios de la barbería que todavía no probó.

## Pasos

1. Entre a «Para usted».
2. Toque «Ver mis recomendaciones». Si ya las tiene, el botón dice «Actualizar».
3. Cada recomendación muestra por qué se la sugerimos y un porcentaje de coincidencia.
4. Si una le interesa, toque «Reservar este». Se abre «Reservar» con ese servicio ya elegido.

## Por qué se las sugerimos

- «Lo eligen clientes con gustos parecidos a los suyos».
- «De lo más pedido en la barbería».

## Lo que conviene saber

- Hacen falta al menos 3 servicios en su historial. Antes verá «Todavía lo estamos conociendo…».
- Se actualizan como mucho una vez por día. Si ya están al día verá «Sus recomendaciones ya están al día. Se actualizan una vez por día.».
- Si ya probó todo lo que le podríamos sugerir, verá «Por ahora no tenemos servicios nuevos para recomendarle…».`,
    relacionados: ['reservar-turno'],
  },
  {
    id: 'mi-perfil-cliente',
    titulo: 'Mi perfil y mis datos',
    resumen: 'Cambiar su nombre, teléfono y otros datos, y ver el horario de la barbería.',
    categoria: 'su-cuenta',
    roles: ['cliente'],
    palabras: ['datos personales', 'teléfono', 'dirección', 'cumpleaños', 'contraseña', 'horario de atención'],
    cuerpo: `En «Mi perfil» (en la app, «Perfil») mantiene sus datos al día.

## Cambiar sus datos

1. Entre a «Mi perfil». En la app, toque «Editar mis datos».
2. Puede cambiar «Nombre y apellido», «Teléfono», «Dirección» y «Fecha de nacimiento».
3. Toque «Guardar mis datos» (en la app, «Guardar cambios»).

Aparece «Sus datos quedaron guardados.» (en la app, «Datos guardados»).

- El nombre necesita al menos 3 letras y el teléfono al menos 6 números.
- La fecha de nacimiento es opcional y no puede ser futura. En la app se escribe así: 25/03/1995.

## El correo

El correo no se cambia desde aquí, porque es con lo que ingresa. Para cambiarlo, avise en la barbería.

## La contraseña

No hay un botón para cambiarla con la sesión abierta. Cierre sesión y use «¿Olvidó su contraseña?» desde [[recuperar-contrasena]]: le llega un código por correo y elige una nueva.

## Horario de atención

En la página web, «Mi perfil» muestra el horario de cada día de la semana o «Cerrado».`,
    relacionados: ['recuperar-contrasena', 'web-o-app'],
  },

  // --- La app del teléfono -------------------------------------------------
  {
    id: 'instalar-la-app',
    titulo: 'Instalar la app en el teléfono',
    resumen: 'Cómo instalar la app Barber Shop en un teléfono Android.',
    categoria: 'app',
    roles: ['cliente'],
    palabras: ['aplicación', 'celular', 'Android', 'descargar app', 'APK', 'instalar'],
    captura: { archivo: '24-portal-movil.png', descripcion: 'La app en el teléfono' },
    cuerpo: `La app Barber Shop es para teléfonos **Android**. No está en una tienda de aplicaciones: la barbería le pasa el archivo de instalación (termina en .apk).

## Pasos

1. Abra en el teléfono el enlace o el archivo que le pasó la barbería y descárguelo.
2. Toque el archivo descargado.
3. Si el teléfono avisa que no permite instalar apps de origen desconocido, toque «Configuración» y habilite el permiso para el navegador o la app desde la que lo abrió.
4. Vuelva atrás y toque «Instalar».
5. Abra Barber Shop e ingrese con el mismo correo y contraseña de la página web. Si todavía no tiene cuenta, toque «Crear cuenta» ([[crear-cuenta]]).
6. Cuando la app pida permiso para enviar notificaciones, acéptelo: así le llegan los recordatorios y los avisos de la barbería.

## Lo que conviene saber

- La sesión queda guardada en el teléfono: no tiene que ingresar cada vez.
- La app es solo para clientes. El personal de la barbería usa la página web.

> Si tenía instalada una versión anterior y el teléfono no deja instalar la nueva encima, desinstale la anterior primero.`,
    relacionados: ['confirmar-asistencia-y-avisos', 'web-o-app'],
  },
  {
    id: 'confirmar-asistencia-y-avisos',
    titulo: 'Confirmar asistencia y avisos en la app',
    resumen: 'Los recordatorios del teléfono, confirmar que va y los avisos de la barbería.',
    categoria: 'app',
    roles: ['cliente'],
    palabras: ['notificaciones', 'recordatorio', 'confirmar turno', 'push', 'alertas'],
    cuerpo: `La app le recuerda sus turnos y le avisa lo que cambia la barbería.

## Confirmar su asistencia

En «Mis turnos», un turno pendiente muestra «Confirmar asistencia». Tóquelo para avisarle a la barbería que va a ir. En la página web este botón no existe.

## El recordatorio

Antes de cada turno le llega un aviso al teléfono, por ejemplo «Su turno es mañana a las 10:00».

- Si el turno está pendiente, el aviso trae los botones «Confirmar» y «Cancelar».
- Si ya está confirmado, solo trae «Cancelar».
- Si sigue pendiente, le llega un segundo aviso 2 horas antes.
- Al tocar el aviso se abre «Mis turnos».

## Avisos de la barbería

Le llegan aunque la app esté cerrada:

- cuando la barbería confirma su turno;
- cuando lo cancela;
- cuando le cambia el día o la hora.

Lo que hace usted mismo no genera aviso.

> Si toca «Cerrar sesión», el teléfono deja de recibir recordatorios y avisos hasta que vuelva a ingresar.

> Además de la app, la barbería le manda un recordatorio por correo, use o no la app.`,
    relacionados: ['mis-turnos', 'cancelar-mi-turno', 'instalar-la-app'],
  },
  {
    id: 'web-o-app',
    titulo: 'Diferencias entre la página web y la app',
    resumen: 'Qué se puede hacer en cada una, para elegir la que le convenga.',
    categoria: 'app',
    roles: ['cliente'],
    palabras: ['web', 'aplicación', 'celular', 'computadora', 'diferencias'],
    cuerpo: `Su cuenta es la misma en la web y en la app: los turnos que reserva en una aparecen en la otra. Casi todo funciona igual, con estas diferencias.

## Solo en la app

- **Confirmar asistencia** a un turno pendiente.
- **Recordatorios y avisos** en el teléfono, con botones para confirmar o cancelar.
- Al reservar, el día se elige en una fila con los próximos 21 días. Para un día más lejano se usa la pestaña «Calendario».

## Solo en la página web

- **Descargar en PDF** el historial y los comprobantes.
- Ver el **horario de atención** de la barbería, en «Mi perfil».
- Elegir cualquier fecha futura al reservar.
- Descargar este manual en PDF, desde «Ayuda».

## En las dos

- Reservar, ver y cancelar turnos.
- Calificar las atenciones.
- Recomendaciones «Para usted».
- Editar sus datos.
- El recordatorio por correo.
- Esta ayuda: en la web, «Ayuda» en el menú; en la app, el botón «Ayuda» de «Perfil», o «¿Necesita ayuda?» en la pantalla de ingreso.

## Cerrar sesión

- En la web: botón «Salir», arriba.
- En la app: «Cerrar sesión», en «Perfil».

> El enlace para confirmar su correo siempre abre la página web, aunque se haya registrado desde la app.`,
    relacionados: ['instalar-la-app', 'comprobantes-e-historial', 'confirmar-asistencia-y-avisos'],
  },
];
