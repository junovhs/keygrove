# Performance

KeyJam is a typing app, so the number that matters most is how quickly a keystroke shows on screen. Frame cost
matters too, while charms fly and letters fall. This page covers how both are measured and what the numbers are.
It's updated as each performance change lands (the `perf-pass` plan, PERF-01 to PERF-05).

## The harness: `npm run perf`

`tools/perf/stress.mjs` builds the production bundle, serves it with `vite preview`, and drives it in Chromium
through Playwright. It loads a save (`tools/perf/seed.ts`, generated from the real curriculum with `vite-node`) that
has every lesson before the Flow checkpoint cleared and every finger stop passed. Continue then opens the checkpoint's
long mixed passage, so typing never hits a result screen, a stop or a briefing. It records a DevTools trace for each
scenario:

| scenario | what it does |
| --- | --- |
| idle lesson screen | 4s with nobody typing |
| type-steady | 40 keys of the passage at a steady ~90 WPM (one key every 133ms) |
| type-misses | 30 keys with a wrong key before every eighth |
| after-typing fade | 4s after the last key, while the prompt's glow and falling letters finish |
| charms-six | six charms summoned a third of a second apart |
| charms-all | every charm (20) summoned at once |

For each scenario it reports:

- **Main-thread ms per 16.7ms frame slot** (p50/p95/p99). This is the page's own work: script, style, layout, paint
  recording and GC, merged as an interval union. Compositor and raster time aren't counted.
- **Long tasks** (over 50ms), the worst single task, and the number of style recalcs, layouts and paints.
- For typing, also:
  - **Keystroke to frame**: from the keydown's timestamp to the end of the frame that shows it. The harness uses a
    one-shot `requestAnimationFrame` per key, then a message posted after that frame's rendering, and never runs a
    loop of its own.
  - **Keydown handler**: the page's own `keydown` dispatch time, from the trace.
  - **Recalcs and layouts per key**.

The harness tracks the cursor itself and sends raw key events, so nothing but the keys runs in the page while it
measures. It also checks that the page's cursor ended where the harness typed to.

Pass criteria per scenario:

| criterion | budget |
| --- | --- |
| p95 of frame slots | ≤ 8ms (half a frame; the browser needs the rest) |
| p99 of frame slots | ≤ 16.7ms |
| slots over a whole frame | ≤ 2% |
| long tasks | none |
| keystroke to frame, p95 | ≤ 33.3ms (shown by the next frame; one frame of waiting is the floor, not the budget) |

Options: `--width/--height/--dpr` (default 1920×1080 @2x), `--only <text>`, `--budget <ms>`, `--throttle <n>`, and
`--chrome <path>` (or `PERF_CHROME`) to use an installed Chrome when Playwright's browser isn't downloaded.
`--throttle 4` slows the CPU through DevTools to stand in for an older school laptop, which is the machine KeyJam
most needs to feel good on.

## Baseline (before the perf pass)

Measured on 2026-09-23 on a current desktop, at 1920×1080 @2x, as two runs of each. Run-to-run noise is about ±1ms at
p95.

### Unthrottled: everything passes

| scenario | p50 / p95 / p99 ms | worst task | recalcs | layouts | key→frame p50 / p95 | handler p50 / p95 | recalcs, layouts per key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| idle | 0 / 0 / 0.2 | 0.3 | 6 | 0 | | | |
| type-steady | 0.6 / 5.6–6.4 / 7.3–8.2 | 16.3 | 160 | 158 | 21–24 / 28.5–30 | 4.2–4.4 / 5.6 | 4 / 4 |
| type-misses | 0.6 / 4.6–4.8 / 5.5 | 5.9 | 128 | 128 | 18 / 27.5 | 3.5 / 4.4 | 3.9 / 3.9 |
| after-typing fade | 0 / 0.1 / 1.4 | 0.6 | 9 | 9 | | | |
| charms-six | 2.2–2.5 / 5.5–5.7 / 6.2–6.5 | 3.8 | 673 | 513 | | | |
| charms-all (20) | 4 / 7–7.5 / 8.5–9.2 | 5.6 | 660 | 618 | | | |

### `--throttle 4` (older school laptop): typing and charms fail

| scenario | p50 / p95 / p99 ms | worst task | recalcs | layouts | key→frame p50 / p95 / max | handler p50 / p95 | recalcs, layouts per key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| idle | 0 / 0 / 0.8–1 | 1 | 6 | 0 | | | |
| type-steady | 1.5 / **13.9–14.6** / 16 | 36.4 | 136 | 134 | **66–73 / 89–95 / 175–181** | **11 / 26–27** | 3.4 / 3.4 |
| type-misses | 1.5 / **11–12.7** / 15 | 21.8 | 112 | 112 | **63 / 75–89 / 107–127** | 9 / 11–16 | 3.4 / 3.4 |
| after-typing fade | 0 / 0.1 / 3.5 | 1.3 | 9 | 9 | | | |
| charms-six | 4.9 / **11.3–11.6** / 12.9 | 8.4 | 490 | 355 | | | |
| charms-all (20) | 7.4 / **13.5** / 14.7 | 14.7 | 390 | 370 | | | |

What the baseline says:

- **Typing is the problem.** On slower hardware a keystroke takes about 65–70ms to reach the screen, around 90ms at
  p95 and up to 180ms at worst. That's four to ten frames, enough for a typist to feel. Each key runs 11–27ms of
  handler and forces three to four style recalcs and layouts. That comes from rebuilding the keymap's `innerHTML`,
  measuring it straight away (`measurePitch`), repainting both hands, and rewriting the badges and the finger hint.
  Fixed by PERF-02.
- **Charms** cost 5–7ms of main thread per frame for their whole flight, with hundreds of recalcs and layouts and
  thousands of paints. That comes from per-frame `hidden` toggles, a fresh `fillRect` sprite for every actor,
  per-frame glints, and the holo sheen animating `background-position`. Fixed by PERF-04.
- **Idle and the after-typing fade are already cheap.** The canvas prompt stops its loop once its effects settle, and
  its drawing barely shows on the main thread. PERF-03 is about the size of what the canvas clears and uploads each
  frame, which is raster and GPU work that this trace doesn't count.
