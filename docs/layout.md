---
title: The layout
order: 2
---

# The layout

`layout(data, options)` in `src/js/layout.js` - no DOM.

```js
layout(
    { nodes: [{ id, rank?, width?, height? }], edges: [{ from, to }] },
    { direction: 'down', gap: 24, rankGap: 56, sort: true, align: 'start', nodeWidth: 160, nodeHeight: 48 },
);
```

It returns `{nodes: Map(id → {id, x, y, width, height, rank, order}), edges:
[{from, to, index, points, flat}], ignored: [{from, to, index, reason}], ranks:
[{rank, start, size}], width, height, direction}`.

## 1. What is set aside

An edge to a node that does not exist (`unknown`), from a node to itself
(`loop`), given twice (`duplicate`), or closing a cycle (`cycle`) is listed in
`ignored` and neither counted nor drawn. The cycle is cut where the walk, made
in the order the nodes came in, meets a node it is still in.

## 2. Ranks

- A `rank` given on a node is kept.
- Otherwise a node stands one rank past its farthest parent (longest path).
- A node **without parent** stands just before the nearest thing it leads to,
  not at the top. In a family tree the spouse who enters at a union has no
  parent in the tree: they stand in their partner's rank.

`ranks` lists every rank from the first to the last, the empty ones included.

## 3. Order in a rank

Barycentric sweeps: each rank is sorted by the mean place of its neighbours in
the rank above, then below, up to `sweeps` times (12); the order with the
fewest crossings is kept. A node with no neighbour on the side looked at keeps
its slot. `sort: false` keeps the order the nodes came in.

## 4. Places

Each node is drawn towards its neighbours of both sides, its rank's order and
`gap` being kept (least squares under the separation, by pooling). A link
between two nodes that have only each other on that side weighs eight times
more, and is straightened last where there is room: a chain is a straight
line, parents stand around their union, an only child under it.

Across the ranks, a rank is as deep as its deepest node, and `rankGap`
separates two ranks. `align` (`start`, `center`, `end`) places a node that is
shallower than its rank.

## 5. Edges

`points` go from the source's far side to the target's near side. An edge over
several ranks is led through a free slot of each rank it crosses. Every point
but the first carries `via`: where, between the two ranks, a `step` edge turns
and a `curve` bends. An edge between two nodes of the same rank, or going
against the direction (both only possible with given ranks), is `flat`: a
straight line, kept out of the ordering.

`path(points, {direction, shape: 'curve' | 'step' | 'line', radius})` gives the
SVG path.

## Lineage

`lineage(data, id)` returns `{nodes: Set, edges: Set}`: the node, everything it
descends from and everything that descends from it (edge indexes are those of
`data.edges`).
