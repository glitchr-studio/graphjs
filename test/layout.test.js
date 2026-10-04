import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout, path, lineage } from '../src/js/layout.js';

// A family over three generations: two grandparents, their union, two
// children, a spouse who has no parent in the tree, a grandchild.
const family = {
    nodes: [
        { id: 'gf' }, { id: 'gm' }, { id: 'u1' },
        { id: 'aunt' }, { id: 'father' }, { id: 'mother' }, { id: 'u2' },
        { id: 'me' },
    ],
    edges: [
        { from: 'gf', to: 'u1' }, { from: 'gm', to: 'u1' },
        { from: 'u1', to: 'aunt' }, { from: 'u1', to: 'father' },
        { from: 'father', to: 'u2' }, { from: 'mother', to: 'u2' },
        { from: 'u2', to: 'me' },
    ],
};

function overlaps(result, gap = 0) {
    const nodes = [...result.nodes.values()];
    const found = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const apart = a.x + a.width + gap <= b.x + 0.01 || b.x + b.width + gap <= a.x + 0.01
                || a.y + a.height <= b.y + 0.01 || b.y + b.height <= a.y + 0.01;
            if (!apart) found.push(a.id + '/' + b.id);
        }
    }
    return found;
}

test('ranks follow the longest path', () => {
    const result = layout({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'a', to: 'c' }, { from: 'c', to: 'd' }],
    });
    assert.deepEqual(['a', 'b', 'c', 'd'].map((id) => result.nodes.get(id).rank), [0, 1, 2, 3]);
});

test('a given rank is kept, and what follows is ranked after it', () => {
    const result = layout({
        nodes: [{ id: 'a', rank: 3 }, { id: 'b' }, { id: 'c', rank: 7 }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
    });
    assert.equal(result.nodes.get('a').rank, 3);
    assert.equal(result.nodes.get('b').rank, 4);
    assert.equal(result.nodes.get('c').rank, 7);
    assert.deepEqual(result.ranks.map((r) => r.rank), [3, 4, 5, 6, 7]);
});

test('a spouse without parents stands in the rank of the partner', () => {
    const result = layout(family);
    const rank = (id) => result.nodes.get(id).rank;
    assert.equal(rank('gf'), 0);
    assert.equal(rank('gm'), 0);
    assert.equal(rank('father'), 2);
    assert.equal(rank('mother'), 2, 'the spouse is not sent to the top');
    assert.equal(rank('u2'), 3);
    assert.equal(rank('me'), 4);
    // ... and next to the partner
    assert.equal(Math.abs(result.nodes.get('father').order - result.nodes.get('mother').order), 1);
});

test('an edge closing a cycle is ignored, the rest is laid out', () => {
    const result = layout({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a' }],
    });
    assert.deepEqual(result.ignored, [{ from: 'c', to: 'a', index: 2, reason: 'cycle' }]);
    assert.deepEqual(['a', 'b', 'c'].map((id) => result.nodes.get(id).rank), [0, 1, 2]);
    assert.equal(result.edges.length, 2);
});

test('loops, repeated edges and edges to nowhere are ignored', () => {
    const result = layout({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ from: 'a', to: 'a' }, { from: 'a', to: 'b' }, { from: 'a', to: 'b' }, { from: 'a', to: 'z' }],
    });
    assert.deepEqual(result.ignored.map((e) => e.reason), ['loop', 'duplicate', 'unknown']);
    assert.equal(result.edges.length, 1);
});

test('no two nodes overlap, and the gap is kept inside a rank', () => {
    const result = layout(family, { gap: 20 });
    assert.deepEqual(overlaps(result, 0), []);
    const byRank = new Map();
    result.nodes.forEach((n) => { if (!byRank.has(n.rank)) byRank.set(n.rank, []); byRank.get(n.rank).push(n); });
    byRank.forEach((nodes) => {
        nodes.sort((a, b) => a.x - b.x);
        for (let i = 1; i < nodes.length; i++) {
            assert.ok(nodes[i].x - (nodes[i - 1].x + nodes[i - 1].width) >= 20 - 0.01);
        }
    });
});

test('no overlap in a wide random graph with nodes of different sizes', () => {
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const nodes = [];
    const edges = [];
    for (let i = 0; i < 120; i++) {
        nodes.push({ id: 'n' + i, width: 60 + Math.floor(random() * 140), height: 30 + Math.floor(random() * 50) });
        if (i > 0) {
            const parents = 1 + Math.floor(random() * 2);
            for (let p = 0; p < parents; p++) edges.push({ from: 'n' + Math.floor(random() * i), to: 'n' + i });
        }
    }
    ['down', 'right'].forEach((direction) => {
        const result = layout({ nodes, edges }, { direction });
        assert.equal(result.nodes.size, 120);
        assert.deepEqual(overlaps(result), [], direction);
        result.nodes.forEach((n) => {
            assert.ok(n.x >= -0.01 && n.y >= -0.01, 'inside the canvas');
            assert.ok(n.x + n.width <= result.width + 0.01 && n.y + n.height <= result.height + 0.01, 'inside the canvas');
        });
    });
});

