/**
 * Frame-budget harness for KeyJam (ported from noceremony's tools/perf/stress.mjs).
 *
 * Serves the production build, opens it in Chromium, loads a save that sits on the Flow checkpoint's long passage
 * (tools/perf/seed.ts), and records a DevTools trace across the scenarios that matter for a typing app:
 *
 *   type-steady     a passage typed at a steady ~90 WPM
 *   type-misses     the same with a wrong key every eighth press
 *   after-typing    the seconds after the last key, while the prompt's effects fade
 *   idle            the lesson screen with nobody typing
 *   charms-six      six charms summoned a third of a second apart
 *   charms-all      every charm summoned at once
 *
 * For each it reports the page's main-thread busy time in every 16.7ms frame slot (script, style, layout, paint
 * recording, GC — merged as an interval union), long tasks, and how many style recalcs, layouts and paints ran.
 * Typing scenarios also report keystroke latency: from the keydown's timestamp to the end of the frame that shows it
 * (a one-shot requestAnimationFrame per key, then a message posted after that frame's rendering), and the time the
 * page's own keydown handler took (from the trace).
 *
 * Pass criteria per scenario: p95 slot <= BUDGET (8ms), p99 slot <= 16.7ms, <= 2% of slots over a frame, no long task
 * (> 50ms), and for typing a keystroke-to-frame p95 within two frames (33.3ms): a key that lands just after a frame
 * starts has to wait for the next one, so one frame is the floor, not the budget. Compositor and raster time are not
 * counted.
 *
 *   npm run perf
 *   node tools/perf/stress.mjs [--width 1920 --height 1080 --dpr 2] [--throttle 4] [--only type] [--budget 8]
 *                              [--chrome /usr/bin/google-chrome]
 *
 * --throttle N slows the CPU through DevTools to stand in for slower hardware (4 ≈ an older school laptop).
 * --chrome uses an installed Chrome when Playwright's own browser is not downloaded (also PERF_CHROME).
 */
import { chromium } from "playwright";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const arg = (name, fallback) => {
    const at = process.argv.indexOf(`--${name}`);
    return at > 0 ? process.argv[at + 1] : fallback;
};
const WIDTH = Number(arg("width", 1920));
const HEIGHT = Number(arg("height", 1080));
const DPR = Number(arg("dpr", 2));
const PORT = Number(arg("port", 4189));
const THROTTLE = Number(arg("throttle", 1));
const BUDGET_MS = Number(arg("budget", 8));
const CHROME = arg("chrome", process.env.PERF_CHROME);
const ONLY = arg("only", "");
const FRAME_MS = 1000 / 60;
const LONG_TASK_MS = 50;
/** ~90 WPM: five characters a word, 1.5 words a second. */
const KEY_GAP_MS = 133;

/** npx runs vite as a grandchild; kill the whole group so no server lingers. */
function stop(server) {
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
}

async function serve() {
    const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"], detached: true });
    for (let tries = 0; tries < 100; tries += 1) {
        try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return server; } catch {}
        await wait(100);
    }
    stop(server);
    throw new Error("preview server did not start");
}

const quantile = (values, q) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
};

