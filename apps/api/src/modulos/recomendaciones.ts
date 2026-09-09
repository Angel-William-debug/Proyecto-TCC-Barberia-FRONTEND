/**
 * Motor de recomendaciones (CU-013): K-Means + filtrado colaborativo.
 *
 * El documento de casos de uso describia un microservicio Python/Flask
 * aparte. Se decidio implementar el mismo algoritmo en TypeScript dentro de
 * `apps/api`: nada nuevo que desplegar ni mantener en un segundo lenguaje, y
 * el volumen de una sola barberia -decenas o pocos cientos de clientes- no
 * justifica un servicio separado. Sin dependencias externas: k-means es
 * simple de implementar a mano y evita sumar una biblioteca de aprendizaje
 * automatico para un problema de este tamano.
 *
 * COMO FUNCIONA
 *
 *  1. Se arma una matriz cliente x servicio con la frecuencia de cada
 *     servicio en `historial_servicio`, con decaimiento por antiguedad -una
 *     visita de hace `VIDA_MEDIA_MESES` pesa la mitad que una de hoy, para
 *     que el gusto actual del cliente pese mas que todo su historico- y
 *     normalizada por el total de visitas de cada cliente.
 *  2. K-Means (con inicializacion k-means++) agrupa a los clientes segun que
 *     servicios suelen pedir. El numero de grupos `k` no es fijo: se prueba
 *     cada valor entre 2 y `K_CLUSTERS_MAX` y se elige el que da mejor
 *     indice de silueta (que tan bien separados quedan los grupos). Cada
 *     intento de K-Means corre `REINICIOS_KMEANS` veces con centroides
 *     iniciales distintos y se conserva el de menor inercia, porque
 *     k-means++ sigue dependiendo de un sorteo inicial y una sola corrida
 *     puede converger a un agrupamiento mediocre.
 *  3. Dentro del grupo del cliente objetivo, cada companero "vota" por los
 *     servicios que probo, con un peso igual a su similitud coseno con el
 *     objetivo -un companero identico pesa 1, uno sin nada en comun no
 *     aporta-. Es el filtrado colaborativo: se recomienda lo que le gusto a
 *     clientes parecidos, no lo mas vendido en general.
 *  4. Se descartan los servicios que el cliente ya probo y se devuelven los
 *     mejores puntuados, normalizados a 0-1. Si nadie en el grupo tiene
 *     similitud con el cliente objetivo (grupo nuevo, sin companeros
 *     parecidos), se cae a `ALGORITMO_FALLBACK`: los servicios mas pedidos
 *     por toda la clientela, para no dejar la pantalla vacia.
 *
 * RN-009 exige un minimo de 3 servicios en el historial del cliente antes de
 * generar algo; la base lo hace cumplir de nuevo al insertar
 * (`trg_recomendacion_min_historial`), asi que la comprobacion de aca es
 * para dar un mensaje temprano, no la unica barrera.
 */

import type { RecomendacionDeLista } from '@barber-shop/tipos';

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { uno } from '../compartido/relaciones';

const MIN_SERVICIOS_HISTORIAL = 3;
const K_CLUSTERS_MAX = 5;
const REINICIOS_KMEANS = 10;
const TOP_N_RECOMENDACIONES = 5;
const ALGORITMO = 'kmeans_colaborativo_v2';
const ALGORITMO_FALLBACK = 'mas_pedidos_v1';

const VIDA_MEDIA_MESES = 6;
const DIAS_POR_MES = 30.44;
const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Peso de una visita segun su antiguedad: 1 si es de hoy, 0.5 si tiene
 * `VIDA_MEDIA_MESES` meses, 0.25 al doble de esa antiguedad, etc.
 */
function pesoPorRecencia(fechaRealizacion: string): number {
  const dias = (Date.now() - new Date(fechaRealizacion).getTime()) / MS_POR_DIA;
  const meses = Math.max(0, dias / DIAS_POR_MES);
  return 0.5 ** (meses / VIDA_MEDIA_MESES);
}

function distanciaEuclidiana(a: number[], b: number[]): number {
  let suma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    suma += d * d;
  }
  return Math.sqrt(suma);
}

function similitudCoseno(a: number[], b: number[]): number {
  let punto = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    punto += a[i]! * b[i]!;
    normaA += a[i]! * a[i]!;
    normaB += b[i]! * b[i]!;
  }
  if (normaA === 0 || normaB === 0) return 0;
  return punto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