test('direction right stacks the ranks from left to right', () => {
    const data = {
        nodes: [{ id: 'build' }, { id: 'test' }, { id: 'lint' }, { id: 'deploy' }],
        edges: [{ from: 'build', to: 'test' }, { from: 'build', to: 'lint' }, { from: 'test', to: 'deploy' }, { from: 'lint', to: 'deploy' }],
    };
    const result = layout(data, { direction: 'right', nodeWidth: 120, nodeHeight: 40, rankGap: 60 });
    const at = (id) => result.nodes.get(id);
    assert.equal(at('build').x, 0);
    assert.equal(at('test').x, 180);
    assert.equal(at('lint').x, 180);
    assert.equal(at('deploy').x, 360);
    assert.notEqual(at('test').y, at('lint').y);
    assert.equal(result.direction, 'right');
    assert.equal(result.width, 480);
    // an edge leaves by the right side and arrives by the left one
    const edge = result.edges.find((e) => e.from === 'build' && e.to === 'test');
    assert.equal(edge.points[0].x, 120);
    assert.equal(edge.points[edge.points.length - 1].x, 180);
});

test('sort: false keeps the order the nodes came in', () => {
    const data = {
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'y' }, { id: 'x' }],
        edges: [{ from: 'a', to: 'x' }, { from: 'b', to: 'y' }],
    };
    const kept = layout(data, { sort: false });
    assert.ok(kept.nodes.get('y').x < kept.nodes.get('x').x, 'y came first');
    const sorted = layout(data);
    assert.ok(sorted.nodes.get('x').x < sorted.nodes.get('y').x, 'the crossing is undone');
});

test('an edge over several ranks is led through each of them', () => {
    const result = layout({
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'a', to: 'c' }],
    });
    const long = result.edges.find((e) => e.from === 'a' && e.to === 'c');
    assert.ok(long.points.length >= 3);
    // where it crosses b's rank, it does not run under b
    const b = result.nodes.get('b');
    const through = long.points[1];
    assert.ok(through.x <= b.x || through.x >= b.x + b.width);
});

test('an only child stands straight under its parent', () => {
    const result = layout({
        nodes: [{ id: 'a', width: 200 }, { id: 'b', width: 80 }, { id: 'c', width: 120 }],
        edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
    });
    const centre = (id) => result.nodes.get(id).x + result.nodes.get(id).width / 2;
    assert.equal(centre('a'), centre('b'));
    assert.equal(centre('b'), centre('c'));
});

test('parents stand around their union, children under it', () => {
    const result = layout(family);
    const centre = (id) => result.nodes.get(id).x + result.nodes.get(id).width / 2;
    assert.ok(Math.abs((centre('gf') + centre('gm')) / 2 - centre('u1')) < 1);
    assert.ok(Math.abs((centre('father') + centre('mother')) / 2 - centre('u2')) < 1);
    assert.ok(Math.abs(centre('u2') - centre('me')) < 1);
});

test('an empty graph and a lone node', () => {
    const empty = layout({ nodes: [], edges: [] });
    assert.equal(empty.nodes.size, 0);
    assert.equal(empty.width, 0);
    assert.equal(empty.height, 0);
    const lone = layout({ nodes: [{ id: 1, width: 90, height: 30 }] });
    assert.deepEqual(lone.nodes.get('1'), { id: '1', x: 0, y: 0, width: 90, height: 30, rank: 0, order: 0 });
    assert.equal(lone.width, 90);
    assert.equal(lone.height, 30);
});

test('a long chain does not exhaust the stack', () => {
    const nodes = [];
    const edges = [];
    for (let i = 0; i < 5000; i++) {
        nodes.push({ id: i });
        if (i) edges.push({ from: i - 1, to: i });
    }
    const result = layout({ nodes, edges }, { direction: 'right' });
    assert.equal(result.nodes.get('4999').rank, 4999);
});

test('path: curve, step and line', () => {
    const points = [{ x: 0, y: 0 }, { x: 100, y: 80, via: 40 }];
    assert.equal(path(points, { shape: 'curve' }), 'M0 0C0 40 100 40 100 80');
    assert.equal(path(points, { shape: 'line' }), 'M0 0L100 80');
    assert.equal(path(points, { shape: 'step', radius: 0 }), 'M0 0L0 40Q0 40 0 40L100 40Q100 40 100 40L100 80');
    assert.equal(path(points, { shape: 'step', radius: 10 }), 'M0 0L0 30Q0 40 10 40L90 40Q100 40 100 50L100 80');
    // straight under: a line, whatever the shape
    assert.equal(path([{ x: 5, y: 0 }, { x: 5, y: 80, via: 40 }], { shape: 'step' }), 'M5 0L5 80');
    // to the right, the turn is on x
    assert.equal(path([{ x: 0, y: 0 }, { x: 80, y: 100, via: 40 }], { direction: 'right', shape: 'curve' }), 'M0 0C40 0 40 100 80 100');
    assert.equal(path([]), '');
});

test('lineage: ancestors and descendants, not the siblings', () => {
    const line = lineage(family, 'father');
    assert.deepEqual([...line.nodes].sort(), ['father', 'gf', 'gm', 'me', 'u1', 'u2']);
    assert.ok(!line.nodes.has('aunt'));
    assert.ok(!line.nodes.has('mother'));
    assert.deepEqual([...line.edges].sort(), [0, 1, 3, 4, 6]);
});
