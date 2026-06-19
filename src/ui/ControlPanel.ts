import { eventManager } from '../domain/events';
import type { EventData } from '../domain/events';
import type { PostProcessingState } from '../core/postprocessing';

export interface SceneControls {
  showModel: boolean;
  wireframe: boolean;
  skybox: boolean;
  acceptanceRange: number;
  pyramidTint: string;
}

export type ControlChangeListener = (controls: SceneControls) => void;
export type PostChangeListener = (state: Partial<PostProcessingState>) => void;
export type ResetListener = () => void;

export class ControlPanel {
  private container: HTMLDivElement;
  private titleEl: HTMLHeadingElement;
  private selectEl!: HTMLSelectElement;
  private infoEl!: HTMLDivElement;
  private energyBar!: HTMLDivElement;
  private rangeValueEl!: HTMLSpanElement;

  private state: SceneControls = {
    showModel: true,
    wireframe: false,
    skybox: true,
    acceptanceRange: 50,
    pyramidTint: '#ffffff',
  };

  private postState: Partial<PostProcessingState> = {};

  private listeners: ControlChangeListener[] = [];
  private postListeners: PostChangeListener[] = [];
  private resetListeners: ResetListener[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'control-panel';
    Object.assign(this.container.style, {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    });

    // Title
    this.titleEl = document.createElement('h2');
    Object.assign(this.titleEl.style, {
      margin: '0',
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      letterSpacing: '0.5px',
    });
    this.container.appendChild(this.titleEl);

    // Event selection
    this.container.appendChild(this.buildSection('Event Selection', [
      this.buildEventSelector(),
      this.buildInfoArea(),
      this.buildEnergyBar(),
    ]));

    // Display controls
    this.container.appendChild(this.buildSection('Display Controls', [
      this.buildToggle('Show Model', 'showModel'),
      this.buildToggle('Wireframe', 'wireframe'),
      this.buildToggle('Skybox', 'skybox'),
    ]));

    // Pyramid tint
    this.container.appendChild(this.buildSection('Pyramid Tint', [
      this.buildColorPicker(),
    ]));

    // Acceptance range
    this.container.appendChild(this.buildSection('Acceptance Range', [
      this.buildRangeSlider(),
    ]));

    // Post-processing
    this.container.appendChild(this.buildSection('Post-Processing', [
      this.buildToggle('Bloom', 'bloom'),
      this.buildPostSlider('Strength', 'bloomStrength', 0, 3, 0.1, 0.6),
      this.buildPostSlider('Radius', 'bloomRadius', 0, 1, 0.05, 0.4),
      this.buildPostSlider('Threshold', 'bloomThreshold', 0, 1, 0.05, 0.85),
    ]));

    // Tone mapping
    this.container.appendChild(this.buildSection('Tone Mapping', [
      this.buildToneMappingSelect(),
      this.buildPostSlider('Exposure', 'toneMappingExposure', 0.1, 3, 0.1, 1.0),
    ]));

    // Reset button
    this.container.appendChild(this.buildResetButton());

    parent.appendChild(this.container);

    this.unsubscribe = eventManager.onChange((event) => this.updateEventDisplay(event));
  }

  // Section builder
  private buildSection(title: string, children: HTMLElement[]): HTMLDivElement {
    var section = document.createElement('div');
    Object.assign(section.style, {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '14px',
      border: '1px solid rgba(255,255,255,0.06)',
    });
    var heading = document.createElement('div');
    heading.textContent = title;
    Object.assign(heading.style, {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'rgba(255,255,255,0.4)',
      marginBottom: '10px',
    });
    section.appendChild(heading);
    for (var i = 0; i < children.length; i++) section.appendChild(children[i]);
    return section;
  }

