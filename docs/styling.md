---
title: Styling
order: 3
---

# Styling

The stylesheet (`src/css/index.css`) reads only `--graph-*` variables. Set them
on the `[data-graph]` element or on anything above it.

| Variable | |
|---|---|
| `--graph-height` | the height of the view (32rem) |
| `--graph-bg`, `--graph-grid` | the ground and its dots (`transparent`: no dots) |
| `--graph-border`, `--graph-radius` | the frame |
| `--graph-node-bg`, `--graph-node-color`, `--graph-node-border`, `--graph-node-radius`, `--graph-node-padding`, `--graph-node-shadow`, `--graph-node-font`, `--graph-node-min-width`, `--graph-node-max-width` | a node |
| `--graph-sub-color` | a node's second line |
| `--graph-edge`, `--graph-edge-width` | an edge |
| `--graph-accent` | the focused node, the lit line, the keyboard focus |
| `--graph-dim` | the opacity of what is off the lit line |
| `--graph-control-bg`, `--graph-control-color`, `--graph-control-border` | the buttons |
| `--graph-success`, `--graph-failed`, `--graph-running`, `--graph-warning`, `--graph-pending` | the states |

Dark values apply under `prefers-color-scheme: dark`; `data-graph-theme="light"`
or `"dark"` on the element forces one. A site with its own theme switch sets
the variables under its own selector.

```css
.my-tree {
    --graph-bg: var(--paper);
    --graph-node-bg: var(--paper-raised);
    --graph-node-font: 500 .95rem/1.25 var(--font-text);
    --graph-accent: var(--ink-red);
}
```

## Classes and attributes to hook on

| | |
|---|---|
| `.graph`, `.graph.is-ready`, `.is-dragging`, `.is-gliding`, `.is-fullscreen`, `.has-lineage` | the element |
| `.graph-viewport`, `.graph-canvas`, `.graph-edges`, `.graph-controls`, `.graph-control-zoomIn` … | its parts |
| `.graph-node`, `.is-focus`, `.is-lineage`, `[data-graph-state]`, `[data-graph-kind]`, `[data-graph-placed-rank]` | a node |
| `.graph-node-label`, `.graph-node-sub` | the two lines `setData()` writes |
| `.graph-edge`, `.graph-edge-flat`, `.is-lineage`, `[data-graph-edge="from to"]`, `[data-graph-state]` (the state of the node it reaches), `[data-graph-kind]` | an edge |

## Presets

- `tree`: `direction: down`, `edges: step`, centred cards.
- `pipeline`: `direction: right`, `edges: curve`, pill-shaped jobs with a disc
  for the state (ring: pending, turning: running, full: success or failed,
  dotted: skipped or canceled), no dots on the ground.

A preset only sets defaults: the element's `data-graph-*` attributes win over
it, the options given to `new Graph()` over both.
