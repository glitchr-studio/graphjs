// The Graph class in a browser: each page of test/browser/ is opened in a headless Chrome, under
// a light and then a dark colour scheme, and writes its verdict in #result - lines starting with
// "ok", or "FAIL ...". A console error or an uncaught exception fails the page too.
//
// Chrome is driven over its DevTools protocol (Node's own WebSocket: Node 22 or later), the
// repository served over HTTP on a free port of 127.0.0.1. CHROME names the browser (default: the
// macOS application); where none is found, the test is skipped and says so.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const timeout = +(process.env.TIMEOUT || 10000);
const pages = readdirSync(join(here, 'browser')).filter((f) => f.endsWith('.html')).sort();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function serve() {
    const server = createServer((req, res) => {
        const file = join(root, normalize(decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)));
        if (!file.startsWith(root + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        createReadStream(file).pipe(res);
    });
    return new Promise((f) => server.listen(0, '127.0.0.1', () => f(server)));
}

function launch() {
    const profile = mkdtempSync(join(tmpdir(), 'graphjs-tests-'));
    const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', '--no-first-run', '--user-data-dir=' + profile, '--window-size=1280,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    return new Promise((f, reject) => {
        let err = '';
        child.stderr.on('data', (chunk) => {
            err += chunk;
            const m = err.match(/DevTools listening on (ws:\/\/\S+)/);
            if (m) f({ child, url: m[1], profile });
        });
        child.on('exit', () => reject(new Error('Chrome left: ' + err.slice(-400))));
        setTimeout(() => reject(new Error('Chrome did not say where it listens: ' + err.slice(-400))), 10000);
    });
}

function connect(url) {
    return new Promise((f, reject) => {
        const ws = new WebSocket(url);
        let id = 0;
        const waiting = new Map();
        const listeners = [];
        ws.onmessage = (m) => {
            const msg = JSON.parse(m.data);
            if (msg.id && waiting.has(msg.id)) {
                const { ok, ko } = waiting.get(msg.id);
                waiting.delete(msg.id);
                msg.error ? ko(new Error(msg.error.message)) : ok(msg.result);
            } else if (msg.method) {
                listeners.slice().forEach((fn) => fn(msg));
            }
        };
        ws.onerror = (e) => reject(new Error('WebSocket: ' + (e.message || 'error')));
        ws.onopen = () => f({
            send: (method, params = {}, sessionId) => new Promise((ok, ko) => {
                waiting.set(++id, { ok, ko });
                ws.send(JSON.stringify({ id, method, params, sessionId }));
            }),
            on: (fn) => listeners.push(fn),
            close: () => ws.close(),
        });
    });
}

async function open(cdp, url, scheme) {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Page.bringToFront', {}, sessionId);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] }, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    const errors = [];
    cdp.on((msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console.error: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    });
    await cdp.send('Page.navigate', { url }, sessionId);
    const began = Date.now();
    let result = 'FAIL no verdict within ' + timeout + 'ms';
    while (Date.now() - began < timeout) {
        const { result: r } = await cdp.send('Runtime.evaluate', { expression: '(document.getElementById("result") || {}).textContent', returnByValue: true }, sessionId);
        if (typeof r.value === 'string' && r.value !== 'pending') { result = r.value; break; }
        await new Promise((f) => setTimeout(f, 50));
    }
    await cdp.send('Target.closeTarget', { targetId });
    return result.split('\n').concat(errors);
}

const found = existsSync(chrome);

test('the Graph class in a browser', { skip: found ? false : 'no Chrome (CHROME=' + chrome + ')' }, async (t) => {
    const server = await serve();
    const browser = await launch();
    const cdp = await connect(browser.url);
    const origin = 'http://127.0.0.1:' + server.address().port;
    try {
        for (const scheme of ['light', 'dark']) {
            for (const page of pages) {
                await t.test(page + ' (' + scheme + ')', async () => {
                    const lines = await open(cdp, origin + '/test/browser/' + page, scheme);
                    const failed = lines.filter((line) => !line.startsWith('ok'));
                    assert.deepEqual(failed, [], lines.join('\n'));
                });
            }
        }
    } finally {
        cdp.close();
        await new Promise((f) => { browser.child.on('exit', f); browser.child.kill(); setTimeout(f, 3000); });
        try { rmSync(browser.profile, { recursive: true, force: true }); } catch (e) { /* Chrome still writing */ }
        server.closeAllConnections();
        server.close();
    }
});
