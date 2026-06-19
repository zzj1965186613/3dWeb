import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, ScatterController } from 'chart.js';
import type { EventData } from './events';
import { eventManager } from './events';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, ScatterController);

export class ChartPanel {
  private barCanvas: HTMLCanvasElement;
  private scatterCanvas: HTMLCanvasElement;
  private histCanvas: HTMLCanvasElement;
  private barChart: Chart | null = null;
  private scatterChart: Chart | null = null;
  private histChart: Chart | null = null;
  private wrapper: HTMLDivElement;
  private unsubscribe: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '14px',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    });

    // --- Bar Chart (Event Metrics) ---
    var barHeading = document.createElement('div');
    barHeading.textContent = 'Event Metrics';
    Object.assign(barHeading.style, {
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px',
    });
    this.wrapper.appendChild(barHeading);

    this.barCanvas = document.createElement('canvas');
    this.barCanvas.width = 270;
    this.barCanvas.height = 150;
    Object.assign(this.barCanvas.style, { width: '100%', height: '150px' });
    this.wrapper.appendChild(this.barCanvas);

    // --- Scatter Chart (Energy vs Intensity) ---
    var scatterHeading = document.createElement('div');
    scatterHeading.textContent = 'Energy vs Intensity';
    Object.assign(scatterHeading.style, {
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', marginTop: '8px',
    });
    this.wrapper.appendChild(scatterHeading);

    this.scatterCanvas = document.createElement('canvas');
    this.scatterCanvas.width = 270;
    this.scatterCanvas.height = 150;
    Object.assign(this.scatterCanvas.style, { width: '100%', height: '150px' });
    this.wrapper.appendChild(this.scatterCanvas);

    // --- Histogram Chart (Energy Distribution) ---
    var histHeading = document.createElement('div');
    histHeading.textContent = 'Energy Distribution';
    Object.assign(histHeading.style, {
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', marginTop: '8px',
    });
    this.wrapper.appendChild(histHeading);

    this.histCanvas = document.createElement('canvas');
    this.histCanvas.width = 270;
    this.histCanvas.height = 150;
    Object.assign(this.histCanvas.style, { width: '100%', height: '150px' });
    this.wrapper.appendChild(this.histCanvas);

    parent.appendChild(this.wrapper);

    this.unsubscribe = eventManager.onChange((event) => this.updateCharts(event));
  }

  init(): void {
    var current = eventManager.getCurrentEvent();
    if (!current) return;

    // Bar chart
    var labels = ['Energy', 'Intensity', 'Roughness', 'Metalness', 'Scale'];
    var values = this.extractValues(current);
    var colors = this.buildColors(current);

    this.barChart = new Chart(this.barCanvas, {
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
      options: this.buildBarOptions(),
    });

    // Scatter chart — Energy vs Intensity for all events
    var allEvents = eventManager.getEvents();
    var scatterData = allEvents.map(function(e) { return { x: e.energy, y: e.intensity * 1000 }; });
    var scatterColors = allEvents.map(function(e) {
      return 'rgba(' + Math.round(e.color[0]*255) + ',' + Math.round(e.color[1]*255) + ',' + Math.round(e.color[2]*255) + ',0.7)';
    });

    this.scatterChart = new Chart(this.scatterCanvas, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Events',
          data: scatterData,
          backgroundColor: scatterColors,
          borderColor: scatterColors.map(function(c) { return c.replace('0.7)', '1.0)'); }),
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
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
            titleColor: '#fff', bodyColor: '#e0e0e0',
            borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            padding: 8, cornerRadius: 4,
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Energy', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            title: { display: true, text: 'Intensity', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });

    // Histogram — energy distribution
    var bins = this.buildHistogramBins(allEvents, 8);

    this.histChart = new Chart(this.histCanvas, {
      type: 'bar',
      data: {
        labels: bins.labels,
        datasets: [{
          label: 'Count',
          data: bins.counts,
          backgroundColor: 'rgba(0,200,150,0.5)',
          borderColor: 'rgba(0,255,180,0.8)',
          borderWidth: 1,
          borderRadius: 2,
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
            titleColor: '#fff', bodyColor: '#e0e0e0',
            borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            padding: 8, cornerRadius: 4,
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Energy Bin', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 9 }, maxRotation: 45 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Events', color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });

    // Highlight current event on scatter
    this.highlightScatterPoint(current);
  }

  private buildBarOptions(): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20,20,40,0.9)',
          titleColor: '#fff', bodyColor: '#e0e0e0',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          padding: 8, cornerRadius: 4,
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
    };
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
    return [base + '0.7)', base + '0.55)', base + '0.45)', base + '0.55)', base + '0.45)'];
  }

  private buildHistogramBins(events: EventData[], binCount: number): { labels: string[]; counts: number[] } {
    if (events.length === 0) return { labels: [], counts: [] };
    var energies = events.map(function(e) { return e.energy; });
    var minE = Math.min.apply(null, energies);
    var maxE = Math.max.apply(null, energies);
    if (minE === maxE) { minE = 0; maxE = minE + 1; }
    var binWidth = (maxE - minE) / binCount;
    var labels: string[] = [];
    var counts: number[] = [];
    for (var i = 0; i < binCount; i++) {
      var lo = minE + i * binWidth;
      var hi = lo + binWidth;
      labels.push(lo.toFixed(1) + '-' + hi.toFixed(1));
      var count = 0;
      for (var j = 0; j < energies.length; j++) {
        if (i === binCount - 1) {
          if (energies[j] >= lo && energies[j] <= hi) count++;
        } else {
          if (energies[j] >= lo && energies[j] < hi) count++;
        }
      }
      counts.push(count);
    }
    return { labels: labels, counts: counts };
  }

  private highlightScatterPoint(event: EventData): void {
    if (!this.scatterChart) return;
    var allEvents = eventManager.getEvents();
    var idx = allEvents.indexOf(event);
    if (idx < 0) return;
    // Update point radius: highlight current, dim others
    var radii: number[] = [];
    var borderWidths: number[] = [];
    for (var i = 0; i < allEvents.length; i++) {
      radii.push(i === idx ? 8 : 5);
      borderWidths.push(i === idx ? 3 : 1);
    }
    this.scatterChart.data.datasets[0].pointRadius = radii;
    this.scatterChart.data.datasets[0].pointBorderWidth = borderWidths;
    this.scatterChart.update('none');
  }

  private updateCharts(event: EventData): void {
    // Update bar chart
    if (this.barChart) {
      var values = this.extractValues(event);
      var colors = this.buildColors(event);
      this.barChart.data.datasets[0].data = values;
      this.barChart.data.datasets[0].backgroundColor = colors;
      this.barChart.data.datasets[0].borderColor = colors.map(function(c) { return c.replace('0.7)', '1.0)'); });
      this.barChart.data.datasets[0].label = event.name;
      this.barChart.update('active');
    }

    // Highlight current event on scatter
    this.highlightScatterPoint(event);
  }

  show(): void {
    this.wrapper.style.display = 'flex';
  }

  hide(): void {
    this.wrapper.style.display = 'none';
  }

  dispose(): void {
    this.unsubscribe?.();
    this.barChart?.destroy();
    this.scatterChart?.destroy();
    this.histChart?.destroy();
    this.wrapper.remove();
  }
}
