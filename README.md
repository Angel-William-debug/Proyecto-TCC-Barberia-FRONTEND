# Barber Shop — Frontend

Interfaz del sistema de gestión para barbería del Trabajo de Conclusión de Curso.

**Universidad Columbia del Paraguay — Filial San Lorenzo**
Angel Rolón Martínez · William Giménez Delvalle
Directora: Prof. Dra. Mirtha Graciela Villagra Ferreira

---

## Arrancar

```bash
pnpm install
cp .env.example apps/web/.env.local     # y completar las dos claves
pnpm dev
```

Queda en <http://localhost:3000>.

Sin el `.env.local` la aplicación igual levanta: la portada y la galería del
sistema de diseño funcionan, y `/panel` muestra una pantalla que explica qué
falta en lugar de un error.

### Las dos variables imprescindibles

Están en el panel de Supabase, en **Project Settings → API** del proyecto
`Barberia TCC` (`tmuntxynyopzbhzmulux`):

| Variable | Dónde sale | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* | Ya viene puesta en `.env.example` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Project API keys → anon public* | Viaja al navegador. Es lo esperado: quien protege los datos son las 56 políticas RLS, no el secreto de esta clave |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role* | **Omite todas las políticas RLS.** Solo servidor. Sin el prefijo `NEXT_PUBLIC_` justamente para que Next.js no pueda filtrarla |

---

## Modo demostración

`apps/web/.env.local` viene con `NEXT_PUBLIC_MODO_DEMO=true`. Con eso la capa
de datos devuelve un conjunto ficticio y **no consulta Supabase**: se puede
recorrer el panel completo sin credenciales, sin usuarios creados y sin datos
cargados.

Sirve para dos cosas:

1. Ver cómo quedan las pantallas antes de tener la base poblada.
2. Tomar capturas para el TCC sin exponer datos reales de clientes, lo que
   además esquiva el problema de la Ley 6534/2020.

La pantalla muestra un aviso permanente y no removible mientras está activo.
Un panel que enseña cifras de facturación sin aclarar que son inventadas
induce a error, y estas capturas terminan en un documento académico.

Está contenido en dos archivos —`apps/api/src/demo/modo.ts` y `datos.ts`— y
cada función de repositorio hace una sola comprobación al principio. El día
que sobre, se borra sin desarmar nada.

Para conectar la base de verdad: poner `NEXT_PUBLIC_MODO_DEMO=false`, completar
la clave anon, y crear el usuario en Supabase Auth con su fila en
`public.usuarios`.

---

## Rutas disponibles hoy

| Ruta | Qué es |
|---|---|
| `/` | Portada pública |
| `/ingresar` | Inicio de sesión (CU-001). En demo, cualquier dato entra |
| `/crear-cuenta` | Alta de cuenta |
| `/recuperar-contrasena` | Envío del enlace de restablecimiento |
| `/panel/agenda` | Agenda del día (CU-006) |
| `/panel/clientes` | Listado de clientes (CU-002) |
| `/panel/servicios` | Catálogo de servicios (CU-003) |
| `/panel/barberos` | Profesionales y su comisión (CU-004) |
| `/panel/cobros` | Cobros al cliente (CU-008) |
| `/panel/comisiones` | Liquidación de comisiones (CU-009) |
| `/panel/inventario` | Stock, niveles y movimientos |
| `/panel/compras` | Órdenes de compra y proveedores |
| `/panel/reportes` | Indicadores del período (módulo 7) |
| `/panel/configuracion` | Datos del local, horarios y métodos de pago (CU-020) |
| `/panel/auditoria` | Quién cambió qué, y cuándo |
| `/sistema-de-diseno` | Galería viva de tokens y componentes |

Todas funcionan con el modo demostración activo.

`/sistema-de-diseno` es la pantalla más útil mientras se construye: muestra
las tres escalas de color, la escala tipográfica, los formatos de moneda y
fecha, todos los estados y todos los componentes, con el conmutador de tema
para comprobar que ambos funcionan. **No está enlazada desde la portada a
propósito** —es una herramienta de trabajo, no algo que le sirva a quien usa
la barbería— pero se llega escribiendo la dirección.

---

## Cómo está organizado

```
Proyecto-TCC-Barberia-FRONTEND/
├── apps/
│   ├── web/                  Next.js 15 · App Router · las pantallas
│   │   └── src/
│   │       ├── app/          rutas
│   │       ├── componentes/  componentes propios de la aplicación
│   │       ├── fuentes/      las tres tipografías, autoalojadas
│   │       ├── lib/          navegación y utilidades de la app
│   │       └── middleware.ts renueva la sesión y protege /panel
│   │
│   └── api/                  EL BACKEND. Única puerta hacia Supabase
│       └── src/
│           ├── supabase/     los tres clientes: navegador, servidor, admin
│           ├── repositorios/ una función por caso de uso
│           ├── errores.ts    traduce errores de PostgreSQL a español
│           └── entorno.ts    lee y valida las variables de entorno
│
├── packages/
│   ├── ui/                   El sistema de diseño, hecho código
│   │   ├── src/tokens/       colores.css · medidas.css
│   │   ├── src/componentes/  Botón, Campo, Tabla, Chip, Tarjeta…
│   │   ├── src/formato.ts    guaraníes, fechas, duraciones
│   │   ├── src/estados.ts    estado de la base → etiqueta, color e icono
│   │   └── scripts/          verificador de contraste WCAG
│   │
│   └── tipos/                Las 27 tablas y 7 vistas, tipadas
│
└── pnpm-workspace.yaml
```

### La regla que sostiene todo

