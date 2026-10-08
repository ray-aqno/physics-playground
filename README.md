# Physics Playground

An interactive study app for Units C, N and R of Thomas Moore's *Six Ideas That Shaped Physics*. It is built for a study group preparing for a final exam.

- **Skills Lab:** vectors, units and dimensional analysis, trig, significant figures, estimates.
- **Unit C path (v1.0):** conservation laws (C1–C14), with interactive demonstrations: collisions, center of mass and energy bars.
- **TRIAGE problem solving:** Translate, Represent, Identify, Assume, Generate, Evaluate.
- **Feynman-style learning:** predict before you look, explain it simply, and find the gaps.
- **Duolingo-style progression:** an ordered path, XP, a daily streak, and spaced review (Leitner boxes). There are no hearts: a wrong answer gets a hint, and two misses show the worked solution.

Units N (v1.1) and R (v1.2) follow before the final.

## Original content

All lesson text, problems, worked solutions and figures in this repository are original. They are keyed to Moore's chapter numbers so the app lines up with the course, but nothing is copied or paraphrased from the textbook or its end-of-chapter problems. Contributions must follow the same rule.

## Your progress

Progress is saved in your own browser (localStorage) and is not shared or uploaded. Use **Settings → Export** to save a progress code, and **Import** to restore it on another device or browser. The export code is the only way to move progress to a different URL or device.

## Development

```bash
pnpm install
pnpm dev         # local dev server
pnpm typecheck   # tsc strict
pnpm lint        # eslint, zero warnings
pnpm test        # vitest
pnpm build       # static build in dist/
```

Design: [RFC 0001](docs/rfc/0001-physics-playground-for-six-ideas-units-c-n-and-r.md).
