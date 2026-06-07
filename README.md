# 3DWeb - Pyramid Visualization

A data-driven 3D pyramid visualization web app built with Three.js, featuring event switching, post-processing effects, and real-time metric charts.

Inspired by [i2u2 Cosmic Ray Pyramid Display](https://www.i2u2.org/elab/cosmic/pyramid-display/pyramid.html).

## Tech Stack

- **Build**: Vite 5 + TypeScript + pnpm
- **3D Rendering**: Three.js (ESM) + OrbitControls + STLLoader + TextureLoader
- **Post-Processing**: EffectComposer + RenderPass + UnrealBloomPass
- **Charts**: Chart.js

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Project Structure

```
3dWeb/
  index.html
  package.json
  tsconfig.json
  public/
    assets/
      models/pyramid.stl        # Pyramid 3D model
      images/pyramid.jpeg        # Pyramid texture
    data/
      sample.json                # Event data source
  src/
    main.ts                      # App entry point
    core/
      scene.ts                   # Scene & lights setup
      camera.ts                  # Camera & renderer
      loaders.ts                 # STL & texture loaders
      postprocessing.ts          # EffectComposer & bloom
    domain/
      pyramid.ts                 # Pyramid model builder
      events.ts                  # Event data manager
      applyEvent.ts              # Event -> mesh mapper
      charts.ts                  # Chart.js metric panel
    ui/
      Layout.ts                  # Sidebar + canvas layout
      ControlPanel.ts            # Interactive controls
```

## Features

### 3D Pyramid Model

- STL model with JPEG texture mapping
- OrbitControls for rotate, zoom, and pan
- Responsive resize handling via ResizeObserver

### Event-Driven Visualization

- Load event data from JSON (`public/data/sample.json`)
- Switch between events via dropdown selector
- Each event maps to visual attributes: color, emissive, roughness, metalness, scale
- Scene updates in-place without full rebuild

### Control Panel

- **Show Model** - toggle pyramid and ground visibility
- **Wireframe** - toggle wireframe rendering
- **Skybox** - toggle background skybox sphere
- **Acceptance Range** - energy threshold slider that dims out-of-range events

### Post-Processing

- **Bloom** toggle with Strength / Radius / Threshold sliders
- **Tone Mapping** mode selector (ACES Filmic, Linear, Reinhard, Cineon)
- **Exposure** slider
- **Reset All to Defaults** button

### Metrics Chart

- Chart.js bar chart showing event metrics: Energy, Intensity, Roughness, Metalness, Scale
- Auto-updates with animated transitions on event switch
- Bar colors match the current event color

## Event Data Format

Edit `public/data/sample.json` to add or modify events:

```json
{
  "title": "Cosmic Ray Events",
  "events": [
    {
      "id": 1,
      "name": "Low Energy Shower",
      "energy": 120,
      "intensity": 0.3,
      "color": [0.2, 0.5, 1.0],
      "emissive": [0.05, 0.1, 0.3],
      "roughness": 0.7,
      "metalness": 0.1,
      "scale": 0.8,
      "description": "A low-energy cosmic ray shower."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique event identifier |
| `name` | string | Display name |
| `energy` | number | Energy value (0-1500) |
| `intensity` | number | Brightness intensity (0-1) |
| `color` | [r, g, b] | Base color (0-1 per channel) |
| `emissive` | [r, g, b] | Emissive glow color (0-1) |
| `roughness` | number | Material roughness (0-1) |
| `metalness` | number | Material metalness (0-1) |
| `scale` | number | Model scale multiplier |
| `description` | string | Event description text |

## Replacing Assets

- **3D Model**: Replace `public/assets/models/pyramid.stl` with any binary STL file
- **Texture**: Replace `public/assets/images/pyramid.jpeg` with any JPEG image

## License

Private project.