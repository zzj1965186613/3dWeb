import * as THREE from 'three';

export interface MuonHit {
  x: number;
  y: number;
  layer: number;
}

export interface MuonTrajectory {
  hits: MuonHit[];
  direction: THREE.Vector3;
  entryPoint: THREE.Vector3;
  line: THREE.Line | null;
}

export class MuonVectorVisualizer {
  private group: THREE.Group;
  private trajectories: MuonTrajectory[];
  private maxTrajectories: number;

  constructor(group: THREE.Group, maxTrajectories: number = 100) {
    this.group = group;
    this.trajectories = [];
    this.maxTrajectories = maxTrajectories;
  }

  createTrajectory(hits: MuonHit[]): MuonTrajectory | null {
    if (hits.length < 2) return null;

    // Sort hits by layer (top to bottom = high y to low y)
    const sorted = [...hits].sort((a, b) => b.layer - a.layer);

    // Compute direction from first to last hit
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const dir = new THREE.Vector3(
      last.x - first.x,
      last.y - first.y,
      (last.layer - first.layer) * -50 // layers spaced vertically
    ).normalize();

    const entryPoint = new THREE.Vector3(first.x, first.y, first.layer * 50);

    // Create line geometry extending slightly beyond first and last hits
    const points: THREE.Vector3[] = [];

    // Extrapolate entry point above first layer
    const ext = 30;
    points.push(new THREE.Vector3(
      first.x - dir.x * ext / dir.y * (dir.y > 0 ? 1 : -1),
      first.y + ext,
      first.layer * 50 + ext * dir.z / Math.abs(dir.y || 1)
    ));

    for (const hit of sorted) {
      points.push(new THREE.Vector3(hit.x, hit.y, hit.layer * 50));
    }

    // Extrapolate below last layer
    points.push(new THREE.Vector3(
      last.x + dir.x * ext / Math.abs(dir.y || 1),
      last.y - ext,
      last.layer * 50 - ext * dir.z / Math.abs(dir.y || 1)
    ));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
    });
    const line = new THREE.Line(geometry, material);

    const trajectory: MuonTrajectory = {
      hits: sorted,
      direction: dir,
      entryPoint,
      line,
    };

    return trajectory;
  }

  addTrajectory(trajectory: MuonTrajectory): void {
    // Enforce max trajectories
    while (this.trajectories.length >= this.maxTrajectories) {
      const oldest = this.trajectories.shift();
      if (oldest?.line) {
        this.group.remove(oldest.line);
        oldest.line.geometry.dispose();
        (oldest.line.material as THREE.Material).dispose();
      }
    }

    this.trajectories.push(trajectory);
    if (trajectory.line) {
      this.group.add(trajectory.line);
    }
  }

  clearTrajectories(): void {
    for (const t of this.trajectories) {
      if (t.line) {
        this.group.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
      }
    }
    this.trajectories = [];
  }

  generateSampleTrajectories(count: number): void {
    for (let i = 0; i < count; i++) {
      // Random entry point from above
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;

      // Angular spread: slight tilt from vertical
      const angleX = (Math.random() - 0.5) * 0.4; // ~23 degrees max
      const angleZ = (Math.random() - 0.5) * 0.4;

      const layerSpacing = 50;
      const hits: MuonHit[] = [];

      for (let layer = 0; layer < 3; layer++) {
        const y = 100 - layer * layerSpacing;
        const hitX = x + Math.tan(angleX) * layer * layerSpacing;
        const hitZ = z + Math.tan(angleZ) * layer * layerSpacing;
        hits.push({ x: hitX, y, layer });
      }

      const trajectory = this.createTrajectory(hits);
      if (trajectory) {
        this.addTrajectory(trajectory);
      }
    }
  }

  getGroup(): THREE.Group {
    return this.group;
  }
}
