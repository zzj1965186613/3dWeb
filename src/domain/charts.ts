import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import type { EventData } from './events';
import { eventManager } from './events';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export class ChartPanel {
  private canvas: HTMLCanvasElement;
  private chart: Chart | null = null;
  private wrapper: HTMLDivElement;
  private unsubscribe: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '14px',
      border: '1px solid rgba(255,255,255,0.06)',
    });
    var heading = document.createElement('div');
    heading.textContent = 'Event Metrics';
    Object.assign(heading.style, {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'rgba(255,255,255,0.4)',
      marginBottom: '10px',
    });
    this.wrapper.appendChild(heading);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 270;
    this.canvas.height = 180;
    Object.assign(this.canvas.style, {
      width: '100%',
      height: '180px',
    });
    this.wrapper.appendChild(this.canvas);
    parent.appendChild(this.wrapper);

    this.unsubscribe = eventManager.onChange((event) => this.updateChart(event));
  }

  init(): void {
    var current = eventManager.getCurrentEvent();
    if (!current) return;

    var labels = ['Energy', 'Intensity', 'Roughness', 'Metalness', 'Scale'];
    var values = this.extractValues(current);
    var colors = this.buildColors(current);

    this.chart = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: current.name,
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(function(c) { return c.replace('0.7)', '1.0)'); }),
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,20,40,0.9)',
            titleColor: '#fff',
            bodyColor: '#e0e0e0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 8,
            cornerRadius: 4,
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  }

  private extractValues(event: EventData): number[] {
    return [
      event.energy,
      event.intensity * 1000,
      event.roughness * 100,
      event.metalness * 100,
      event.scale * 100,
    ];
  }

  private buildColors(event: EventData): string[] {
    var r = Math.round(event.color[0] * 255);
    var g = Math.round(event.color[1] * 255);
    var b = Math.round(event.color[2] * 255);
    var base = 'rgba(' + r + ',' + g + ',' + b + ','; 
    return [
      base + '0.7)',
      base + '0.55)',
      base + '0.45)',
      base + '0.55)',
      base + '0.45)',
    ];
  }

  private updateChart(event: EventData): void {
    if (!this.chart) return;
    var values = this.extractValues(event);
    var colors = this.buildColors(event);
    this.chart.data.datasets[0].data = values;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.data.datasets[0].borderColor = colors.map(function(c) { return c.replace('0.7)', '1.0)'); });
    this.chart.data.datasets[0].label = event.name;
    this.chart.update('active');
  }

  dispose(): void {
    this.unsubscribe?.();
    this.chart?.destroy();
    this.wrapper.remove();
  }
}