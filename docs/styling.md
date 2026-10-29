---
title: Styling
order: 50
---

# Styling

The stylesheet (`src/css/index.css`) reads only `--graph-*` variables. Set them
on the `[data-graph]` element or on anything above it, with any selector.

## The variables

| Variable | Default (light) | Dark | |
|---|---|---|---|
| `--graph-height` | `32rem` | | the height of the view |
| `--graph-bg` | `#f6f5f1` | `#1b1a17` | the ground |
| `--graph-grid` | `rgba(40, 36, 28, .11)` | `rgba(240, 234, 220, .09)` | its dots, every 20 px (`transparent`: no dots) |
| `--graph-border` | `rgba(40, 36, 28, .16)` | `rgba(240, 234, 220, .16)` | the frame |
| `--graph-radius` | `6px` | | the frame's corners, and the buttons' block |
| `--graph-node-bg` | `#fffefb` | `#26241f` | a node |
| `--graph-node-color` | `#23211c` | `#ece7da` | a node's text (and the element's) |
| `--graph-node-border` | `rgba(40, 36, 28, .28)` | `rgba(240, 234, 220, .26)` | a node's border |
| `--graph-node-radius` | `5px` | | a node's corners |
| `--graph-node-padding` | `.55rem .8rem` | | |
| `--graph-node-shadow` | `0 1px 0 rgba(40, 36, 28, .08)` | `0 1px 0 rgba(0, 0, 0, .4)` | |
| `--graph-node-font` | `inherit` | | the `font` shorthand of a node |
| `--graph-node-min-width`, `--graph-node-max-width` | `7rem`, `15rem` | | a node is as wide as its content between the two |
| `--graph-sub-color` | `#6c675c` | `#a8a292` | a node's second line, and a skipped or canceled node's text |
| `--graph-edge` | `#8d877a` | `#7d776a` | an edge, and a junction's ring |
| `--graph-edge-width` | `1.5px` | | an edge; a lit edge is 0.5 px wider |
| `--graph-accent` | `#1f4e79` | `#8fb8e0` | the focused node, the lit line, the keyboard focus, a link node under the pointer |
| `--graph-dim` | `.32` | | the opacity of what is off the lit line |
| `--graph-control-bg`, `--graph-control-color`, `--graph-control-border` | `#fffefb`, `#23211c`, `rgba(40, 36, 28, .28)` | `#26241f`, `#ece7da`, `rgba(240, 234, 220, .26)` | the buttons |
| `--graph-success` | `#2e7650` | `#6cba8d` | the states |
| `--graph-failed` | `#ad3329` | `#e58076` | |
| `--graph-running` | `#2a5d9f` | `#86b0e6` | |
| `--graph-warning` | `#9a6a12` | `#d8a94a` | `warning` and `manual` |
| `--graph-pending` | `#8a857a` | `#8f897c` | `pending`, and any other state |

Two variables are set for a stylesheet to read, not to be set: `--graph-scale` on the element (the
current zoom, written by the script at every move) and `--graph-state` on a node with a state (the
colour of its state).

Dark values apply under `prefers-color-scheme: dark`; `data-graph-theme="light"`
or `"dark"` on the element forces one. A site with its own theme switch sets
the variables under its own selector (for instance `[data-theme="dark"] .graph`, loaded after
the stylesheet), or writes its theme into `data-graph-theme`.

