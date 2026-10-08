# graphjs

A layered directed graph you can drag and zoom. The nodes are HTML - cards the
server rendered, links that stay links - and the edges are SVG. No dependency,
no jQuery, no build step.

Two presets: `tree` (the ranks from top to bottom, right-angled edges: a family
tree, an organisation) and `pipeline` (from left to right, curved edges, a
state on each job). Everything a site restyles is a `--graph-*` CSS variable.

```sh
npm install @glitchr/graphjs
```

```js
import Graph from '@glitchr/graphjs';          // the class, and its stylesheet
```

Without a bundler:

```html
<link rel="stylesheet" href="node_modules/@glitchr/graphjs/src/css/index.css">
<script type="module">import Graph from './node_modules/@glitchr/graphjs/src/js/graph.js';</script>
```

## Declared in the page

```html
<div data-graph data-graph-preset="tree" data-graph-focus="me" aria-label="My family">
    <a href="/people/1" data-graph-node="father">Henri Vasseur</a>
    <a href="/people/2" data-graph-node="mother">Jeanne Collet</a>
    <span data-graph-node="union" data-graph-kind="junction" data-graph-from="father mother"></span>
    <a href="/people/3" data-graph-node="me" data-graph-from="union">Paul Vasseur</a>
</div>
```

Every `[data-graph]` starts by itself once the page is loaded, and again after a
[transparent.js](https://github.com/glitchr-studio/transparentjs) navigation
(`transparent:load`). `Graph.ready(root)` starts those of a fragment added later;
it never starts one twice.

| On a node | |
|---|---|
| `data-graph-node="id"` | the node, and its identifier |
| `data-graph-from="a b"` | the nodes it comes from: one edge each |
| `data-graph-rank="2"` | its rank, when the graph must not decide |
| `data-graph-state="success"` | `pending`, `running`, `success`, `failed`, `warning`, `manual`, `skipped`, `canceled` |
| `data-graph-kind="junction"` | a small round node: a union, a gate |
| `data-graph-nodrag` | on anything inside a node that a drag must not start from |

| On the graph | Default | |
|---|---|---|
| `data-graph-preset` | none | `tree`, `pipeline` |
| `data-graph-direction` | `down` | `down`, `right` |
| `data-graph-edges` | `curve` | `curve`, `step`, `line` |
| `data-graph-focus` | none | the node the graph opens on; it gets the class `is-focus` |
| `data-graph-lineage` | `hover` | `hover`, `select` (a click keeps the line lit), `off` |
| `data-graph-sort` | `true` | `false` keeps the nodes of a rank in the order they came |
| `data-graph-gap`, `data-graph-rank-gap` | 24, 56 | px between two neighbours, between two ranks |
| `data-graph-controls`, `data-graph-keyboard`, `data-graph-remember` | `true` | |
| `data-graph-key` | the element's id, else the page's path | the key of the remembered view |
| `data-graph-label-zoom-in`, `-zoom-out`, `-fit`, `-fullscreen`, `-graph` | English | the buttons' names, in the page's language |

## Given as data

```js
const graph = new Graph(document.querySelector('#pipeline'), { preset: 'pipeline' });

graph.setData({
    nodes: [
        { id: 'build', label: 'build', state: 'success' },
        { id: 'test', label: 'tests', sub: '2 min 10', state: 'running', href: '/jobs/12' },
        { id: 'deploy', label: 'deploy', state: 'pending' },
    ],
    edges: [{ from: 'build', to: 'test' }, { from: 'test', to: 'deploy' }],
});

graph.setState('test', 'success');   // one job changes: nothing else is drawn again
```

A node takes `id`, `label`, `sub`, `href`, `rank`, `state`, `kind`, `title`,
`className`, or `html` (inserted as it is: escape it). The `render(node)`
option builds the element yourself.

## Moving about

| | |
|---|---|
| Drag | moves the graph. Under 4 px it is still a click: a link in a node stays a link. |
| Ctrl / ⌘ + wheel, pinch | zooms on the pointer. The wheel alone scrolls the page (in full screen it moves the graph). |
| Arrows (Shift: further) | move, once the graph has the focus |
| `+` `-` `0` `Home` `F` | zoom, fit, back to the focus, full screen |
| Tab | goes through the nodes; the one that takes the focus is brought into view |

The view (the point in the middle, the zoom) is kept in `sessionStorage`: coming
back to the page gives the graph as it was left.

## API

| | |
|---|---|
| `Graph.ready(root = document, options)` | starts the graphs under `root`; returns them |
| `Graph.get(element)` | the graph of an element |
| `graph.setData({nodes, edges}, {focus, keepView})` | replaces the graph |
| `graph.refresh()` | reads the declared nodes again (the server changed them) |
| `graph.layout()` | measures and places again (a node changed size) |
| `graph.fit()`, `graph.center(id, {scale, animate})`, `graph.reveal(id)` | the view |
| `graph.zoomTo(scale, {x, y})`, `zoomIn()`, `zoomOut()`, `pan(dx, dy)`, `fullscreen(on)` | |
| `graph.highlight(id)` | lights a node's line - its ancestors, its descendants; `null` puts it out |
| `graph.setState(id, state)` | |
| `graph.destroy()` | |

Events, on the element, bubbling:

- `graph:select` - a node was clicked. `detail: {id, element, graph, originalEvent}`. `preventDefault()` stops the click (the link is not followed).
- `graph:view` - the view moved. `detail: {x, y, scale, graph}`.
- `graph:layout` - the nodes were placed. `detail: {graph, layout}`.

## The layout alone

`src/js/layout.js` needs no DOM: it runs in Node, in a worker, on a server.

```js
import { layout, path, lineage } from '@glitchr/graphjs/layout';

const result = layout({ nodes: [{ id: 'a', width: 120, height: 40 }, { id: 'b' }], edges: [{ from: 'a', to: 'b' }] }, { direction: 'right' });
result.nodes.get('b');          // {id, x, y, width, height, rank, order}
path(result.edges[0].points, { direction: 'right', shape: 'step' });   // an SVG path
```

See [docs/layout.md](docs/layout.md) for how ranks, order and places are decided,
and [docs/styling.md](docs/styling.md) for the variables.

## Example and tests

```sh
npm test                          # node --test: the layout
python3 -m http.server 8000       # then http://localhost:8000/example/
```

## License

MIT since 2026-10-09; earlier versions remain published under LGPL-3.0-or-later.
