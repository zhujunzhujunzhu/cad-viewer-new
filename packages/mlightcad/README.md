# mlightcad

This is the main frontend application for MLightCAD. It provides the user interface, state management, and integration with rendering engines for viewing and editing DWG/DXF files in the browser.

## Key Features
- Modern UI for CAD editing and viewing
- State management for layers, entities, and settings
- Integration with SVG and THREE.js renderers
- Dialogs, toolbars, and command line interface

## Directory Structure (partial)
- `src/app/` – Application entry, store, and main logic
- `src/component/` – UI components (dialogs, toolbars, status bar, etc.)
- `src/composable/` – Vue composables for state and logic
- `src/locale/` – Internationalization files
- `src/style/` – Stylesheets
- `src/svg/` – SVG assets

## Usage
This package is intended to be run as a web application. Entry point: `src/app/index.ts`.

## Role in MLightCAD
This package provides the main user interface and connects to the rendering and document management subpackages.