/** Per-frame main-thread cost from a devtools.timeline trace. */
function analyse(events, windowMs) {
    const main = events.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
    const onMain = events.filter((e) => e.pid === main?.pid && e.tid === main?.tid && e.ph === "X" && e.dur);
    const kinds = {
        script: ["FunctionCall", "EvaluateScript", "TimerFire", "FireAnimationFrame", "EventDispatch", "RunMicrotasks", "V8.Execute"],
        style: ["UpdateLayoutTree", "RecalculateStyles"],
        layout: ["Layout"],
        paint: ["Paint", "PaintImage", "PrePaint", "Layerize", "UpdateLayer", "CompositeLayers"],
    };
    const totals = {};
    for (const [kind, names] of Object.entries(kinds)) totals[kind] = onMain.filter((e) => names.includes(e.name)).reduce((a, e) => a + e.dur / 1000, 0);
    // Page work only: the union of the work events (they nest), not whole tasks, whose duration also covers the main
    // thread parked while the compositor rasterises in software.
    const WORK = new Set([
        ...Object.values(kinds).flat(), "ParseHTML", "ParseAuthorStyleSheet", "HitTest", "Decode Image", "Decode LazyPixelRef",
        "MajorGC", "MinorGC", "V8.GCScavenger", "V8.GCFinalizeMC", "BlinkGC.AtomicPhase",
    ]);
    const spans = [];
    for (const e of onMain.filter((e) => WORK.has(e.name)).sort((a, b) => a.ts - b.ts)) {
        const end = e.ts + e.dur, last = spans.at(-1);
        if (last && e.ts <= last.end) last.end = Math.max(last.end, end);
        else spans.push({ ts: e.ts, end });
    }
    const start = spans.reduce((low, s) => Math.min(low, s.ts), Infinity);
    const slots = new Float64Array(Math.max(1, Math.ceil(windowMs / FRAME_MS)));
    for (const s of spans) {
        let from = (s.ts - start) / 1000;
        const to = (s.end - start) / 1000;
        while (from < to) {
            let i = Math.floor(from / FRAME_MS);
            if ((i + 1) * FRAME_MS <= from) i += 1;
            if (i >= slots.length) break;
            const edge = Math.min(to, (i + 1) * FRAME_MS);
            slots[i] += edge - from;
            from = edge;
        }
    }
    const values = [...slots];
    const counts = {};
    for (const e of onMain) if (["Layout", "UpdateLayoutTree", "Paint"].includes(e.name)) counts[e.name] = (counts[e.name] ?? 0) + 1;
    // The page's own keydown handling, one EventDispatch per key.
    const keydowns = onMain.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "keydown").map((e) => e.dur / 1000);
    return {
        totals, counts, slots: values.length,
        p50: quantile(values, 0.5), p95: quantile(values, 0.95), p99: quantile(values, 0.99), max: Math.max(...values),
        overFrame: values.filter((v) => v > FRAME_MS).length,
        longTasks: spans.filter((s) => (s.end - s.ts) / 1000 > LONG_TASK_MS).length,
        worstTask: spans.reduce((high, s) => Math.max(high, (s.end - s.ts) / 1000), 0),
        keydowns,
    };
}

async function trace(page, client, label, run, seconds) {
    if (ONLY && !label.includes(ONLY)) return null;
    const chunks = [];
    client.on("Tracing.dataCollected", ({ value }) => chunks.push(...value));
    await client.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,toplevel,blink", transferMode: "ReportEvents" });
    await page.evaluate(() => { window.__lat.length = 0; window.__measure = true; });
    const began = Date.now();
    await run();
    const left = seconds * 1000 - (Date.now() - began);
    if (left > 0) await wait(left);
    const ms = Date.now() - began;
    const latencies = await page.evaluate(() => { window.__measure = false; return window.__lat.slice(); });
    const done = new Promise((resolve) => client.once("Tracing.tracingComplete", resolve));
    await client.send("Tracing.end");
    await done;
    client.removeAllListeners("Tracing.dataCollected");
    const r = analyse(chunks, Math.max(ms, seconds * 1000));
    const round = (v) => +v.toFixed(1);
    const failures = [];
    if (r.p95 > BUDGET_MS) failures.push(`p95 slot ${round(r.p95)}ms > ${BUDGET_MS}ms`);
    if (r.p99 > FRAME_MS) failures.push(`p99 slot ${round(r.p99)}ms > ${round(FRAME_MS)}ms`);
    if (r.overFrame > r.slots * 0.02) failures.push(`${r.overFrame}/${r.slots} slots over a frame`);
    if (r.longTasks) failures.push(`${r.longTasks} long task(s) > ${LONG_TASK_MS}ms`);
    const keyP95 = quantile(latencies, 0.95);
    if (latencies.length && keyP95 > 2 * FRAME_MS) failures.push(`keystroke-to-frame p95 ${round(keyP95)}ms > ${round(2 * FRAME_MS)}ms`);
    return {
        label, pass: failures.length === 0, failures,
        mainThreadPerFrameMs: { p50: round(r.p50), p95: round(r.p95), p99: round(r.p99), max: round(r.max) },
        slotsOverFrame: `${r.overFrame}/${r.slots}`,
        longTasks: r.longTasks, worstTaskMs: round(r.worstTask),
        totalsMs: Object.fromEntries(Object.entries(r.totals).map(([k, v]) => [k, round(v)])),
        counts: r.counts,
        ...(latencies.length ? {
            keys: latencies.length,
            keyToFrameMs: { p50: round(quantile(latencies, 0.5)), p95: round(keyP95), max: round(Math.max(...latencies)) },
            keydownHandlerMs: { p50: round(quantile(r.keydowns, 0.5)), p95: round(quantile(r.keydowns, 0.95)), max: round(Math.max(0, ...r.keydowns)) },
            recalcsPerKey: round((r.counts.UpdateLayoutTree ?? 0) / latencies.length),
            layoutsPerKey: round((r.counts.Layout ?? 0) / latencies.length),
        } : {}),
    };
}