  // Event selector
  private buildEventSelector(): HTMLDivElement {
    var wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
    });
    var label = document.createElement('label');
    label.textContent = 'Event:';
    Object.assign(label.style, { fontSize: '12px', opacity: '0.7', minWidth: '40px' });
    this.selectEl = document.createElement('select');
    Object.assign(this.selectEl.style, {
      flex: '1', padding: '6px 8px', borderRadius: '4px',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.08)', color: '#ffffff',
      fontSize: '13px', cursor: 'pointer', outline: 'none',
    });
    this.selectEl.addEventListener('change', () => {
      eventManager.setIndex(Number(this.selectEl.value));
    });
    wrap.append(label, this.selectEl);
    return wrap;
  }

  private buildInfoArea(): HTMLDivElement {
    this.infoEl = document.createElement('div');
    Object.assign(this.infoEl.style, {
      fontSize: '12px', lineHeight: '1.6', opacity: '0.85', marginBottom: '8px',
    });
    return this.infoEl;
  }

  private buildEnergyBar(): HTMLDivElement {
    var wrap = document.createElement('div');
    var barLabel = document.createElement('div');
    barLabel.textContent = 'Energy';
    Object.assign(barLabel.style, { fontSize: '11px', opacity: '0.5', marginBottom: '4px' });
    var barTrack = document.createElement('div');
    Object.assign(barTrack.style, {
      width: '100%', height: '6px', borderRadius: '3px',
      background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
    });
    this.energyBar = document.createElement('div');
    Object.assign(this.energyBar.style, {
      height: '100%', borderRadius: '3px',
      transition: 'width 0.4s ease, background 0.4s ease', width: '0%',
    });
    barTrack.appendChild(this.energyBar);
    wrap.append(barLabel, barTrack);
    return wrap;
  }

  // Toggle (supports both scene and post keys)
  private buildToggle(label: string, key: string): HTMLDivElement {
    var row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0',
    });
    var lbl = document.createElement('span');
    lbl.textContent = label;
    Object.assign(lbl.style, { fontSize: '13px' });
    var toggle = document.createElement('button');
    var self = this;
    var updateToggle = function() {
      var on: boolean;
      if (key === 'bloom') {
        on = self.postState.bloomEnabled ?? false;
      } else {
        on = !!(self.state as unknown as Record<string, boolean>)[key];
      }
      toggle.textContent = on ? 'ON' : 'OFF';
      Object.assign(toggle.style, {
        padding: '4px 14px', borderRadius: '12px',
        border: '1px solid ' + (on ? 'rgba(100,220,150,0.5)' : 'rgba(255,255,255,0.15)'),
        background: on ? 'rgba(100,220,150,0.15)' : 'rgba(255,255,255,0.05)',
        color: on ? '#64dc96' : '#aaa',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none',
        transition: 'all 0.2s ease',
      });
    };
    updateToggle();
    toggle.addEventListener('click', () => {
      if (key === 'bloom') {
        self.postState.bloomEnabled = !(self.postState.bloomEnabled ?? false);
        self.emitPost();
      } else {
        (self.state as unknown as Record<string, boolean>)[key] = !(self.state as unknown as Record<string, boolean>)[key];
        self.emit();
      }
      updateToggle();
    });
    row.append(lbl, toggle);
    return row;
  }

  // Range slider
  private buildRangeSlider(): HTMLDivElement {
    var wrap = document.createElement('div');
    var header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px',
    });
    var lbl = document.createElement('span');
    lbl.textContent = 'Energy Threshold';
    Object.assign(lbl.style, { fontSize: '12px' });
    this.rangeValueEl = document.createElement('span');
    this.rangeValueEl.textContent = String(this.state.acceptanceRange);
    Object.assign(this.rangeValueEl.style, {
      fontSize: '12px', fontWeight: '600', color: '#64dc96',
    });
    header.append(lbl, this.rangeValueEl);
    var slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '100';
    slider.value = String(this.state.acceptanceRange);
    Object.assign(slider.style, {
      width: '100%', height: '4px',
      background: 'rgba(255,255,255,0.1)', borderRadius: '2px', outline: 'none', cursor: 'pointer',
    });
    var self = this;
    slider.addEventListener('input', () => {
      self.state.acceptanceRange = Number(slider.value);
      self.rangeValueEl.textContent = slider.value;
      self.emit();
    });
    wrap.append(header, slider);
    return wrap;
  }

  // Post-processing slider
  private buildPostSlider(label: string, key: string, min: number, max: number, step: number, def: number): HTMLDivElement {
    var wrap = document.createElement('div');
    var header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', marginTop: '6px',
    });
    var lbl = document.createElement('span');
    lbl.textContent = label;
    Object.assign(lbl.style, { fontSize: '12px' });
    var valSpan = document.createElement('span');
    valSpan.textContent = def.toFixed(2);
    Object.assign(valSpan.style, {
      fontSize: '11px', fontWeight: '600', color: '#7eb8da', minWidth: '32px', textAlign: 'right',
    });
    header.append(lbl, valSpan);
    var slider = document.createElement('input');
    slider.type = 'range'; slider.min = String(min); slider.max = String(max);
    slider.step = String(step); slider.value = String(def);
    Object.assign(slider.style, {
      width: '100%', height: '3px',
      background: 'rgba(255,255,255,0.08)', borderRadius: '2px', outline: 'none', cursor: 'pointer',
    });
    var self = this;
    var mapKey: Record<string, string> = {
      bloomStrength: 'bloomStrength',
      bloomRadius: 'bloomRadius',
      bloomThreshold: 'bloomThreshold',
      toneMappingExposure: 'toneMappingExposure',
    };
    slider.addEventListener('input', () => {
      var v = Number(slider.value);
      valSpan.textContent = v.toFixed(2);
      (self.postState as any)[mapKey[key]] = v;
      self.emitPost();
    });
    wrap.append(header, slider);
    return wrap;
  }

  // Tone mapping select
  private buildToneMappingSelect(): HTMLDivElement {
    var wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
    });
    var lbl = document.createElement('label');
    lbl.textContent = 'Mode:';
    Object.assign(lbl.style, { fontSize: '12px', opacity: '0.7', minWidth: '40px' });
    var sel = document.createElement('select');
    Object.assign(sel.style, {
      flex: '1', padding: '5px 8px', borderRadius: '4px',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.08)', color: '#ffffff',
      fontSize: '12px', cursor: 'pointer', outline: 'none',
    });
    var modes = [
      { label: 'ACES Filmic', value: '4' },
      { label: 'Linear', value: '1' },
      { label: 'Reinhard', value: '5' },
      { label: 'Cineon', value: '3' },
    ];
    for (var i = 0; i < modes.length; i++) {
      var opt = document.createElement('option');
      opt.value = modes[i].value;
      opt.textContent = modes[i].label;
      if (modes[i].value === '4') opt.selected = true;
      sel.appendChild(opt);
    }
    var self = this;
    sel.addEventListener('change', () => {
      self.postState.toneMapping = Number(sel.value) as any;
      self.emitPost();
    });
    wrap.append(lbl, sel);
    return wrap;
  }

  // Color picker
  private buildColorPicker(): HTMLDivElement {
    var wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
    });
    var lbl = document.createElement('span');
    lbl.textContent = 'Tint Color';
    Object.assign(lbl.style, { fontSize: '13px' });
    var input = document.createElement('input');
    input.type = 'color';
    input.value = this.state.pyramidTint;
    Object.assign(input.style, {
      width: '40px', height: '30px', border: 'none', borderRadius: '4px',
      cursor: 'pointer', background: 'transparent',
    });
    var self = this;
    input.addEventListener('input', () => {
      self.state.pyramidTint = input.value;
      self.emit();
    });
    wrap.append(lbl, input);
    return wrap;
  }

  // Reset button
  private buildResetButton(): HTMLDivElement {
    var wrap = document.createElement('div');
    Object.assign(wrap.style, { marginTop: '4px' });
    var btn = document.createElement('button');
    btn.textContent = 'Reset All to Defaults';
    Object.assign(btn.style, {
      width: '100%', padding: '10px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.05)', color: '#ccc',
      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
      transition: 'all 0.2s ease', outline: 'none',
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.05)';
      btn.style.color = '#ccc';
    });
    var self = this;
    btn.addEventListener('click', () => {
      self.resetToDefaults();
      for (var i = 0; i < self.resetListeners.length; i++) {
        self.resetListeners[i]();
      }
    });
    wrap.appendChild(btn);
    return wrap;
  }

  // Public API
  populate(): void {
    var events = eventManager.getEvents();
    this.titleEl.textContent = eventManager.getTitle();
    this.selectEl.innerHTML = '';
    for (var i = 0; i < events.length; i++) {
      var option = document.createElement('option');
      option.value = String(i);
      option.textContent = events[i].name;
      this.selectEl.appendChild(option);
    }
    var current = eventManager.getCurrentEvent();
    if (current) this.updateEventDisplay(current);
  }

  getControls(): SceneControls {
    return { ...this.state };
  }

  onChange(listener: ControlChangeListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  onPostChange(listener: PostChangeListener): () => void {
    this.postListeners.push(listener);
    return () => { this.postListeners = this.postListeners.filter((l) => l !== listener); };
  }

  onReset(listener: ResetListener): () => void {
    this.resetListeners.push(listener);
    return () => { this.resetListeners = this.resetListeners.filter((l) => l !== listener); };
  }

  private emit(): void {
    var snapshot = this.getControls();
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](snapshot);
  }

  private emitPost(): void {
    var snapshot = { ...this.postState };
    for (var i = 0; i < this.postListeners.length; i++) this.postListeners[i](snapshot);
  }

  private updateEventDisplay(event: EventData): void {
    this.selectEl.value = String(eventManager.getCurrentIndex());
    var pctLabel = (event.intensity * 100).toFixed(0);
    this.infoEl.textContent = '';
    var nameLine = document.createElement('div');
    nameLine.innerHTML = '<strong>' + event.name + '</strong> (ID: ' + event.id + ')';
    var descLine = document.createElement('div');
    descLine.style.marginTop = '4px';
    descLine.textContent = event.description;
    var intLine = document.createElement('div');
    intLine.style.marginTop = '6px';
    intLine.textContent = 'Intensity: ' + pctLabel + '%';
    this.infoEl.append(nameLine, descLine, intLine);
    var maxEnergy = 1500;
    var pct = Math.min((event.energy / maxEnergy) * 100, 100);
    var r = Math.round(event.color[0] * 255);
    var g = Math.round(event.color[1] * 255);
    var b = Math.round(event.color[2] * 255);
    this.energyBar.style.width = pct + '%';
    this.energyBar.style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
  }


  private resetToDefaults(): void {
    // Reset scene controls
    this.state = {
      showModel: true,
      wireframe: false,
      skybox: true,
      acceptanceRange: 50,
      pyramidTint: '#ffffff',
    };
    // Reset post-processing state
    this.postState = {};
    // Re-render all controls to reflect defaults
    this.refreshControls();
  }

  private refreshControls(): void {
    // Update all toggle buttons
    var toggles = this.container.querySelectorAll('button');
    var self = this;
    toggles.forEach(function(btn) {
      var row = btn.parentElement;
      if (!row) return;
      var labelEl = row.querySelector('span');
      if (!labelEl) return;
      var labelText = labelEl.textContent || '';
      var on = false;
      if (labelText === 'Show Model') on = self.state.showModel;
      else if (labelText === 'Wireframe') on = self.state.wireframe;
      else if (labelText === 'Skybox') on = self.state.skybox;
      else if (labelText === 'Bloom') on = self.postState.bloomEnabled ?? false;
      else return; // not a toggle button
      btn.textContent = on ? 'ON' : 'OFF';
      Object.assign(btn.style, {
        border: '1px solid ' + (on ? 'rgba(100,220,150,0.5)' : 'rgba(255,255,255,0.15)'),
        background: on ? 'rgba(100,220,150,0.15)' : 'rgba(255,255,255,0.05)',
        color: on ? '#64dc96' : '#aaa',
      });
    });
    // Update range slider
    var rangeInputs = this.container.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(function(input) {
      var htmlInput = input as HTMLInputElement;
      var header = htmlInput.previousElementSibling;
      if (!header) return;
      var labelEl = header.querySelector('span:first-child');
      if (!labelEl) return;
      var labelText = labelEl.textContent || '';
      if (labelText === 'Energy Threshold') {
        htmlInput.value = '50';
        self.rangeValueEl.textContent = '50';
      } else if (labelText === 'Strength') {
        htmlInput.value = '0.6';
      } else if (labelText === 'Radius') {
        htmlInput.value = '0.4';
      } else if (labelText === 'Threshold') {
        htmlInput.value = '0.85';
      } else if (labelText === 'Exposure') {
        htmlInput.value = '1';
      }
      // Update the value span next to the slider header
      var valSpan = header.querySelector('span:last-child');
      if (valSpan && valSpan !== labelEl) {
        var v = parseFloat(htmlInput.value);
        valSpan.textContent = isNaN(v) ? htmlInput.value : v.toFixed(2);
      }
    });
    // Reset tone mapping select to ACES Filmic
    var selects = this.container.querySelectorAll('select');
    selects.forEach(function(sel) {
      if (sel === self.selectEl) return; // skip event selector
      sel.value = '4'; // ACES Filmic
    });
    // Reset color picker to default
    var colorInputs = this.container.querySelectorAll('input[type="color"]');
    colorInputs.forEach(function(input) {
      (input as HTMLInputElement).value = '#ffffff';
    });
  }
  dispose(): void {
    this.unsubscribe?.();
    this.container.remove();
  }
}