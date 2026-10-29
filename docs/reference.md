---
title: API
order: 30
---

# API

## Static

| Member | Returns | Effect |
|---|---|---|
| `Graph.ready(root = document, options = {})` | `Graph[]` | starts the `[data-graph]` elements under `root` (and `root` itself when it matches) that are not started yet, with `options`; returns every graph found, the ones started before included. Outside a browser (no `document`) returns `[]` |
| `Graph.get(element)` | `Graph` or `null` | the graph of an element |
| `Graph.layout`, `Graph.path`, `Graph.lineage` | functions | the functions of `src/js/layout.js`, for a page that loaded only the class (see [The layout](layout.md)) |
| `Graph.presets` | object | `{tree: {...}, pipeline: {...}}`: the options each preset sets (see [Presets](graph.md#presets)) |
| `new Graph(element, options = {})` | `Graph` | starts a graph on `element`; the graph it has already, when it has one |

## Instance methods

Every method but `isFullscreen()` and `destroy()` returns the graph, so calls chain:
`graph.setData(data).center('me', {scale: 1})`.

| Method | Effect |
|---|---|
| `setData({nodes, edges}, {focus, keepView} = {})` | replaces the graph: see [Given as data](graph.md#given-as-data) |
| `refresh()` | reads the declared nodes again (`data-graph-node`, `-from`, `-rank`, `-state` of the elements in the canvas) and lays them out: the server changed them. Nodes added to the element after the start must be put in the canvas first (`graph.canvas.appendChild(el)`): only the canvas is read |
| `layout()` | measures every node, places them, draws the edges again; dispatches `graph:layout`. Call it when a node changed size |
| `setState(id, state)` | sets (or, with an empty `state`, removes) a node's `data-graph-state` and the state of every edge that reaches it, without laying anything out again |
| `fit({animate} = {})` | shows the whole graph, centred, never larger than its natural size, within `padding`, `minZoom` and `maxZoom` |
| `center(id, {scale, animate} = {})` | puts a node in the middle of the view; `scale` changes the zoom too (clamped). An unknown id does nothing |
| `reveal(id, margin = 16)` | moves the view just enough for a node to be seen whole, `margin` px from the edges, gliding |
| `zoomTo(scale, at, {animate} = {})` | zooms to `scale` (clamped to `minZoom`..`maxZoom`), the point `at` (`{x, y}` in px from the viewport's top left; default: its middle) staying where it is |
| `zoomIn()`, `zoomOut()` | `zoomTo()` the scale times or divided by `zoomStep`, on the middle, gliding |
| `pan(dx, dy)` | moves the view by `dx`, `dy` px |
| `fullscreen(on)` | full screen (`true`), back (`false`), or the other way round (no argument): see [Full screen](interaction.md#full-screen) |
| `isFullscreen()` | `true` while the element is shown in full screen or has the class `is-fullscreen` |
| `highlight(id)` | lights a node's line and keeps it lit; `null` puts it out: see [The lit line](interaction.md#the-lit-line) |
| `destroy()` | stops the graph and gives the element back as it was before the start: removes every listener the graph added (pointer, wheel, keyboard, focus, fullscreen, the buttons'), stops watching the viewport's size, takes the viewport, the canvas, the edges and the buttons out, puts the declared nodes back where they stood with their own classes and style (a node the site put in the canvas after the start is moved back into the element; the nodes `setData()` made are removed), restores the element's `class`, `style`, `data-graph-preset` and `data-graph-direction`, leaves full screen, and forgets the graph (`Graph.get()` then answers `null`). A later `Graph.ready()` - the next `transparent:load` included - starts the element afresh, as on a first load: one viewport, one set of buttons; a page that wants it stopped for good removes its `data-graph` attribute too. A second call does nothing |

`{animate: true}` makes the view glide (the class `is-gliding` for 320 ms, a CSS transition of
0.28 s; none under `prefers-reduced-motion: reduce`); `{animate: false}` stops a glide under way.

## Instance properties

Read them; the methods keep them in step.

| Property | Holds |
|---|---|
| `root` | the element |
| `options` | the options in force (defaults, preset, attributes, options) |
| `view` | `{x, y, scale}`: the canvas's offset in px and its scale |
| `data` | `{nodes, edges}`: what was declared or given |
| `result` | what `layout()` returned last (see [The layout](layout.md)) |
| `elements` | `Map` of node id to element |
| `paths` | `[{element, from, to, index}]`: the drawn edges, `index` in `data.edges` |
| `pinned` | the node whose line is kept lit, or `null` |
| `viewport`, `canvas`, `svg`, `controls` | the parts the graph built (`controls` only with the option on) |

## Events

Dispatched on the graph's element; they bubble, so one listener on `document` hears every graph.

| Event | When | `detail` | Cancelable |
|---|---|---|---|
| `graph:select` | a click on a node (not the click that ends a drag) | `{id, element, graph, originalEvent}` | yes: `preventDefault()` stops the click (a link is not followed) and, with `lineage: 'select'`, lights nothing |
| `graph:view` | the view moved (drag, zoom, fit, keys, resize), at most once per animation frame; not for the view given back from `sessionStorage` | `{x, y, scale, graph}` | no |
| `graph:layout` | each `layout()`: the nodes were placed and the edges drawn | `{graph, layout}`: `layout` is the result of [`layout()`](layout.md) | no |

```js
document.addEventListener('graph:select', (event) => {
    if (event.detail.id === 'deploy-production') {
        event.preventDefault();               // the link is not followed
        openConfirmDialog(event.detail.element);
    }
});

element.addEventListener('graph:view', ({ detail }) => {
    zoomLabel.textContent = Math.round(detail.scale * 100) + ' %';
});
```

The script listens to `transparent:load` on `window` (to start the graphs of a page swapped in)
and to `fullscreenchange` on `document`.

## Classes and attributes the script sets

| On | Set |
|---|---|
| the element | `.graph`; `.is-ready` after the first layout; `.is-dragging` during a drag; `.is-gliding` during an animated move; `.is-fullscreen`; `.has-lineage` while a line is lit; `data-graph-direction`; `data-graph-preset` when the preset came as an option; the CSS variable `--graph-scale` (the current scale) |
| a node | `.graph-node`; `.is-focus` on the focused node; `.is-lineage` on the lit line; `data-graph-placed-rank` (the rank the layout gave it); `style.left`, `style.top` |
| a node built by `setData()` | also `data-graph-node`, `data-graph-rank`, `data-graph-state`, `data-graph-kind` from the data |
| an edge (`<path>`) | `.graph-edge`; `.graph-edge-flat` for an edge in a rank or against the direction; `.is-lineage`; `data-graph-edge="from to"`; `data-graph-state` (its own, else the node it reaches); `data-graph-kind` (from the data) |
| a button | `.graph-control` and `.graph-control-zoomIn`, `-zoomOut`, `-fit`, `-fullscreen`; `title` and `aria-label` from `labels` |
