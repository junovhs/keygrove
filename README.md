# RQWERTY

A compact, guided typing course teaching **Relaxed QWERTY 1.0**, with traditional touch typing available as an alternative. The implementation repository retains its original name, `keygrove`.

36 lessons across seven chapters cover letters, capitals, punctuation, numbers and sustained mixed text. Four optional code lessons follow Bark. One Continue action routes learning, short targeted practice and returns. Seven permanent illustrated keepsakes commemorate the main chapters; Code has an eighth. Speed and absence never gate progress.

## Development

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

TypeScript 7 native compiler, Vite, vanilla DOM/SVG UI, and a canvas typing prompt laid out with Pretext. `?dom=1` enables the diagnostic DOM prompt. The public About panel and static `/docs/` pages share `src/docs-content.ts` through dopedocs.

Guest learning persists locally in a separate save. The optional account uses Supabase; see [account setup](docs/accounts.md). Never put privileged credentials in the browser build.

## Product contracts

- [Method specification](docs/typing-method-spec.md): canonical finger assignments and teaching philosophy.
- [Current progression](docs/progression.md): evidence, routing, permanence and compatibility.
- Ishoo DEC-05 governs the guided-course direction and supersedes the older star-gated progression proposal.

The app observes characters and timing, not finger choice or posture. Completing the course demonstrates performance on its passages; it does not promise a particular real-world typing speed.

## Verification

Tests cover every trail/stage across 50 deterministic seeds, allowed-key and checkpoint coverage, both methods through all 40 lessons (including recoverable mistakes), timing and accuracy, persistent guest/account isolation, save migration and permanent keepsakes. Release browser checks exercise onboarding, repairs, warmups, chapter reveals, replay return and the final passage with actual key input.
