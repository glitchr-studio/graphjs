---
title: Testing
order: 60
---

# Testing

## The test suite

```sh
npm test                          # node --test: the layout
```

`npm test` runs `node --test`, which finds `test/layout.test.js`: 16 tests of `layout()`, `path()`
and `lineage()`, without a browser (the layout needs no DOM).

| Test | Checks |
|---|---|
| ranks follow the longest path | a, b, c, d with a shortcut a → c: ranks 0, 1, 2, 3 |
| a given rank is kept, and what follows is ranked after it | ranks 3 and 7 given: b at 4, `ranks` 3 to 7 with the empty ones |
| a spouse without parents stands in the rank of the partner | a three-generation family: the spouse at the partner's rank, next to them |
| an edge closing a cycle is ignored, the rest is laid out | a → b → c → a: `{from: 'c', to: 'a', index: 2, reason: 'cycle'}` |
| loops, repeated edges and edges to nowhere are ignored | the reasons `loop`, `duplicate`, `unknown` |
| no two nodes overlap, and the gap is kept inside a rank | |
| no overlap in a wide random graph with nodes of different sizes | 120 nodes, both directions, every node inside `width` x `height` |
| direction right stacks the ranks from left to right | x by rank, `direction: 'right'`, the edge from the source's right side to the target's left |
| sort: false keeps the order the nodes came in | and `sort: true` undoes a crossing |
| an edge over several ranks is led through each of them | its points never run under a node |
| an only child stands straight under its parent | a chain is a straight line |
| parents stand around their union, children under it | |
| an empty graph and a lone node | 0 x 0; a lone node at 0, 0 with its size |
| a long chain does not exhaust the stack | 5000 nodes in a chain: the last at rank 4999 |
| path: curve, step and line | the exact `d` of each shape, the radius, a straight stretch, `direction: 'right'`, no point |
| lineage: ancestors and descendants, not the siblings | |

Run in a container (Node 22), the suite ends:

```text
1..16
# tests 16
# suites 0
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The `Graph` class (the DOM half: measuring, the view, the events) has no automated test in the
repository; the example page is where it is checked by hand.

## The example page

```sh
python3 -m http.server 8000       # then http://localhost:8000/example/
```

`example/index.html` loads `src/css/index.css` and `src/js/graph.js` from the repository (no
build): a family tree declared in the page (five generations, unions as junctions, `focus` on the
youngest) with buttons for `fit()`, `center()` and `highlight()`, and a pipeline given as data
(`setData()`, ten jobs in every state, `lineage: 'select'`) with a button for `setState()`. It
prints the `graph:select` and `graph:view` events under each graph, and exposes `window.tree` and
`window.pipeline` for the console.

## Testing a page that uses graphjs

- The layout is a pure function: test what a page gives the graph by calling `layout()` on the
  same data in Node and asserting ranks, order or `ignored`.
- In a browser test, wait for the class `is-ready` on the element (set after the first layout) or
  for the `graph:layout` event before reading places; `Graph.get(element).result` holds the
  last layout.
- `remember` keeps the view in `sessionStorage`: a test that reloads a page and expects the first
  view sets `data-graph-remember="false"` or clears `sessionStorage`.
