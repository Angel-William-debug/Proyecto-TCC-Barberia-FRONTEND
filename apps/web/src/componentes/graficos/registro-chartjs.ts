import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

/**
 * Registro único de Chart.js para toda la app. Se importa por su efecto
 * secundario: los tres gráficos (ingresos, stock crítico, ranking) son todos
 * de barras, así que alcanza con registrar estos cinco elementos una sola vez
 * acá en vez de repetirlo en cada componente.
 */
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