> **Solo `apps/api` conoce Supabase.**

Una pantalla nunca importa `@supabase/supabase-js`; importa `listarClientes()`
o `crearCita()`. Esa frontera permite cambiar el proveedor, agregar caché o
registrar auditoría sin tocar una sola vista.

El compilador la hace cumplir: si una pantalla intenta importar el cliente de
Supabase, no lo encuentra, porque `@supabase/ssr` no es dependencia de
`apps/web`.

### La cuarta regla

> **Solo se desplaza el contenido, y en móvil la tabla se vuelve tarjeta.**

El armazón del panel ocupa exactamente el alto de la ventana: la barra
lateral, la barra superior y el aviso de sistema quedan siempre a la vista y
el desplazamiento vive únicamente en el `<main>`. Por debajo de `lg` la barra
lateral se abre como cajón desde el botón de menú.

Las tablas no se desplazan de lado en el teléfono: cada fila pasa a ser una
tarjeta con pares etiqueta/valor. La etiqueta sale del atributo
`data-etiqueta` de cada celda, que debe coincidir con su encabezado. El
marcado sigue siendo una tabla real, así que la semántica no se pierde.
Documentado en la sección 6.6.

### La tercera regla

> **Toda tabla filtra, y el estado del filtro vive en la URL.**

Los filtros no se guardan en `useState`: se escriben como parámetros de
consulta. Eso hace que un listado filtrado se comparta pegando el enlace, que
el botón Atrás deshaga el último filtro, y que la consulta salga ya filtrada
desde el servidor en lugar de traer todo y descartar en el navegador.

Los nombres de parámetro son los mismos en las diez pantallas: `q` para la
búsqueda, `estado` para valores múltiples separados por coma, `desde` y
`hasta` para el rango de fechas, `pagina` para la paginación. Cuando una vista
tiene dos tablas, la segunda usa un prefijo (`mov_tipo`, `prov_q`).

Los componentes viven en [filtros.tsx](packages/ui/src/componentes/filtros.tsx)
y la lectura del lado del servidor, en [filtros.ts](apps/web/src/lib/filtros.ts).
Está documentado en la sección 9.9 del sistema de diseño.

### La segunda regla

> **Ningún color, tamaño ni medida se escribe en una pantalla.**

Todo sale de un token de `packages/ui`. Para comprobarlo:

```bash
# No debería devolver nada
grep -rE '#[0-9a-fA-F]{6}' apps/web/src
```

---

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm typecheck` | TypeScript sobre los cuatro paquetes |
| `pnpm tokens:verificar` | Recalcula los contrastes WCAG de la paleta |
| `pnpm format` | Prettier |

### `pnpm tokens:verificar`

Lee `packages/ui/src/tokens/colores.css`, resuelve las cadenas de `var()` y
calcula el contraste real de cada par documentado. Devuelve código de salida 1
si alguno queda por debajo del mínimo, de modo que sirve como paso de
integración continua.

Un token que rompe la accesibilidad deja de ser una discusión de gusto y pasa
a ser una compilación en rojo.

---

## Decisiones que conviene no revertir sin pensarlas

**Tema oscuro predeterminado.** La identidad es de barbería clásica: fondo
carbón, acento dorado. El tema claro existe completo y se conmuta con el
atributo `data-tema` en `<html>`.

**Tailwind v4, sin `tailwind.config.js`.** El tema se declara en CSS con
`@theme`. Encaja con el modelo de tokens de tres niveles del documento: los
primitivos y los semánticos son variables CSS, y `@theme inline` las expone
como utilidades sin congelar su valor, que es lo que permite el cambio de tema
sin recompilar.

**Tipografías autoalojadas.** Se usa `next/font/local` y no
`next/font/google`. Con la variante de Google, el navegador del usuario le
entrega su dirección IP a un tercero —algo que la Ley 6534/2020 obliga a
considerar— y además la compilación pasa a depender de que la CDN responda.

**Las reglas de negocio viven en la base.** El frontend no revalida la RN-018
ni la RN-024: las hace cumplir un disparador de PostgreSQL. `errores.ts`
traduce esos rechazos a mensajes legibles. Duplicar la regla aquí solo
garantizaría que algún día las dos versiones difieran.

**El stock puede ser negativo.** La restricción `CHECK stock_actual >= 0` se
eliminó deliberadamente para habilitar el flujo CU-007 A1, que permite
completar un servicio con stock insuficiente previa confirmación. La interfaz
tiene que mostrarlo bien, no asumir que nunca ocurre.

---

## Lo que todavía no está

Los listados de los diez módulos ya están; lo que falta es la escritura. Hoy
se puede ver, buscar y recorrer, pero los botones de alta y edición todavía no
guardan nada.

Por orden sugerido:

1. Alta y edición de clientes y de turnos (formularios con Server Actions).
2. Cobros y comisiones (CU-008, CU-009).
3. Inventario y compras (módulo 6, 16 vistas).
4. Reportes (módulo 7), sobre `fn_generar_resumen_kpis` y las 7 vistas SQL.
5. Panel del barbero (vistas 101-104). El rol ya tiene sus permisos.
6. Edge Function de recordatorios (RN-050) y microservicio ML (CU-013).

---

## Documentación

- `../Sistema_de_Diseno_Barber_Shop_v1.0.docx` — la norma visual. Ante una
  discrepancia entre el documento y el código, manda el documento.
- `../CU_Barberia_v4.docx` — los 24 casos de uso y las 55 reglas de negocio.
- `../Proyecto-TCC-Barberia-DBA/` — las 9 migraciones de la base.
