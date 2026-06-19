export interface PedestalData {
  detectorName: string;
  date: string;
  time: string;
  modules: number[][][]; // modules[modIndex][row][col]
}

export interface GeometryPlane {
  name: string;
  startTriangle: string;
  direction: string;
  positions: number[];
  zPosition: number;
  cellSpacing: number;
  dTheta: number;
}

export interface GeometryData {
  detectorName: string;
  date: string;
  time: string;
  planes: GeometryPlane[];
}

export interface AdcMapEntry {
  module: number;
  layerName: string;
  channels: number[][]; // 4 rows of 16
}

export interface AdcMapData {
  detectorName: string;
  date: string;
  time: string;
  entries: AdcMapEntry[];
}

function parseDetectorHeader(line: string): { detectorName: string; date: string; time: string } {
  const parts = line.trim().split(/\s+/);
  return {
    detectorName: parts[0] || '',
    date: parts[1] || '',
    time: parts[2] || '',
  };
}

export class MuonDataLoader {
  async loadPedestal(url: string): Promise<PedestalData> {
    const text = await (await fetch(url)).text();
    return this.parsePedestal(text);
  }

  parsePedestal(text: string): PedestalData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const header = parseDetectorHeader(lines[0]);
    const modules: number[][][] = [];
    let currentModule: number[][] | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^Mod\d+/.test(line)) {
        if (currentModule) modules.push(currentModule);
        currentModule = [];
      } else if (currentModule) {
        const nums = line.split(/\s+/).map(Number);
        currentModule.push(nums);
      }
    }
    if (currentModule) modules.push(currentModule);

    return {
      detectorName: header.detectorName,
      date: header.date,
      time: header.time,
      modules,
    };
  }

  async loadGeometry(url: string): Promise<GeometryData> {
    const text = await (await fetch(url)).text();
    return this.parseGeometry(text);
  }

  parseGeometry(text: string): GeometryData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Skip GEOMETRY header and comments, find detector header
    let headerIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^[A-Z]{4,5}\s+\d{2}[A-Z]{3}\d{4}/.test(lines[i])) {
        headerIdx = i;
        break;
      }
    }
    const header = parseDetectorHeader(lines[headerIdx]);
    const planes: GeometryPlane[] = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      // Match plane lines: name startTriangle direction NORMAL pos1 pos2 ... zPos cellSpacing OFF dTheta
      const parts = line.split(/\s+/);
      if (parts.length >= 5 && parts[2] === 'NORMAL') {
        // Parse: P0_X-Layer_1 Pyramid NORMAL -27.0 -19.0 ... zPos cellSpacing OFF dTheta
        // The positions are between NORMAL and the last 4 tokens (zPos, cellSpacing, OFF, dTheta)
        // But actually the format is variable length positions
        const name = parts[0];
        const startTriangle = parts[1];
        // parts[2] is NORMAL
        // Find OFF keyword to determine end of positions
        let offIdx = parts.indexOf('OFF', 3);
        if (offIdx === -1) offIdx = parts.length - 1;

        // Last 4 items before or at OFF: ... zPos cellSpacing OFF dTheta
        // Actually: positions..., zPos, cellSpacing, OFF, dTheta
        const dTheta = offIdx + 1 < parts.length ? parseFloat(parts[offIdx + 1]) : 0;
        const cellSpacing = offIdx - 1 >= 3 ? parseFloat(parts[offIdx - 1]) : 1.95;
        const zPosition = offIdx - 2 >= 3 ? parseFloat(parts[offIdx - 2]) : 0;
        const positions = parts.slice(3, offIdx - 2).map(Number);

        // Direction is inferred from name convention, but we store empty since it's not in the parsed tokens explicitly
        // Actually looking again: name startTriangle direction NORMAL ...
        // Hmm, re-reading: "P0_X-Layer_1 Pyramid NORMAL -27.0 ..."
        // There's no separate "direction" field between startTriangle and NORMAL
        // The original spec says: plane_name, start_triangle, direction, NORMAL, positions...
        // But the example shows: P0_X-Layer_1 Pyramid NORMAL ...
        // Let me treat parts[1] as startTriangle, and direction as empty/derived from name
        const direction = name.includes('_X-') ? 'X' : name.includes('_Y-') ? 'Y' : '';

        planes.push({ name, startTriangle, direction, positions, zPosition, cellSpacing, dTheta });
      }
    }

    return {
      detectorName: header.detectorName,
      date: header.date,
      time: header.time,
      planes,
    };
  }

  async loadAdcMap(url: string): Promise<AdcMapData> {
    const text = await (await fetch(url)).text();
    return this.parseAdcMap(text);
  }

  parseAdcMap(text: string): AdcMapData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const header = parseDetectorHeader(lines[0]);
    const entries: AdcMapEntry[] = [];
    let currentModule = -1;
    let currentLayerName = '';
    let currentChannels: number[][] = [];

    const flushEntry = () => {
      if (currentModule >= 0 && currentLayerName && currentChannels.length > 0) {
        entries.push({ module: currentModule, layerName: currentLayerName, channels: currentChannels });
      }
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const modMatch = line.match(/^Mod(\d+)/);
      if (modMatch) {
        flushEntry();
        currentModule = parseInt(modMatch[1]);
        currentLayerName = '';
        currentChannels = [];
        continue;
      }
      // Layer name line (e.g. "X1", "Y1") - short alphanumeric
      if (/^[XY]\d+$/.test(line)) {
        flushEntry();
        currentLayerName = line;
        currentChannels = [];
        continue;
      }
      // Channel data row (4 rows of 16 numbers per module/layer)
      if (currentModule >= 0 && currentLayerName) {
        const nums = line.split(/\s+/).map(Number);
        if (nums.length === 16) {
          currentChannels.push(nums);
        }
      }
    }
    flushEntry();

    return {
      detectorName: header.detectorName,
      date: header.date,
      time: header.time,
      entries,
    };
  }

  async loadAll(baseUrl: string): Promise<{ pedestal: PedestalData; geometry: GeometryData; adcMap: AdcMapData }> {
    const [pedestal, geometry, adcMap] = await Promise.all([
      this.loadPedestal(`${baseUrl}/pedestal.txt`),
      this.loadGeometry(`${baseUrl}/geometry_header.txt`),
      this.loadAdcMap(`${baseUrl}/adcmap.txt`),
    ]);
    return { pedestal, geometry, adcMap };
  }
}
