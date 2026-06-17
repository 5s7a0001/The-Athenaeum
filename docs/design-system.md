# Design System - The Athenaeum

This document details the visual components, color palettes, typography, responsive layers, and sound triggers that form the interactive workspace.

## 1. Color Palette

Every color is selected to match 17th-century oil canvases under dim, warm, localized candle lighting.

| Token | Hex Code | Canvas Representation | App Application |
| :--- | :--- | :--- | :--- |
| **Background** | `#0f0b08` | Pitch-black oil canvas shadow | Main page canvas background, deep margins |
| **Secondary** | `#1a1410` | Dark stained oak desk wood | Book spine bindings, typewriter keyboard frame |
| **Paper** | `#d4c3a3` | Aged linen parchment / fiber paper | Typewriter sheet, calendar background, open books |
| **Gold** | `#b08d57` | Gold leaf / brass accents | Book spine titles, fountain pen metal nib, brass settings dials |
| **Ink** | `#1c1611` | Walnut gall ink / charcoal print | Typed character letters, pen markings, lines |
| **Dark Brown**| `#2f2118` | Varnished chestnut/walnut woods | Typewriter side panels, wooden desk edges |
| **Accent** | `#8b6a3f` | Warm beeswax seal / copper metal | Highlight states, calendar selectors, active focus glow |

## 2. Typography

We use Google Fonts to render classical scholarly texts and mechanical typewriter text:

* **Headings:** `Cormorant Garamond` (Serif). Used for book headers, dates, and titles. Elegant, high-contrast serif.
* **Body Text:** `EB Garamond` (Serif). Used for journal pages, description fields, and settings text. Warm, readable classical serif.
* **Typewriter Output:** `Special Elite` (Monospace). Used exclusively on the typewriter paper for typed agendas and lists. Mimics a physical stamp-ink machine.

## 3. The Chiaroscuro Grid Layout

The desk is structured as an interactive still-life image using absolute positioning, scaling to fit the browser height/width while retaining a 16:9 aspect ratio.

```
+-------------------------------------------------------------+
| [Top Left]                                     [Right]      |
| Flower arrangement (swaying)                   Stack of 4   |
|                                                Books:       |
|                [Center]                        - Monthly    |
|                Typewriter Component            - Weekly     |
|                (Paper scrolls up)              - Archive    |
|                                                - Settings   |
| [Bottom Left]                                               |
| Permanent Month Calendar                       [Bottom Right]|
| (Zoomable Parchment)                           Teacup       |
|                                                (Focus Mode) |
+-------------------------------------------------------------+
```

## 4. Tactile Mechanics

* **Typewriter Keys:** Round buttons that depress vertically (`translate-y-[2px]`) when clicked or during the ritual typing loop.
* **Page Turning:** Open books use a folding clip path or rotational transition (`rotateY`) to simulate a double-page leather journal layout opening and closing.
* **Fountain Pen Stroke:** Crossing off tasks uses an SVG animated dash-offset path that draws a fluid, organic stroke across the task text, matching walnut ink color (`#1c1611`).

## 5. Sound Design System

* **Key Tap:** High-pitched metallic typewriter click. Plays when letters are typed.
* **Carriage Return:** Heavy mechanical sliding sound ending in a brass "ding" bell. Plays when starting a new line.
* **Pen Scratch:** Fibrous scratch of a sharp pen nib over paper. Plays when completing a task.
* **Ambiance Loop:** Subtle background hum of crackling fireplace or rain. Toggleable from Settings.
