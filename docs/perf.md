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
- **Off-main-thread time** (reported, not gated): top-level task time on the renderer's compositor thread, its raster
  workers and the GPU process. This is where canvas uploads and raster land. In this headless build the GPU is
  software, so treat it as relative, not absolute.
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

## PERF-02: keystrokes update only what changed

**What was wrong.** Every keystroke:
- rebuilt the whole on-screen keyboard (about 50 caps) with `innerHTML`, measured it straight away for the row
  stagger, which forced a layout mid-handler, and rebound hover handlers on every cap;
- repainted both hand illustrations (a filtered SVG) even when the finger hadn't changed;
- rewrote the eight finger badges, the finger hint and the metrics text whether or not they had changed.

**What changed** (`src/main.ts`, `src/ui/hands.ts`, `index.html`, `src/ui/journey.css`):
- The keyboard is built once per layout (explore mode and the familiar keys). After that a keystroke only moves the
  `hot` class, the shifted label and the Shift cap highlight, touching the two or three caps that change.
- Hover and explore clicks are delegated once on `#keymap`. The row stagger is measured on build and on resize only.
- `paintHand` remembers the finger it last painted and returns early. Badges, the hint, the next cue and the metrics
  are written only when their value changes (`setText`/`setHtml`), because a same-value write still invalidates style
  and layout.
- The progress bar grows with `transform: scaleX` instead of animating `width`.
- `body:has(.arena.brief-mode) .metrics` is now `body.brief-open .metrics`, set alongside `brief-mode`.
- The `.keymap:has(...)` sizing rules stay as they are. With the keyboard no longer rebuilt, nothing a keystroke
  changes can invalidate them (only the `hot` class moves), and turning them into classes would change their
  specificity for no measurable gain.

**Results** (1920×1080 @2x, two runs each):

| `--throttle 4` | before | after |
| --- | --- | --- |
| type-steady p95 / p99 frame slot | 13.9–14.6 / 16 ms | **4.4–4.7 / 6.9–7.8 ms** (passes) |
| type-steady layouts per key | 3.4 | **0.2** |
| type-steady recalcs per key | 3.4 | 1.6 |
| type-steady keydown handler p50 / p95 | 11 / 26–27 ms | **2.4–2.5 / 4–4.6 ms** |
| type-steady key→frame p50 / p95 / max | 66–73 / 89–95 / 175–181 ms | 55–59 / 66–68 / 68–73 ms |
| type-misses p95 frame slot | 11–12.7 ms | 3.9–4.1 ms |
| type-misses key→frame p50 / p95 | 63 / 75–89 ms | 49–50 / 62–66 ms |

| unthrottled | before | after |
| --- | --- | --- |
| type-steady p95 frame slot | 5.6–6.4 ms | 1.6 ms |
| type-steady handler p50 | 4.2–4.4 ms | 0.9 ms |
| type-steady key→frame p50 / p95 | 21–24 / 28.5–30 ms | 19 / 25.6 ms |

The main thread now does almost nothing per keystroke, and the worst key-to-screen time more than halved. On the slow
CPU, key-to-screen is still about three frames even though each frame's main-thread work is small. That remainder is
the canvas prompt: every frame it clears and hands the compositor a canvas about 3300×2900 device pixels, most of it
the invisible 1100px drop zone for falling letters. That's PERF-03.

## PERF-03: the canvas prompt draws only what can be seen

**What was wrong.** To let typed letters fall "out of the viewport", the prompt's canvas hung a fixed 1100px drop zone
below the text. At 1920×1080 @2x that made the canvas 2128×2694 device pixels, cleared and redrawn every frame while
typing. But the text panel around it is `overflow: hidden`, so letters vanish at the panel's bottom edge, and about
80% of those pixels were never visible. On a slow CPU the oversized surface held each frame back. With the main thread
nearly idle after PERF-02, key-to-screen was still about 3½ frames.

**What changed** (`src/render/prompt.ts`, `src/render/effects.ts`):
- The drop zone now reaches exactly as far as a letter can be seen: the bottom edge of the nearest clipping ancestor
  (the text panel), or the viewport's bottom if nothing clips. It's measured with the host on resize, never in the
  frame loop. Same page, same size: the canvas is now 2128×638 device pixels, about a quarter of the pixels.
- A falling letter is freed once it passes that edge instead of living out its 1.5s off-screen, so the frame loop
  stops as soon as the last visible letter is gone.
- Two things were measured and left alone:
  - Removing the cursor glow's `shadowBlur` changed nothing beyond run-to-run noise (key→frame p50 20.7–21.3ms vs
    23.5–24.6ms, p95 30–35ms vs 31ms), so the glow keeps its exact look.
  - The heat glow's fade costs nothing measurable on the main thread (after-typing p95 0ms).

  A separate overlay canvas for the falling letters wasn't needed once the canvas matched what can be seen.

**Results** (1920×1080 @2x):

| `--throttle 4` | after PERF-02 | after PERF-03 |
| --- | --- | --- |
| type-steady key→frame p50 / p95 | 55–59 / 66–68 ms | **23.5–25 / 31–47 ms** |
| type-misses key→frame p50 / p95 | 49–50 / 62–66 ms | **17–19 / 25–29 ms** (passes) |
| type-steady p95 frame slot | 4.4–4.7 ms | 3.9–4.2 ms |
| after-typing fade, off-main-thread | (not measured) | compositor 2 ms, GPU 1 ms in 4s |

| unthrottled | after PERF-02 | after PERF-03 |
| --- | --- | --- |
| type-steady key→frame p50 / p95 | 19 / 25.6 ms | **14.6 / 20.4 ms** |
| type-misses key→frame p50 / p95 | 19.7 / 24 ms | **10.2 / 21.6 ms** |

Against the original baseline on the slow CPU, key-to-screen went from about 70ms typical and 180ms worst to about
24ms typical and under 50ms worst. The GPU process's total time while typing rose (about 1.6s → 2s over 6.5s)
because frames now flow at the rate keys arrive instead of stalling behind the oversized surface. That's more
frames, each far smaller.

What still fails at `--throttle 4`: the charm scenarios (p95 11.5–13ms). That's PERF-04.
