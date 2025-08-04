# three-renderer

This package implements the THREE.js-based rendering engine for MLightCAD. It renders DWG/DXF entities as interactive 2D/3D graphics using THREE.js.

## Key Features
- Renders CAD entities as THREE.js objects
- Supports 2D and 3D views, layers, and styles
- Batch rendering for performance
- Custom shaders for hatches and line patterns

## Directory Structure (partial)
- `src/AcTrRenderer.ts` – Main THREE.js renderer
- `src/batch/` – Batched geometry and group rendering
- `src/geometry/` – Geometry helpers (arrows, points, etc.)
- `src/object/` – THREE.js object wrappers for CAD entities
- `src/style/` – Style and shader management
- `src/viewport/` – View and camera management

## Usage
Import and use `AcTrRenderer` from `src/AcTrRenderer.ts` to render entities using THREE.js.

## Role in MLightCAD
This package provides the 2D/3D rendering backend for the main application, enabling interactive graphics and advanced visualization.