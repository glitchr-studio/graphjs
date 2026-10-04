---
title: graphjs
order: 1
---

# graphjs

A layered directed graph that is dragged and zoomed: HTML nodes, SVG edges, no
dependency. Written for family trees (`tree`) and pipelines (`pipeline`).

- [Installation and use](../README.md)
- [The layout](layout.md): ranks, order, places, edges
- [Styling](styling.md): the `--graph-*` variables, the presets, the states

## In a Symfony / Encore site

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

The graphs start by themselves at page load and at each `transparent:load`.
A large graph is better loaded as JSON and given to `setData()`.
