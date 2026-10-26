# @glitchr/graphjs

A layered directed graph that is dragged and zoomed. The nodes are HTML - cards the server
rendered, links that stay links - and the edges are SVG. No dependency, no jQuery, no build step.
Written for family trees (the `tree` preset: ranks from top to bottom, right-angled edges) and
pipelines (the `pipeline` preset: stages from left to right, curved edges, a state on each job).
Everything a site restyles is a `--graph-*` CSS variable.

The library has two halves. `src/js/layout.js` places the nodes (ranks, order inside a rank,
x and y in pixels, the points of every edge) without touching the DOM: it runs in a browser, a
worker, Node or a server. `src/js/graph.js` is the `Graph` class: it reads the nodes the page
declares (or the data it is given), measures them, asks the layout for their places, draws the
edges and handles the view (drag, zoom, keyboard, full screen, the lit line of a node).

## When to use it

- A graph of a few to a few hundred nodes whose nodes must stay real HTML: links a crawler
  follows, cards styled by the site's own CSS, text a screen reader reads.
- A family tree, an organisation chart, a dependency or build pipeline: a directed graph whose
  edges go from one rank to the next.

When not: a graph whose cycles matter (an edge closing a cycle is set aside, see
[What is set aside](layout.md#1-what-is-set-aside)); a force-directed or radial drawing; tens of
thousands of nodes (every node is an element, and `Graph` computes the layout in one go on the
main thread, again at each `layout()`).

## Entry points

| Import | File | What it gives |
|---|---|---|
| `@glitchr/graphjs` | `src/index.js` | `Graph` (default and named export), `layout`, `path`, `lineage`; imports the stylesheet (a bundler must handle CSS imports) |
| `@glitchr/graphjs/graph` | `src/js/graph.js` | `Graph` (default and named export), without the stylesheet |
| `@glitchr/graphjs/layout` | `src/js/layout.js` | `layout` (default and named), `path`, `lineage`: no DOM |
| `@glitchr/graphjs/css` | `src/css/index.css` | the stylesheet |

The package is an ES module (`"type": "module"`) and declares side effects: importing `graph.js`
(directly or through `src/index.js`) in a browser starts every `[data-graph]` of the page and sets
`window.Graph` when nothing holds that name yet. See [Starting](graph.md#starting).

## Installation

### With a bundler

```sh
npm install @glitchr/graphjs
```

```js
import Graph from '@glitchr/graphjs';          // the class, and its stylesheet
```

A bundler that does not handle CSS imports takes the class and the stylesheet apart:

```js
import Graph from '@glitchr/graphjs/graph';
import '@glitchr/graphjs/css';                 // or a <link> to src/css/index.css
```

### Without a bundler

`src/index.js` imports a stylesheet, which a browser cannot import as a module: load
`src/js/graph.js` (it imports `./layout.js` by itself) and link the stylesheet.

```html
<link rel="stylesheet" href="node_modules/@glitchr/graphjs/src/css/index.css">
<script type="module">import Graph from './node_modules/@glitchr/graphjs/src/js/graph.js';</script>
```

The module needs to be served over HTTP: browsers refuse module scripts read from `file://`.

### In a Symfony / Encore site

```sh
npm install @glitchr/graphjs
```

```js
// assets/app-defer.js
import '@glitchr/graphjs';
```

```twig
<div data-graph data-graph-preset="tree" data-graph-focus="{{ focus.id }}"
     data-graph-label-zoom-in="{{ 'graph.zoom_in'|trans }}" data-graph-label-fit="{{ 'graph.fit'|trans }}">
    {% for person in people %}
        <a href="{{ path('person_show', {id: person.id}) }}" data-graph-node="{{ person.id }}" data-graph-from="{{ person.parents|join(' ') }}">{{ person.name }}</a>
    {% endfor %}
</div>
```

The graphs start by themselves at page load and at each `transparent:load` (a navigation of
[@glitchr/flowjs](https://github.com/glitchr-studio/flowjs)). A large graph is better loaded as
JSON and given to `setData()`.

## A first graph

Declared in the page:

```html
<div data-graph data-graph-preset="tree" data-graph-focus="me" aria-label="My family">
    <a href="/people/1" data-graph-node="father">Henri Vasseur</a>
    <a href="/people/2" data-graph-node="mother">Jeanne Collet</a>
    <span data-graph-node="union" data-graph-kind="junction" data-graph-from="father mother"></span>
    <a href="/people/3" data-graph-node="me" data-graph-from="union">Paul Vasseur</a>
</div>
```

Given as data:

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

`example/index.html` shows both (a family tree over five generations, a pipeline of ten jobs):
serve the repository (`python3 -m http.server 8000`) and open `http://localhost:8000/example/`.

## How this manual is organised

- [The graph](graph.md): starting a graph, the attributes a page declares, the data `setData()`
  takes, every option with its default and its attribute, the presets.
- [Moving about](interaction.md): drag, wheel, pinch, keyboard, full screen, the remembered view,
  the lit line of a node.
- [API](reference.md): every static and instance method, the events, the classes and attributes the
  script sets.
- [The layout](layout.md): `layout()`, `path()` and `lineage()` without the DOM - how ranks,
  order and places are decided.
- [Styling](styling.md): the `--graph-*` variables, the themes, the presets, the states.
- [Testing](testing.md): the test suite and the example page.

## Version and licence

This manual describes version 1.0.0 (`package.json`). The package keeps no CHANGELOG file: the
git history of github.com/glitchr-studio/graphjs is its record. MIT since 2026-10-09; earlier
versions remain published under LGPL-3.0-or-later.
