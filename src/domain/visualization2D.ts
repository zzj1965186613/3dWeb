import type { EventData } from './events';
import { eventManager } from './events';

export class Visualization2D {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wrapper: HTMLDivElement;
  private unsubscribe: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,30,0.95)', padding: '20px',
    });
    
    var heading = document.createElement('h2');
    heading.textContent = '2D Detector View';
    Object.assign(heading.style, {
      color: '#fff', fontSize: '16px', marginBottom: '12px',
    });
    this.wrapper.appendChild(heading);
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 400;
    Object.assign(this.canvas.style, {
      maxWidth: '100%', maxHeight: '100%',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    });
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.container = this.wrapper;
    parent.appendChild(this.wrapper);
    
    this.unsubscribe = eventManager.onChange((event) => this.render(event));
    var current = eventManager.getCurrentEvent();
    if (current) this.render(current);
  }

  render(event: EventData): void {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;
    
    // Clear
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, w, h);
    
    // Draw 3 detector layers (top view)
    var layerHeight = h / 4;
    var layerLabels = ['X-Layer 1', 'Y-Layer 1', 'X-Layer 2'];
    
    for (var l = 0; l < 3; l++) {
      var y0 = 20 + l * (layerHeight + 10);
      
      // Layer label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.fillText(layerLabels[l], 10, y0 + 12);
      
      // Draw detector cells as triangles
      var cellSize = 16;
      var startX = 120;
      var numCells = l % 2 === 0 ? 7 : 12;
      
      for (var c = 0; c < numCells; c++) {
        var cx = startX + c * cellSize;
        var cy = y0 + 20;
        
        // Determine if this cell is hit based on event data
        var isHit = false;
        if (event.intensity > 0.3) {
          var hitProb = event.intensity * (1 - Math.abs(c - numCells/2) / (numCells/2));
          isHit = Math.random() < hitProb * 0.5;
        }
        
        // Draw triangle (alternating up/down)
        ctx.beginPath();
        if (c % 2 === 0) {
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cellSize, cy);
          ctx.lineTo(cx + cellSize/2, cy + cellSize);
        } else {
          ctx.moveTo(cx, cy + cellSize);
          ctx.lineTo(cx + cellSize, cy + cellSize);
          ctx.lineTo(cx + cellSize/2, cy);
        }
        ctx.closePath();
        
        if (isHit) {
          var r = Math.round(event.color[0] * 255);
          var g = Math.round(event.color[1] * 255);
          var b = Math.round(event.color[2] * 255);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.8)';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(40,40,80,0.5)';
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    
    // Draw muon trajectory line
    ctx.strokeStyle = 'rgba(0,255,136,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    var startX2 = 200 + Math.random() * 200;
    ctx.moveTo(startX2, 20);
    ctx.lineTo(startX2 + (Math.random() - 0.5) * 40, h - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Event info
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Event: ' + event.name + ' | Energy: ' + event.energy, 10, h - 10);
  }
  
  show(): void {
    this.wrapper.style.display = 'flex';
    var current = eventManager.getCurrentEvent();
    if (current) this.render(current);
  }
  
  hide(): void {
    this.wrapper.style.display = 'none';
  }
  
  dispose(): void {
    this.unsubscribe?.();
    this.wrapper.remove();
  }
}