const seed = execFileSync("npx", ["vite-node", "tools/perf/seed.ts"], { encoding: "utf8" }).trim().split("\n").at(-1);
const server = await serve();
const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ["--disable-gpu-vsync", "--enable-gpu-rasterization", "--autoplay-policy=no-user-gesture-required"] });
try {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: DPR });
    // Keystroke latency: keydown timestamp → the end of the frame that renders it. Registered before the app's own
    // listeners, one requestAnimationFrame per key (never a loop), measured only while a scenario is recording.
    await context.addInitScript(() => {
        window.__lat = []; window.__measure = false;
        const channel = new MessageChannel();
        const pending = [];
        channel.port1.onmessage = () => { const t0 = pending.shift(); if (t0 !== undefined) window.__lat.push(performance.now() - t0); };
        window.addEventListener("keydown", (e) => {
            if (!window.__measure) return;
            const t0 = e.timeStamp;
            requestAnimationFrame(() => { pending.push(t0); channel.port2.postMessage(0); });
        }, { capture: true });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => console.error("page error:", error.message));
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForFunction(() => typeof window.keyjam?.snapshot === "function");
    await page.evaluate((raw) => window.keyjam.import(JSON.parse(raw)), seed);
    await page.evaluate(() => document.fonts.ready);
    await wait(600);
    const snap = () => page.evaluate(() => { const s = window.keyjam.snapshot(); return { text: s.run.text, pos: s.run.pos, status: s.run.status, brief: !!s.brief }; });
    // A briefing may open ahead of the passage; Escape skips it.
    if ((await snap()).brief) { await page.keyboard.press("Escape"); await wait(300); }
    const start = await snap();
    if (!start.text || start.status !== "idle") throw new Error(`expected an idle passage, got ${JSON.stringify(start)}`);
    const client = await context.newCDPSession(page);
    if (THROTTLE > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });

    /**
     * Type `count` keys of the passage at a steady pace; `missEvery` inserts a wrong key before every Nth press.
     * The cursor is tracked here, not read from the page, so nothing but the keys themselves runs in the page.
     */
    let pos = start.pos;
    const type = async (count, missEvery = 0) => {
        let next = Date.now();
        for (let i = 0; i < count && pos < start.text.length - 1; i += 1) {
            const want = start.text[pos];
            const keys = missEvery && i % missEvery === missEvery - 1 ? [want === "q" ? "z" : "q", want] : [want];
            for (const k of keys) {
                next += KEY_GAP_MS;
                const gap = next - Date.now();
                if (gap > 0) await wait(gap);
                await page.keyboard.press(k === " " ? "Space" : k);
            }
            pos += 1;
        }
    };
    const results = [];
    results.push(await trace(page, client, "idle lesson screen (4s)", async () => {}, 4));
    results.push(await trace(page, client, "type-steady ~90wpm (6s)", () => type(40), 6.5));
    results.push(await trace(page, client, "type-misses every 8th (5s)", () => type(30, 8), 5.5));
    results.push(await trace(page, client, "after-typing fade (4s)", async () => {}, 4));
    const done = await snap();
    if (done.pos !== pos) throw new Error(`typing did not land: the page is at ${done.pos}, the harness typed to ${pos}`);

    // Charms: take the ids from the collection once the cheat has unlocked it, then close the book.
    const ids = await page.evaluate(async () => {
        window.keyjam.unlockAllCharms();
        await new Promise((r) => setTimeout(r, 300));
        const list = [...document.querySelectorAll("[data-summon]")].map((b) => b.dataset.summon);
        document.getElementById("brandHome")?.click();
        return [...new Set(list)];
    });
    await wait(600);
    results.push(await trace(page, client, `charms-six staggered (8s)`, async () => {
        for (const id of ids.slice(0, 6)) { await page.evaluate((id) => window.keyjam.summon(id), id); await wait(330); }
    }, 8));
    await wait(10000);
    results.push(await trace(page, client, `charms-all ${ids.length} at once (8s)`, () => page.evaluate((ids) => ids.forEach((id) => window.keyjam.summon(id)), ids), 8));

    console.log(JSON.stringify({ viewport: `${WIDTH}x${HEIGHT}@${DPR}x`, cpuThrottle: THROTTLE, budgetMs: BUDGET_MS, passage: start.text.length, charms: ids.length, results: results.filter(Boolean) }, null, 2));
    const failed = results.filter((r) => r && !r.pass);
    for (const r of failed) console.error(`FAIL ${r.label}: ${r.failures.join("; ")}`);
    if (!failed.length) console.error("PASS: every scenario inside the main-thread frame budget");
    process.exitCode = failed.length ? 1 : 0;
} finally {
    await browser.close();
    stop(server);
}
