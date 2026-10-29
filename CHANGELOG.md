# Changelog

## Unreleased

### Fixed

- **styling** - a `--graph-*` variable set on an ancestor of the element now reaches the graph,
  and one set on the element with a single class is no longer replaced by the dark values on a
  dark system. The stylesheet declared every default on `.graph` itself (a wrapper's
  `--graph-height: 10rem` left the graph 512 px high) and the dark values on
  `.graph:not([data-graph-theme="light"])`, two classes' worth of specificity. Its defaults, the
  dark values and the presets' values are now fallbacks of private `--_graph-*` tokens
  (`--_graph-bg: var(--graph-bg, #f6f5f1)`), so whatever the site sets wins, with any selector,
  wherever it is set - over a preset's value too; inside the graph every `--graph-*` still reads
  the value in force. test/browser/css-variables.html.
- **lineage** - the lit line follows the edges drawn. It walked every edge of the data, the ones
  the layout set aside included: with a → b → c, d → c and the cycle's c → a (not drawn),
  pointing at d lit a and b too. test/browser/lineage.html.
- **destroy()** gives the element back as it was before the start: the viewport, the canvas and
  the buttons taken out, the buttons' click listeners removed (they were added outside the
  listeners the graph removes, and still called the destroyed graph), the declared nodes back
  where they stood with their own classes and style, the nodes `setData()` made removed, the
  element's `class`, `style`, `data-graph-preset` and `data-graph-direction` restored. The DOM
  stayed, so the next `Graph.ready()` (the next `transparent:load`) built a second viewport and a
  second set of buttons beside the first. test/browser/destroy.html.

### Added

- `test/browser.test.js`: the Graph class in a headless Chrome, part of `npm test` (skipped where
  no Chrome is found; `CHROME` names one).