/**
 * K-Means con inicializacion k-means++: el primer centroide al azar, los
 * siguientes con probabilidad proporcional al cuadrado de la distancia al
 * centroide mas cercano ya elegido. Sin eso, dos centroides pueden arrancar
 * pegados y el agrupamiento converge mal.
 *
 * Devuelve el indice de cluster de cada vector, en el mismo orden de entrada.
 */
function kMeans(vectores: number[][], k: number, iteraciones = 25): number[] {
  const n = vectores.length;
  const dim = vectores[0]?.length ?? 0;
  if (n === 0 || dim === 0 || k <= 0) return new Array(n).fill(0);

  const centroides: number[][] = [vectores[Math.floor(Math.random() * n)]!.slice()];
  while (centroides.length < k) {
    const distancias = vectores.map(
      (v) => Math.min(...centroides.map((c) => distanciaEuclidiana(v, c))) ** 2,
    );
    const total = distancias.reduce((s, d) => s + d, 0);
    if (total === 0) {
      centroides.push(vectores[Math.floor(Math.random() * n)]!.slice());
      continue;
    }
    let umbral = Math.random() * total;
    let elegido = 0;
    for (let i = 0; i < distancias.length; i++) {
      umbral -= distancias[i]!;
      if (umbral <= 0) {
        elegido = i;
        break;
      }
    }
    centroides.push(vectores[elegido]!.slice());
  }

  let asignaciones = new Array(n).fill(-1);

  for (let it = 0; it < iteraciones; it++) {
    const nuevasAsignaciones = vectores.map((v) => {
      let mejor = 0;
      let mejorDist = Infinity;
      centroides.forEach((c, i) => {
        const d = distanciaEuclidiana(v, c);
        if (d < mejorDist) {
          mejorDist = d;
          mejor = i;
        }
      });
      return mejor;
    });

    const huboCambio = nuevasAsignaciones.some((a, i) => a !== asignaciones[i]);
    asignaciones = nuevasAsignaciones;
    if (!huboCambio) break;

    for (let c = 0; c < k; c++) {
      const miembros = vectores.filter((_, i) => asignaciones[i] === c);
      if (miembros.length === 0) continue;
      const nuevoCentroide = new Array(dim).fill(0);
      for (const m of miembros) {
        for (let d = 0; d < dim; d++) nuevoCentroide[d] += m[d]!;
      }
      centroides[c] = nuevoCentroide.map((s) => s / miembros.length);
    }
  }

  return asignaciones;
}

/** Suma de distancias al cuadrado de cada punto al centroide de su propio cluster. */
function calcularInercia(vectores: number[][], asignaciones: number[], k: number): number {
  const dim = vectores[0]?.length ?? 0;
  const sumas: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0));
  const conteos = new Array(k).fill(0);

  vectores.forEach((v, i) => {
    const c = asignaciones[i]!;
    conteos[c] += 1;
    v.forEach((valor, d) => {
      sumas[c]![d]! += valor;
    });
  });

  const centroides = sumas.map((suma, c) => (conteos[c] > 0 ? suma.map((s) => s / conteos[c]) : suma));

  return vectores.reduce(
    (total, v, i) => total + distanciaEuclidiana(v, centroides[asignaciones[i]!]!) ** 2,
    0,
  );
}

/**
 * Corre K-Means `REINICIOS_KMEANS` veces con centroides iniciales distintos y
 * devuelve la asignacion de menor inercia. k-means++ reduce el riesgo de un
 * mal sorteo inicial, pero no lo elimina: una sola corrida puede converger a
 * un minimo local mediocre.
 */
function kMeansEstable(vectores: number[][], k: number): number[] {
  let mejorAsignacion: number[] = [];
  let mejorInercia = Infinity;

  for (let intento = 0; intento < REINICIOS_KMEANS; intento++) {
    const asignacion = kMeans(vectores, k);
    const inercia = calcularInercia(vectores, asignacion, k);
    if (inercia < mejorInercia) {
      mejorInercia = inercia;
      mejorAsignacion = asignacion;
    }
  }

  return mejorAsignacion;
}

/**
 * Indice de silueta promedio: para cada punto compara que tan cerca esta de
 * su propio cluster (a) contra el cluster ajeno mas cercano (b). Va de -1 a
 * 1; mas alto significa grupos mas compactos y mas separados entre si. Sirve
 * para comparar agrupamientos con distinto `k` sin depender de una formula
 * fija como antes (`min(5, clientes / 2)`).
 */