The stylesheet never declares a `--graph-*` variable on the element: its defaults, the dark
values and the presets' values are fallbacks of private tokens (`--_graph-bg:
var(--graph-bg, #f6f5f1)` on `.graph`, and so on), which its rules read. So a value set by the
site always wins over them, whatever its selector's specificity and wherever it is set: on the
element with one class, on a wrapper, on `:root` for every graph of the site. Inside the graph
(on the element's children) every `--graph-*` is set back to the value in force, so a site's own
rule for a node's content reads `var(--graph-sub-color)` or `var(--graph-accent)` as expected.

```css
:root {                 /* every graph of the site */
    --graph-accent: var(--ink-red);
}
.my-tree {              /* one class is enough, before or after src/css/index.css */
    --graph-bg: var(--paper);
    --graph-node-bg: var(--paper-raised);
    --graph-node-font: 500 .95rem/1.25 var(--font-text);
}
.my-tree .dates { color: var(--graph-sub-color); }
```

A value the site sets is the same in light and in dark (it replaces both); for a different dark
value, the site sets it under its own `@media (prefers-color-scheme: dark)` or theme selector.
The private `--_graph-*` tokens are the stylesheet's own: set the public names, not those.

## Classes and attributes to hook on

| | |
|---|---|
| `.graph`, `.graph.is-ready`, `.is-dragging`, `.is-gliding`, `.is-fullscreen`, `.has-lineage` | the element |
| `.graph-viewport`, `.graph-canvas`, `.graph-edges`, `.graph-controls`, `.graph-control-zoomIn` … | its parts |
| `.graph-node`, `.is-focus`, `.is-lineage`, `[data-graph-state]`, `[data-graph-kind]`, `[data-graph-placed-rank]` | a node |
| `.graph-node-label`, `.graph-node-sub` | the two lines `setData()` writes |
| `.graph-edge`, `.graph-edge-flat`, `.is-lineage`, `[data-graph-edge="from to"]`, `[data-graph-state]` (the state of the node it reaches), `[data-graph-kind]` | an edge |

The full list, with when each is set: [Classes and attributes the script sets](reference.md#classes-and-attributes-the-script-sets).

## States

| State | A node | An edge reaching it |
|---|---|---|
| `success` | `--graph-success` | drawn in `--graph-success` |
| `failed` | `--graph-failed` | drawn in `--graph-failed` |
| `running` | `--graph-running` | drawn in `--graph-running`, dashed, the dashes flowing |
| `warning` | `--graph-warning` | as any edge |
| `manual` | `--graph-warning` | dotted |
| `pending` | `--graph-pending` | dotted |
| `skipped`, `canceled` | `--graph-pending`, a dashed border, the text in `--graph-sub-color` | dotted |

Outside the `pipeline` preset, a node's state colour is only set in `--graph-state` (and the
dashed border of `skipped` and `canceled`): the `pipeline` preset draws it as a disc. A stylesheet
uses it elsewhere, for instance `.graph-node[data-graph-state] { border-left: 3px solid var(--graph-state); }`.
Under `prefers-reduced-motion: reduce` nothing turns or flows, and the view does not glide.

## Presets

- `tree`: `direction: down`, `edges: step`, centred cards.
- `pipeline`: `direction: right`, `edges: curve`, pill-shaped jobs with a disc
  for the state (ring: pending, turning: running, full: success or failed,
  dotted: skipped or canceled), no dots on the ground.

A preset only sets defaults: the element's `data-graph-*` attributes win over
it, the options given to `new Graph()` over both.

What each preset's stylesheet sets, on `.graph[data-graph-preset="..."]` (as defaults: a
variable the site sets wins over the preset's value too):

| Preset | Variables | Nodes |
|---|---|---|
| `tree` | `--graph-node-padding: .5rem .75rem`, `--graph-node-min-width: 8.5rem`, `--graph-node-max-width: 12.5rem` | text centred |
| `pipeline` | `--graph-node-padding: .4rem .8rem .4rem 2rem`, `--graph-node-radius: 999px`, `--graph-node-min-width: 8rem`, `--graph-grid: transparent` | on one line (`nowrap`), the label at weight 500, a disc of 0.8rem at the head in the state's colour; a failed job's border in `--graph-failed` |

The script's half of a preset (direction, edges, gaps) is in [Presets](graph.md#presets).

## Junctions

A node `[data-graph-kind="junction"]` is a ring of 14 px in `--graph-edge` on `--graph-bg`, without
padding nor shadow: a union in a family tree, a gate in a pipeline. Given as data without a
`label`, it has no text.
