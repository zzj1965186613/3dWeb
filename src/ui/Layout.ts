export class Layout {
  private panelContainer: HTMLDivElement;
  private canvasContainer: HTMLDivElement;
  private root: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'app-layout';
    Object.assign(this.root.style, {
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    });

    this.panelContainer = document.createElement('div');
    this.panelContainer.id = 'panel-container';
    Object.assign(this.panelContainer.style, {
      width: '320px',
      minWidth: '260px',
      maxWidth: '380px',
      height: '100vh',
      overflowY: 'auto',
      background: 'rgba(16, 16, 32, 0.95)',
      color: '#e0e0e0',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontSize: '14px',
      padding: '0',
      boxSizing: 'border-box',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      flexShrink: '0',
      zIndex: '1000',
    });

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.id = 'canvas-container';
    Object.assign(this.canvasContainer.style, {
      flex: '1',
      position: 'relative',
      overflow: 'hidden',
    });

    this.root.append(this.panelContainer, this.canvasContainer);
  }

  mount(): void {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(this.root);
  }

  getPanelContainer(): HTMLDivElement {
    return this.panelContainer;
  }

  getCanvasContainer(): HTMLDivElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.root.remove();
  }
}