function silueta(vectores: number[][], asignaciones: number[]): number {
  const n = vectores.length;
  let sumaSiluetas = 0;

  for (let i = 0; i < n; i++) {
    const clusterI = asignaciones[i]!;
    let distanciaIntra = 0;
    let miembrosIntra = 0;
    const acumuladoInter = new Map<number, { suma: number; n: number }>();

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = distanciaEuclidiana(vectores[i]!, vectores[j]!);
      if (asignaciones[j] === clusterI) {
        distanciaIntra += d;
        miembrosIntra += 1;
      } else {
        const acumulado = acumuladoInter.get(asignaciones[j]!) ?? { suma: 0, n: 0 };
        acumulado.suma += d;
        acumulado.n += 1;
        acumuladoInter.set(asignaciones[j]!, acumulado);
      }
    }

    const a = miembrosIntra > 0 ? distanciaIntra / miembrosIntra : 0;
    const distanciasInter = [...acumuladoInter.values()].map((v) => v.suma / v.n);
    const b = distanciasInter.length > 0 ? Math.min(...distanciasInter) : 0;

    sumaSiluetas += a === 0 && b === 0 ? 0 : (b - a) / Math.max(a, b);
  }

  return n > 0 ? sumaSiluetas / n : 0;
}

/**
 * Prueba cada `k` entre 2 y `K_CLUSTERS_MAX` (acotado por la cantidad de
 * clientes) y devuelve el agrupamiento con mejor indice de silueta. Con muy
 * pocos clientes no hay margen para comparar: todos van a un unico grupo.
 */
function elegirMejorAgrupamiento(vectores: number[][]): number[] {
  const n = vectores.length;
  const kMaximo = Math.max(1, Math.min(K_CLUSTERS_MAX, Math.floor(n / 2)));

  if (kMaximo < 2) return kMeansEstable(vectores, 1);

  let mejorAsignacion = kMeansEstable(vectores, 2);
  let mejorSilueta = silueta(vectores, mejorAsignacion);

  for (let k = 3; k <= kMaximo; k++) {
    const asignacion = kMeansEstable(vectores, k);
    const puntaje = silueta(vectores, asignacion);
    if (puntaje > mejorSilueta) {
      mejorSilueta = puntaje;
      mejorAsignacion = asignacion;
    }
  }

  return mejorAsignacion;
}

/**
 * Los servicios mas pedidos por toda la clientela, sin distinguir gustos
 * individuales. Es el respaldo cuando el filtrado colaborativo no encuentra
 * a nadie parecido al cliente objetivo -mejor una recomendacion generica que
 * ninguna-.
 */
