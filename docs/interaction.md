---
title: Moving about
order: 20
---

# Moving about

## Pointer, wheel, touch

| Gesture | Effect |
|---|---|
| Drag (mouse: the main button; a finger; a pen) | moves the graph. Under 4 px it is still a click: a link in a node stays a link. Past 4 px the click that ends the drag is swallowed |
| Ctrl / ⌘ + wheel, a trackpad pinch | zooms on the pointer: the point under it stays where it is |
| Two fingers | zoom on their middle, and their middle drags the graph; one finger left after a pinch drags on |
| The wheel alone | scrolls the page; in full screen it moves the graph |
| A click on a node | dispatches `graph:select`; with `lineage: 'select'` it lights the node's line, or puts it out when it is lit already |
| A click on the ground | with `lineage: 'select'`, puts the lit line out |

A drag never starts from a form field (`input`, `textarea`, `select`), a `contenteditable` element
or anything inside a `[data-graph-nodrag]` element. The browser's own drag of a link or a picture
inside a node is prevented. A mouse wheel (notches of 50 or more) zooms by smaller factors than
the small steps of a trackpad pinch, so both feel alike; a step is capped at 240 px of wheel.

## The keyboard

With `keyboard` on (the default), the viewport is focusable (`tabindex="0"`) and, once it or a
node inside it has the focus:

| Key | Effect |
|---|---|
| Arrows | move the graph by 60 px; with Shift, by 240 px |
| `+` or `=` | `zoomIn()` |
| `-` or `_` | `zoomOut()` |
| `0` | `fit()` |
| `Home` | `center(focus)` when a `focus` is set, else `fit()` |
| `F` or `f` | `fullscreen()`: on, or off |
| Tab | goes through what is focusable among the nodes (nodes that are links, links inside cards), in the page's order; a node that takes the focus from the keyboard (`:focus-visible`) is brought into view (`reveal()`) |

A key pressed with Ctrl, ⌘ or Alt is left to the browser, and so is any key typed in a form
field or a `contenteditable` element inside a node. A node that takes the focus does not scroll
the viewport (the browser's scrolling into view is undone): the graph moves instead.

## Full screen

`fullscreen()` (the fourth button, the `F` key) asks the browser to show the graph's element in
full screen (the Fullscreen API). Where there is none (an iPhone), or the browser refuses, the
element gets the class `is-fullscreen` and the stylesheet makes it cover the window (`position:
fixed`, the highest `z-index`). `fullscreen(false)` leaves either. The class `is-fullscreen` is
also set while the browser shows the element in full screen (`fullscreenchange`), so a stylesheet
hooks on one class. In full screen the wheel alone moves the graph.

## The first view

When a graph is placed for the first time (its nodes measured, its viewport with a size), it
opens on:

1. the remembered view, when `remember` is on and one was kept for this graph, with the same
   `focus` and the same number of nodes;
2. else, when a `focus` is set and the whole graph would be shown at less than 0.7 of its size,
   the focused node in the middle at its natural size (scale 1);
3. else the whole graph (`fit()`), never larger than its natural size.

`setData()` places the graph again in the same way, unless it is given `{keepView: true}`.

When the viewport changes size afterwards (the window, a panel), what was in the middle stays in
the middle; the zoom does not change.

## The remembered view

With `remember` on, each move of the view writes, once per animation frame, in `sessionStorage`
under `graphjs:` + the key (the `key` option, else the element's `id`, else the page's path and
query string) a record of this shape:

```json
{"cx": 412, "cy": 230, "scale": 0.8, "focus": "me", "nodes": 17}
```

`cx`, `cy` are the point of the graph in the middle of the view, so the view comes back right in
a window of another size. A view kept for another focus or another number of nodes is not given
back. Two graphs of a page without `id` and without `key` share one key: give each an `id` or a
`data-graph-key`. In a private window, or with the storage full, nothing is kept and nothing
fails.

## The lit line

A node's line is the node, everything it descends from and everything that descends from it
(`lineage()` of [The layout](layout.md#lineage)). Lit, its nodes and edges get the class
`is-lineage`, the element gets `has-lineage`, and the stylesheet dims everything else
(`--graph-dim`) and draws the lit edges in `--graph-accent`.

| `lineage` | Lit by |
|---|---|
| `hover` (default) | pointing at a node (not by touch) and giving it the focus; leaving it lights the pinned node again, if any |
| `select` | a click on a node, which keeps it lit; a second click on it, or a click on the ground, puts it out. A `graph:select` whose `preventDefault()` was called lights nothing |
| `off` | nothing but `highlight()` |

`highlight(id)` lights a node's line and keeps it lit (the pinned node) whatever the mode;
`highlight(null)` puts it out.

> [!WARNING]
> Known defect: the lit line follows every edge of the data, the ones the layout set aside
> included: an edge that closes a cycle is not drawn, yet the nodes it leads to are lit, where
> only the drawn edges are expected to count (`src/js/graph.js` `_light()` passes `this.data` to
> `lineage()`, not the edges of `this.result`).
