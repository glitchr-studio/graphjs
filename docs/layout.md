---
title: The layout
order: 40
---

# The layout

`layout(data, options)` in `src/js/layout.js` - no DOM. It runs in a browser, a worker, Node or a
server; `Graph` calls it with the sizes it measured.

```js
import { layout, path, lineage } from '@glitchr/graphjs/layout';

layout(
    { nodes: [{ id, rank?, width?, height? }], edges: [{ from, to }] },
    { direction: 'down', gap: 24, rankGap: 56, sort: true, align: 'start', nodeWidth: 160, nodeHeight: 48 },
);
```

It returns `{nodes: Map(id → {id, x, y, width, height, rank, order}), edges:
[{from, to, index, points, flat}], ignored: [{from, to, index, reason}], ranks:
[{rank, start, size}], width, height, direction}`.

## Input

| Field | Type | Effect |
|---|---|---|
| `nodes[].id` | string or number | the identifier, turned into a string; a node given twice counts once (the first) |
| `nodes[].rank` | number | a rank to keep (rounded); empty, `null` or not a number: the layout decides |
| `nodes[].width`, `nodes[].height` | number (px) | the node's size; missing or not a number: `nodeWidth`, `nodeHeight`; a negative size counts as 0 |
| `edges[].from`, `edges[].to` | string or number | the two nodes, by identifier |

Other fields are ignored (the edges' `state` and `kind` are `Graph`'s).

## Options

| Option | Type | Default | Effect |
|---|---|---|---|
| `direction` | `'down'`, `'right'` | `'down'` | `down` stacks the ranks from top to bottom (x along a rank, y across), `right` from left to right |
| `nodeWidth` | number (px) | `160` | the width of a node that gives none |
| `nodeHeight` | number (px) | `48` | the height of a node that gives none |
| `gap` | number (px) | `24` | between two neighbours of a rank; half of it between two edges that cross a rank side by side |
| `rankGap` | number (px) | `56` | between two ranks |
| `sort` | boolean | `true` | `false` keeps the order the nodes came in (no barycentric sweeps) |
| `sweeps` | number | `12` | the most ordering sweeps (they stop as soon as nothing crosses) |
| `align` | `'start'`, `'center'`, `'end'` | `'start'` | where a node shallower than its rank stands in it |

`Graph` passes `direction`, `gap`, `rankGap`, `sort` and `align` from its own options; `nodeWidth`,
`nodeHeight` and `sweeps` keep their defaults there (a node not measured yet - hidden, no size -
is laid out at 160 x 48 until it is).

## Result

| Field | Holds |
|---|---|
| `nodes` | `Map` of id to `{id, x, y, width, height, rank, order}`: `x`, `y` the top left corner in px (rounded to 0.01), `rank` the rank, `order` the place in the rank from 0 |
| `edges` | the drawn edges, in the order they came: `{from, to, index, points, flat}`, `index` the edge's index in `data.edges` |
| `ignored` | the edges set aside, by `index`: `{from, to, index, reason}`, `reason` one of `unknown`, `loop`, `duplicate`, `cycle` |
| `ranks` | `[{rank, start, size}]`: every rank from the first to the last, the empty ones included; `start` where it begins across the ranks, `size` its depth (its deepest node) |
| `width`, `height` | the size of the whole drawing in px; the left-most node at x 0 (down) or the top-most at y 0 (right) |
| `direction` | `'down'` or `'right'` |

An empty graph gives no node, no edge, no rank, a size of 0 x 0.

### An example, run

```js
import { layout, path, lineage } from '@glitchr/graphjs/layout';

const data = {
    nodes: [
        { id: 'build', width: 120, height: 32 },
        { id: 'test', width: 120, height: 32 },
        { id: 'lint', width: 120, height: 32 },
        { id: 'deploy', width: 120, height: 32 },
    ],
    edges: [
        { from: 'build', to: 'test' },
        { from: 'build', to: 'lint' },
        { from: 'test', to: 'deploy' },
        { from: 'lint', to: 'deploy' },
        { from: 'deploy', to: 'build' },     // closes a cycle
        { from: 'test', to: 'nowhere' },     // no such node
    ],
};

const result = layout(data, { direction: 'right', gap: 14, rankGap: 64 });
```

Under Node 22 (`node:22-alpine`), `result.nodes`:

```text
'build'  => { id: 'build',  x: 0,   y: 23, width: 120, height: 32, rank: 0, order: 0 }
'test'   => { id: 'test',   x: 184, y: 0,  width: 120, height: 32, rank: 1, order: 0 }
'lint'   => { id: 'lint',   x: 184, y: 46, width: 120, height: 32, rank: 1, order: 1 }
'deploy' => { id: 'deploy', x: 368, y: 23, width: 120, height: 32, rank: 2, order: 0 }
```

`result.edges[0]`, `result.ignored`, `result.ranks`, `width`, `height`, `direction`:

```text
{"from":"build","to":"test","index":0,"points":[{"x":120,"y":39},{"x":184,"y":16,"via":152}],"flat":false}
[ { from: 'deploy', to: 'build', index: 4, reason: 'cycle' },
  { from: 'test', to: 'nowhere', index: 5, reason: 'unknown' } ]
[ { rank: 0, start: 0, size: 120 }, { rank: 1, start: 184, size: 120 }, { rank: 2, start: 368, size: 120 } ] 488 78 right
```

## 1. What is set aside

An edge to a node that does not exist (`unknown`), from a node to itself
(`loop`), given twice (`duplicate`), or closing a cycle (`cycle`) is listed in
`ignored` and neither counted nor drawn. The cycle is cut where the walk, made
in the order the nodes came in, meets a node it is still in.

The walk is depth-first and iterative: a chain of thousands of nodes does not exhaust the stack.

## 2. Ranks

- A `rank` given on a node is kept.
- Otherwise a node stands one rank past its farthest parent (longest path).
- A node **without parent** stands just before the nearest thing it leads to,
  not at the top. In a family tree the spouse who enters at a union has no
  parent in the tree: they stand in their partner's rank.

`ranks` lists every rank from the first to the last, the empty ones included.

A node whose only parents are such parentless nodes stands at rank 1. Given ranks may be any
integers, negative included: `ranks` then starts at the smallest.

## 3. Order in a rank

Barycentric sweeps: each rank is sorted by the mean place of its neighbours in
the rank above, then below, up to `sweeps` times (12); the order with the
fewest crossings is kept. A node with no neighbour on the side looked at keeps
its slot. `sort: false` keeps the order the nodes came in.

Before the sweeps, each rank holds its nodes in the order they came; an edge that crosses a rank
is given a slot there beside its source's place in that order.

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
several ranks is led through a free slot of each rank it crosses: it enters the rank at its
start and, when the rank has a depth, leaves it at its end. A point that ends a stretch between
two ranks (the target, and the entry into a crossed rank) carries `via`: where, between the two
ranks, a `step` edge turns and a `curve` bends. The first point and the exit from a crossed rank
carry none: the edge runs straight from there. An edge between two nodes of the same rank, or
going against the direction (both only possible with given ranks), is `flat`: a
straight line, kept out of the ordering.

An edge `a → c` crossing rank 1 (60 px deep) of a `down` graph:

```text
[{"x":96,"y":40},{"x":5.33,"y":96,"via":68},{"x":5.33,"y":156},{"x":50,"y":212,"via":184}]
```

`Graph` draws a flat edge dashed (`.graph-edge-flat`).

## path()

`path(points, {direction, shape, radius})` gives the SVG path (`d`) of an edge through its
points.

| Option | Type | Default | Effect |
|---|---|---|---|
| `direction` | `'down'`, `'right'` | `'down'` | the direction the points were laid out in |
| `shape` | `'curve'`, `'step'`, `'line'` | `'curve'` | an S between two ranks (a cubic Bézier through `via`), right angles at `via` rounded by `radius`, or straight segments |
| `radius` | number (px) | `8` | the rounding of a step's corners, made smaller where the step is too short for it |

A stretch without `via`, or whose two ends are aligned, is a straight segment in every shape.
No point: an empty string. The first edge of the example above, in each shape:

```text
curve  M120 39C152 39 152 16 184 16
step   M120 39L144 39Q152 39 152 31L152 24Q152 16 160 16L184 16
line   M120 39L184 16
```

## Lineage

`lineage(data, id)` returns `{nodes: Set, edges: Set}`: the node, everything it
descends from and everything that descends from it (edge indexes are those of
`data.edges`).

Siblings are not part of a line: a sibling is neither an ancestor nor a descendant. The walk
follows every edge of `data.edges`, as given: run on the example's data, `lineage(data, 'lint')`
gives the nodes `lint`, `build`, `deploy`, `test` and `nowhere`, and the edges 0 to 5, the
cycle's edge and the edge to no node included. A graph's lit line runs it on the edges the
layout drew only (see [The lit line](interaction.md#the-lit-line)): pass
`{edges: result.edges}` for the same walk (its edge indexes are then those of `result.edges`).