function serviciosMasPedidos(
  filas: Array<{ id_servicio: number }>,
  idsServicio: number[],
  serviciosDelCliente: Set<number>,
): Array<{ idServicio: number; score: number }> {
  const conteoGlobal = new Map<number, number>();
  for (const f of filas) {
    conteoGlobal.set(f.id_servicio, (conteoGlobal.get(f.id_servicio) ?? 0) + 1);
  }

  const maximo = Math.max(...conteoGlobal.values(), 1);

  return idsServicio
    .filter((id) => !serviciosDelCliente.has(id))
    .map((idServicio) => ({ idServicio, score: (conteoGlobal.get(idServicio) ?? 0) / maximo }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N_RECOMENDACIONES);
}

/**
 * Genera y guarda las recomendaciones de un cliente. Reemplaza las
 * anteriores: son un calculo derivado del historial, no un registro que deba
 * conservarse (a diferencia de una auditoria o una comision liquidada).
 */
export async function generarRecomendaciones(idCliente: number): Promise<RecomendacionDeLista[]> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { data: historial, error: errorHistorial } = await supabase
    .from('historial_servicio')
    .select('id_cliente, id_servicio, fecha_realizacion');
  if (errorHistorial) throw traducirError(errorHistorial);

  const filas = (historial ?? []) as Array<{
    id_cliente: number;
    id_servicio: number;
    fecha_realizacion: string;
  }>;
  const historialCliente = filas.filter((f) => f.id_cliente === idCliente);

  if (historialCliente.length < MIN_SERVICIOS_HISTORIAL) {
    throw new ErrorAplicacion(
      `El cliente necesita al menos ${MIN_SERVICIOS_HISTORIAL} servicios en su historial para ` +
        `generar recomendaciones (tiene ${historialCliente.length}).`,
      'RN-009',
    );
  }

  const serviciosDelCliente = new Set(historialCliente.map((f) => f.id_servicio));

  const { data: catalogo, error: errorCatalogo } = await supabase
    .from('servicios')
    .select('id_servicio, nombre')
    .eq('deleted', false)
    .eq('estado', true);
  if (errorCatalogo) throw traducirError(errorCatalogo);

  const idsServicio = (catalogo ?? []).map((s) => s.id_servicio);
  const indicePorServicio = new Map(idsServicio.map((id, i) => [id, i]));

  // Matriz cliente x servicio, con cada visita pesada por antiguedad y
  // normalizada por el total de visitas (ya pesadas) de cada cliente, para
  // que uno muy frecuente no domine la distancia solo por tener numeros mas
  // grandes.
  const conteoPorCliente = new Map<number, number[]>();
  const totalPorCliente = new Map<number, number>();
  for (const f of filas) {
    const idx = indicePorServicio.get(f.id_servicio);
    if (idx === undefined) continue; // servicio dado de baja: no participa
    if (!conteoPorCliente.has(f.id_cliente)) {
      conteoPorCliente.set(f.id_cliente, new Array(idsServicio.length).fill(0));
    }
    const peso = pesoPorRecencia(f.fecha_realizacion);
    const conteo = conteoPorCliente.get(f.id_cliente)!;
    conteo[idx] = (conteo[idx] ?? 0) + peso;
    totalPorCliente.set(f.id_cliente, (totalPorCliente.get(f.id_cliente) ?? 0) + peso);
  }

  const idsClientes = [...conteoPorCliente.keys()];
  const vectores = idsClientes.map((id) => {
    const conteo = conteoPorCliente.get(id)!;
    const total = totalPorCliente.get(id)!;
    return conteo.map((c) => c / total);
  });

  if (idsClientes.length < 2 || idsServicio.length === 0) {
    return []; // sin otros clientes con quien comparar: no hay filtrado colaborativo posible
  }

  const asignaciones = elegirMejorAgrupamiento(vectores);

  const indiceObjetivo = idsClientes.indexOf(idCliente);
  const clusterObjetivo = indiceObjetivo >= 0 ? asignaciones[indiceObjetivo]! : null;
  const vectorObjetivo =
    indiceObjetivo >= 0 ? vectores[indiceObjetivo]! : new Array(idsServicio.length).fill(0);

  const puntajePorServicio = new Array(idsServicio.length).fill(0);
  let pesoTotal = 0;

  idsClientes.forEach((idOtro, i) => {
    if (idOtro === idCliente) return;
    if (clusterObjetivo !== null && asignaciones[i] !== clusterObjetivo) return;

    const similitud = similitudCoseno(vectorObjetivo, vectores[i]!);
    if (similitud <= 0) return;

    vectores[i]!.forEach((valor, idx) => {
      puntajePorServicio[idx] += valor * similitud;
    });
    pesoTotal += similitud;
  });

  let algoritmoUsado: string = ALGORITMO;
  let elegidas: Array<{ idServicio: number; score: number }>;

  if (pesoTotal === 0) {
    // Nadie en el grupo se parece al cliente objetivo: sin filtrado
    // colaborativo posible. Se cae a lo mas pedido en general.
    algoritmoUsado = ALGORITMO_FALLBACK;
    elegidas = serviciosMasPedidos(filas, idsServicio, serviciosDelCliente);
  } else {
    const maximo = Math.max(...puntajePorServicio, 1e-9);
    elegidas = idsServicio
      .map((idServicio, idx) => ({ idServicio, score: puntajePorServicio[idx] / maximo }))
      .filter((r) => !serviciosDelCliente.has(r.idServicio) && r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N_RECOMENDACIONES);
  }

  if (elegidas.length === 0) return [];

  const { error: errorBorrado } = await supabase
    .from('recomendaciones_ml')
    .delete()
    .eq('id_cliente', idCliente);
  if (errorBorrado) throw traducirError(errorBorrado);

  const { error: errorInsercion } = await supabase.from('recomendaciones_ml').insert(
    elegidas.map((r) => ({
      id_cliente: idCliente,
      id_servicio: r.idServicio,
      score_relevancia: Math.round(r.score * 10000) / 10000,
      algoritmo: algoritmoUsado,
    })),
  );
  if (errorInsercion) throw traducirError(errorInsercion);

  return listarRecomendaciones(idCliente);
}

export async function listarRecomendaciones(idCliente: number): Promise<RecomendacionDeLista[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('recomendaciones_ml')
    .select(
      'id_recomendacion, id_servicio, score_relevancia, algoritmo, fecha_generacion, servicios ( nombre )',
    )
    .eq('id_cliente', idCliente)
    .order('score_relevancia', { ascending: false });

  if (error) throw traducirError(error);

  return (data ?? []).map((f) => ({
    id_recomendacion: f.id_recomendacion,
    id_servicio: f.id_servicio,
    nombre_servicio: uno<{ nombre: string }>(f.servicios)?.nombre ?? '—',
    score_relevancia: f.score_relevancia,
    algoritmo: f.algoritmo,
    fecha_generacion: f.fecha_generacion,
  }));
}
