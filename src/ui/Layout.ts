export type TabName = '3d' | '2d' | 'analysis';

export class Layout {
  private panelContainer: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  private view3D: HTMLDivElement;
  private view2D: HTMLDivElement;
  private viewAnalysis: HTMLDivElement;
  private tabBar: HTMLDivElement;
  private root: HTMLDivElement;
  private activeTab: TabName = '3d';
  private tabCallbacks: ((tab: string) => void)[] = [];

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'app-layout';
    Object.assign(this.root.style, {
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    });

    // --- Tab Bar ---
    this.tabBar = document.createElement('div');
    Object.assign(this.tabBar.style, {
      display: 'flex',
      height: '40px',
      minHeight: '40px',
      background: 'rgba(10,10,25,0.98)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      alignItems: 'center',
      paddingLeft: '12px',
      gap: '4px',
      zIndex: '1100',
    });

    var tabs: { label: string; id: TabName }[] = [
      { label: '3D View', id: '3d' },
      { label: '2D View', id: '2d' },
      { label: 'Analysis', id: 'analysis' },
    ];

    for (var i = 0; i < tabs.length; i++) {
      var tabEl = document.createElement('button');
      tabEl.textContent = tabs[i].label;
      tabEl.dataset.tab = tabs[i].id;
      Object.assign(tabEl.style, {
        background: tabs[i].id === '3d' ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: tabs[i].id === '3d' ? '#fff' : 'rgba(255,255,255,0.5)',
        border: 'none',
        borderRadius: '6px 6px 0 0',
        padding: '8px 20px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      });
      tabEl.addEventListener('click', this.onTabClick.bind(this, tabs[i].id));
      this.tabBar.appendChild(tabEl);
    }

    this.root.appendChild(this.tabBar);

    // --- Main row: left panel + right content ---
    var mainRow = document.createElement('div');
    Object.assign(mainRow.style, {
      display: 'flex',
      flex: '1',
      overflow: 'hidden',
    });

    // Left panel
    this.panelContainer = document.createElement('div');
    this.panelContainer.id = 'panel-container';
    Object.assign(this.panelContainer.style, {
      width: '320px',
      minWidth: '260px',
      maxWidth: '380px',
      height: '100%',
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

    // Right content area
    this.contentContainer = document.createElement('div');
    this.contentContainer.id = 'content-container';
    Object.assign(this.contentContainer.style, {
      flex: '1',
      position: 'relative',
      overflow: 'hidden',
    });

    // 3D view container
    this.view3D = document.createElement('div');
    this.view3D.id = 'view-3d';
    Object.assign(this.view3D.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
    });
    this.contentContainer.appendChild(this.view3D);

    // 2D view container
    this.view2D = document.createElement('div');
    this.view2D.id = 'view-2d';
    Object.assign(this.view2D.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      display: 'none',
    });
    this.contentContainer.appendChild(this.view2D);

    // Analysis view container
    this.viewAnalysis = document.createElement('div');
    this.viewAnalysis.id = 'view-analysis';
    Object.assign(this.viewAnalysis.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      display: 'none',
      overflowY: 'auto',
      background: 'rgba(10,10,30,0.95)',
    });
    this.contentContainer.appendChild(this.viewAnalysis);

    mainRow.append(this.panelContainer, this.contentContainer);
    this.root.appendChild(mainRow);
  }

  private onTabClick(tab: TabName): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;

    // Update tab button styles
    var buttons = this.tabBar.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i] as HTMLButtonElement;
      var isActive = btn.dataset.tab === tab;
      btn.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'transparent';
      btn.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.5)';
    }

    // Show/hide view containers
    this.view3D.style.display = tab === '3d' ? 'block' : 'none';
    this.view2D.style.display = tab === '2d' ? 'block' : 'none';
    this.viewAnalysis.style.display = tab === 'analysis' ? 'block' : 'none';

    // Notify callbacks
    for (var j = 0; j < this.tabCallbacks.length; j++) {
      this.tabCallbacks[j](tab);
    }
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
    // Backward compat: returns the content container
    return this.contentContainer;
  }

  get3DContainer(): HTMLDivElement {
    return this.view3D;
  }

  get2DContainer(): HTMLDivElement {
    return this.view2D;
  }

  getAnalysisContainer(): HTMLDivElement {
    return this.viewAnalysis;
  }

  onTabChange(callback: (tab: string) => void): void {
    this.tabCallbacks.push(callback);
  }

  dispose(): void {
    this.root.remove();
  }
}
