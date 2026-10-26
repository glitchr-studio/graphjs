---
title: The graph
order: 10
---

# The graph

## Starting

In a browser, importing `src/js/graph.js` (or `src/index.js`, which imports it):

- starts every `[data-graph]` of the page - at once when the document is parsed already, else at
  `DOMContentLoaded`;
- starts them again at every `transparent:load` event on `window` (a navigation of
  @glitchr/flowjs swaps the page without loading it): the graphs already started are left as
  they are, the new ones start;
- sets `window.Graph` to the class, unless something holds that name already.

`Graph.ready(root)` starts the `[data-graph]` elements under `root` (and `root` itself when it
matches) that are not started yet, for a fragment added later; it never starts one twice. A graph
is also started by hand, on any element, `[data-graph]` or not:

```js
import Graph from '@glitchr/graphjs';

const graph = new Graph(document.getElementById('pipeline'), { preset: 'pipeline', lineage: 'select' });
```

`new Graph(element)` on an element that has a graph already returns that graph, and the options
given then are ignored. `Graph.get(element)` returns the graph of an element, or `null`.

On start the element gets the class `graph`, a `.graph-viewport` (focusable when `keyboard` is on,
`role="group"`, labelled by the element's `aria-label`, else `labels.graph`) holding a
`.graph-canvas`, which holds the SVG of the edges (`.graph-edges`) and the nodes: the
`[data-graph-node]` elements found inside the element are moved into the canvas, in their order.
With `controls` on, a `.graph-controls` block of four buttons follows. Then the declared nodes are
read and laid out (`refresh()`).

Until the first layout, the stylesheet hides the declared nodes (`.graph:not(.is-ready)
[data-graph-node] { visibility: hidden }`): a page never shows them out of place. A graph whose
element has no size yet (hidden, in a closed tab) is laid out again when it gets one (a
`ResizeObserver`), and once more when the page's fonts are loaded (`document.fonts.ready`), the
cards having changed size.

## Declared in the page

```html
<div data-graph data-graph-preset="tree" data-graph-focus="me" aria-label="My family">
    <a href="/people/1" data-graph-node="father">Henri Vasseur</a>
    <a href="/people/2" data-graph-node="mother">Jeanne Collet</a>
    <span data-graph-node="union" data-graph-kind="junction" data-graph-from="father mother"></span>
    <a href="/people/3" data-graph-node="me" data-graph-from="union">Paul Vasseur</a>
</div>
```

### On a node

| Attribute | Read by | Effect |
|---|---|---|
| `data-graph-node="id"` | `refresh()` | the node, and its identifier. A second element with the same identifier is moved into the canvas with the others but is not a node: neither placed nor counted |
| `data-graph-from="a b"` | `refresh()` | the nodes it comes from, separated by spaces or commas: one edge each, from each of them to this node |
| `data-graph-rank="2"` | `refresh()` | its rank, when the graph must not decide (a number; rounded) |
| `data-graph-state="success"` | `refresh()`, the stylesheet | `pending`, `running`, `success`, `failed`, `warning`, `manual`, `skipped`, `canceled`: the node's colour, and the colour of the edges that reach it |
| `data-graph-kind="junction"` | the stylesheet | a small round node of 14 px: a union, a gate |
| `data-graph-nodrag` | the drag | on anything inside a node that a drag must not start from (form fields and `contenteditable` never start one) |

Nothing else of a declared node is read: its content, its classes and its links stay the
server's. Nodes are measured as they are drawn (`offsetWidth`, `offsetHeight`), so a card's size
comes from the stylesheet.

### On the graph

Each `data-graph-*` attribute of the element sets the option of the same name (see
[Options](#options)): `data-graph-rank-gap` sets `rankGap`, `data-graph-label-zoom-in` sets
`labels.zoomIn`. A boolean attribute is false when it reads `false`, `0`, `off` or `no`, true
otherwise (an empty `data-graph-controls` is true). A number attribute that is empty or not a
number is ignored.

| Attribute | Option |
|---|---|
| `data-graph-preset` | `preset` |
| `data-graph-direction` | `direction` |
| `data-graph-edges` | `edges` |
| `data-graph-focus` | `focus` |
| `data-graph-lineage` | `lineage` |
| `data-graph-key` | `key` |
| `data-graph-align` | `align` |
| `data-graph-sort` | `sort` (boolean) |
| `data-graph-controls`, `data-graph-keyboard`, `data-graph-remember` | `controls`, `keyboard`, `remember` (booleans) |
| `data-graph-gap`, `data-graph-rank-gap`, `data-graph-radius` | `gap`, `rankGap`, `radius` (numbers) |
| `data-graph-min-zoom`, `data-graph-max-zoom`, `data-graph-padding` | `minZoom`, `maxZoom`, `padding` (numbers) |
| `data-graph-label-graph`, `-label-zoom-in`, `-label-zoom-out`, `-label-fit`, `-label-fullscreen` | `labels.graph`, `labels.zoomIn`, `labels.zoomOut`, `labels.fit`, `labels.fullscreen` |
| `data-graph-theme="light"` or `"dark"` | none: read by the stylesheet, see [Styling](styling.md) |

`zoomStep` and `render` have no attribute: they are given to `new Graph()` only.

## Given as data

```js
graph.setData({
    nodes: [
        { id: 1, label: 'build', state: 'success' },
        { id: 2, label: 'test', sub: '2 min', state: 'running', href: '/jobs/2' },
        { id: 'gate', kind: 'junction' },
    ],
    edges: [{ from: 1, to: 2 }, { from: 2, to: 'gate', state: 'failed' }],
});
```

`setData()` removes the nodes the graph holds (declared or given), builds one element per node,
and lays them out. Identifiers are turned into strings (`1` and `'1'` are the same node); a node
given twice is built once.

### A node

| Field | Effect |
|---|---|
| `id` | required: the identifier, written in `data-graph-node` |
| `label` | the first line, in a `<span class="graph-node-label">` (text, escaped). Without it the line shows the `id` |
| `sub` | a second line, in a `<span class="graph-node-sub">` (text, escaped) |
| `href` | the node is an `<a href>` (else a `<div>`) |
| `title` | the element's `title` |
| `className` | the element's classes, before `graph-node` |
| `html` | the element's content, inserted as it is in place of `label` and `sub`: it is the caller's to escape |
| `rank` | written in `data-graph-rank`; the rank the layout keeps |
| `state` | written in `data-graph-state` |
| `kind` | written in `data-graph-kind`. A `junction` without `label` (and without `html`) has no text: it is a dot |

The element built for this data:

```html
<a href="/jobs/2" data-graph-node="2" class="graph-node" data-graph-state="running" data-graph-placed-rank="1"><span class="graph-node-label">test</span><span class="graph-node-sub">2 min</span></a>
```

The `render(node, graph)` option builds the element instead: it receives the node as given (its
`id` a string) and the graph, and returns an element; when it returns nothing, the default
element is built. `data-graph-node`, the class `graph-node` and the `rank`, `state` and `kind`
attributes are set on what it returns.

```js
new Graph(element, {
    render: (node) => {
        const card = document.createElement('article');
        card.innerHTML = '<h3></h3><p></p>';
        card.querySelector('h3').textContent = node.label;
        card.querySelector('p').textContent = node.born + ' - ' + (node.died || '');
        return card;
    },
});
```

### An edge

| Field | Effect |
|---|---|
| `from`, `to` | required: the identifiers of the two nodes (turned into strings) |
| `state` | written in the path's `data-graph-state` (its colour); without it, the path takes the state of the node it reaches |
| `kind` | written in the path's `data-graph-kind`, for a stylesheet to hook on |

An edge to a node that does not exist, from a node to itself, given twice, or closing a cycle is
not drawn: see [What is set aside](layout.md#1-what-is-set-aside).

### The second argument

`setData(data, {focus, keepView})`:

- `focus`: changes the `focus` option (the node the graph opens on and marks `is-focus`); `null`
  removes it.
- `keepView: true`: the view stays where it is. Otherwise the graph is placed again as on its
  first layout: the remembered view, else the focus, else the whole graph (see
  [The first view](interaction.md#the-first-view)).

A declared graph (`refresh()`) and a graph given as data are the same thing afterwards: every
method works on both. `refresh()` after `setData()` reads the elements in the canvas, so it
gives back the nodes `setData()` built, with their `data-graph-rank` and `data-graph-state`, and
without the edges (the built elements have no `data-graph-from`).

## Options

Given to `new Graph(element, options)` or `Graph.ready(root, options)`. A preset sets some of
them; the element's `data-graph-*` attributes win over the preset, the options over both.
`labels` is merged key by key (the defaults, then the attributes, then the options).

| Option | Type | Default | Attribute | Effect |
|---|---|---|---|---|
| `preset` | `'tree'`, `'pipeline'` or `null` | `null` | `data-graph-preset` | the defaults of a kind of graph (below); written back in `data-graph-preset` when only given as an option, for the stylesheet |
| `direction` | `'down'`, `'right'` | `'down'` | `data-graph-direction` | `down` stacks the ranks from top to bottom, `right` from left to right; written back in `data-graph-direction` |
| `edges` | `'curve'`, `'step'`, `'line'` | `'curve'` | `data-graph-edges` | the shape of the edges: an S between two ranks, right angles, straight lines |
| `radius` | number (px) | `8` | `data-graph-radius` | the rounding of a `step` edge's corners |
| `gap` | number (px) | `24` | `data-graph-gap` | between two neighbours of a rank (half of it between two edges crossing a rank) |
| `rankGap` | number (px) | `56` | `data-graph-rank-gap` | between two ranks |
| `align` | `'start'`, `'center'`, `'end'` | `'start'` | `data-graph-align` | where a node shallower than its rank stands in it |
| `sort` | boolean | `true` | `data-graph-sort` | `false` keeps the nodes of a rank in the order they came |
| `focus` | node id or `null` | `null` | `data-graph-focus` | the node the graph opens on; it gets the class `is-focus`; `Home` comes back to it |
| `lineage` | `'hover'`, `'select'`, `'off'` | `'hover'` | `data-graph-lineage` | how a node's line (its ancestors, its descendants) is lit: on pointing and focus, on a click that keeps it lit, or never (`highlight()` still works) |
| `controls` | boolean | `true` | `data-graph-controls` | the four buttons: zoom in, zoom out, fit, full screen |
| `keyboard` | boolean | `true` | `data-graph-keyboard` | the viewport is focusable and answers the keys of [The keyboard](interaction.md#the-keyboard) |
| `remember` | boolean | `true` | `data-graph-remember` | the view is kept in `sessionStorage` and given back on return |
| `key` | string or `null` | `null` | `data-graph-key` | the name the view is kept under (`graphjs:` + it); `null`: the element's `id`, else the page's path and query string |
| `minZoom` | number | `0.15` | `data-graph-min-zoom` | the smallest scale, for every zoom and every fit |
| `maxZoom` | number | `2.5` | `data-graph-max-zoom` | the largest scale |
| `zoomStep` | number | `1.3` | none | the factor of one `zoomIn()` / `zoomOut()` (the buttons, `+` and `-`) |
| `padding` | number (px) | `32` | `data-graph-padding` | the margin kept around the graph by `fit()` |
| `labels` | object | see below | `data-graph-label-*` | the accessible names, in the page's language |
| `render` | `(node, graph) => HTMLElement` or `null` | `null` | none | builds a node's element for `setData()` |

`labels` and their defaults:

| Key | Default | Used as |
|---|---|---|
| `graph` | `Graph` | the viewport's `aria-label`, when the element has no `aria-label` |
| `zoomIn` | `Zoom in` | the button's `title` and `aria-label` |
| `zoomOut` | `Zoom out` | the same |
| `fit` | `Fit` | the same |
| `fullscreen` | `Full screen` | the same |

The options are read once: changing `graph.options` afterwards changes what the methods read next
(`lineage`, `focus`, the zoom limits) but not what was built (the buttons, the listeners chosen
for `lineage: 'hover'` and `keyboard`).

## Presets

| Preset | `direction` | `edges` | `gap` | `rankGap` | The stylesheet |
|---|---|---|---|---|---|
| `tree` | `down` | `step` | 24 | 48 | centred cards, 8.5rem to 12.5rem wide |
| `pipeline` | `right` | `curve` | 14 | 64 | pill-shaped jobs on one line, a disc for the state, no dots on the ground |

A preset only sets defaults: `data-graph-rank-gap="80"` on a `tree` gives 80, and
`new Graph(element, {edges: 'line'})` wins over both. `Graph.presets` holds the table above (the
script's half); the stylesheet's half is keyed on `[data-graph-preset]`, see
[Styling](styling.md#presets).
