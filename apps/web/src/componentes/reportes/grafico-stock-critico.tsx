'use client';

import { Bar } from 'react-chartjs-2';

import { cantidad } from '@barber-shop/ui';
import type { VistaStockCritico } from '@barber-shop/tipos';

import '../graficos/registro-chartjs';
import { usarColoresChart } from '../graficos/usar-colores-chart';

export function GraficoStockCritico({ datos }: { datos: VistaStockCritico[] }) {
  const colores = usarColoresChart();

  // Ya vienen ordenados por faltante descendente (ver `stockCritico()`); se
  // muestran como barras horizontales para que los nombres de producto no se
  // amontonen como pasaría con barras verticales.
  const alto = Math.max(160, datos.length * 36);

  return (
    <div style={{ height: alto }} className="px-2 pb-2">
      <Bar
        data={{
          labels: datos.map((p) => p.nombre),
          datasets: [
            {
              label: 'Faltante',
              data: datos.map((p) => p.faltante),
              backgroundColor: colores.peligro,
              borderRadius: 4,
              maxBarThickness: 22,
            },
          ],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colores.tooltipFondo,
              titleColor: colores.texto,
              bodyColor: colores.texto,
              borderColor: colores.grilla,
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (contexto) => {
                  const fila = datos[contexto.dataIndex]!;
                  return `Faltan ${cantidad(fila.faltante)} (actual ${cantidad(fila.stock_actual)}, mínimo ${cantidad(fila.stock_minimo)})`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: colores.texto },
              grid: { color: colores.grilla },
              beginAtZero: true,
            },
            y: {
              ticks: { color: colores.texto },
              grid: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
