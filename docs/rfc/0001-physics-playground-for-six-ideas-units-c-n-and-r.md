# RFC 0001: Physics Playground for Six Ideas Units C, N and R

- Status: draft
- Date: 2026-10-08
- Run: 20261008-215356-d8ce66

## Summary

Build a static web app, `~/physics-playground` (Vite + TypeScript, no backend), that helps a small study group prepare for a mid-December final covering Units C, N and R of Moore's *Six Ideas That Shaped Physics*. It combines a Skills Lab for the math the units rely on (vectors, units and dimensional analysis, trig, significant figures, estimates), interactive physics demonstrations, TRIAGE problem scaffolding (Translate, Represent, Identify, Assume, Generate, Evaluate), Feynman-style learning prompts, and a slim Duolingo-style progression: an ordered path with XP, a daily streak, and Leitner spaced review. v1 ships the Skills Lab and Unit C. Unit N and Unit R follow as v1.1 and v1.2 before the final. The council approved this scope with 7 conditions (Congressional Record 2026-10-08-physics-playground-v1); they are carried into this RFC as acceptance criteria.

## Motivation

The group is working through Units C, N and R for a mid-December final (confirmed by the user). The Unit C test on 2026-10-12 is too close for this app to help. The textbook supplies problems but gives no instant feedback, no interactive demonstrations, and no paced daily practice. Without those, practice happens in bursts before tests, misconceptions go uncorrected until graded work comes back, and weak math skills (vector components, unit checks) keep costing points on otherwise-understood physics.

Who has it: each member of the study group, studying on their own device. There is no instructor role.

If nothing changes, the group prepares for the final from the textbook and old tests alone: no feedback loop, no spacing, and no way to see the conservation laws behave.

## Design

### Principles (from Feynman and physics-education research)

1. **Intuition before formalism.** Each concept opens with a predict-then-observe demonstration, followed by the equation.
2. **Learn by doing problems.** Most lesson time goes to problems with immediate feedback.
3. **Explain it simply.** After a concept, the learner types a plain-language explanation and then compares it against a model explanation, rating themselves on Got it, Partly or Missed it. These prompts are self-rated, not auto-graded.
4. **Find the gaps.** Missed items enter spaced review (Leitner boxes), so weak spots come back until they stick.
5. **Worked examples fade into practice.** Early problems show full worked solutions; later ones remove steps.

### Stack

- Vite, TypeScript (strict), and Preact for the UI shell. Preact is about 4 KB and gives components without a heavy framework.
- Sims are drawn with Canvas 2D, and each one carries an accessible DOM overlay (numeric readouts and a text description).
- Tests run on Vitest. The physics core and the answer checker are pure TS modules with no DOM, tested headless.
- Hosting is any static host, GitHub Pages by default. No server and no accounts.

### Module layout

```
src/
  physics/      pure TS: vec2, collisions (event-driven), integrators (velocity-Verlet), invariants
  checker/      quantity parser, SI dimension algebra, numeric/vector/unit comparison, sig-fig feedback
  content/      lessons as typed TS/JSON data: skills-lab/, unit-c/, unit-n/ (v1.1), unit-r/ (v1.2)
  progress/     schema, migrations, localStorage adapter, export/import, Leitner scheduler, XP/streak
  sims/         canvas sims + accessible overlays: collisions, center-of-mass, energy-bars
  ui/           path view, lesson player, TRIAGE stepper, review session, settings
tests/          mirrors src/ (physics, checker, content keys, progress)
```

### Physics core

- **Collisions (1-D and 2-D carts/pucks).** Collisions are event-driven: find the time of contact, then resolve it in closed form with an impulse of restitution `e` (0 ≤ e ≤ 1). Free flight between collisions is exact, so momentum is conserved to floating-point precision and kinetic energy is conserved when e = 1.
- **Center of mass.** Particles are dragged and push on each other through internal forces. The display shows the system's center of mass and total momentum. With no external force, the center of mass moves at constant velocity.
- **Energy bars (spring plus ramp).** This sim integrates with velocity-Verlet at a fixed timestep (dt = 1/240 s), using an accumulator so the physics is decoupled from `requestAnimationFrame`. Bar charts for K, U_spring, U_grav and thermal update live, linked to the motion. Friction moves energy into the thermal bar, so the total stays constant.
- **Invariant API.** Every sim exposes `invariants(): Record<string, number>`, for example total momentum, KE and total energy. The tests assert on these values.

### Answer checker

- A `Quantity` is `{ value: number | Vec, dims: Dims }`, where `Dims` holds the SI base-dimension exponents `[L, M, T, I, Θ, N, J]`.
- The parser accepts forms such as `12.5 kg*m/s`, `3.0e2 N·s`, `4 J`, `<3, -4> m/s` and `(3, -4) m/s`. It knows the SI base units, the common derived units (N, J, W, Pa, Hz, C, V) and the SI prefixes. N·s and kg·m/s therefore compare as equal dimension vectors.
- Numbers are compared with a relative tolerance, 2% by default and set per item. Vectors are compared component by component, or by magnitude and direction where the item asks for that.
- Feedback comes in separate channels:
  - correct or incorrect value;
  - a units error (wrong dimensions), named as such;
  - a sign or direction error;
  - a significant-figures note, which is advisory and never marks a correct answer wrong.

### Content model

```ts
type Lesson = { id: string; unit: 'lab'|'C'|'N'|'R'; chapter: string; title: string;
                minutes: number; steps: Step[] };
type Step =
  | { kind: 'explain'; md: string }
  | { kind: 'predict'; sim: SimId; setup: object; question: Choice[]; reveal: string }
  | { kind: 'mcq'; prompt: string; choices: Choice[]; hint: string }
  | { kind: 'numeric'; prompt: string; answer: Quantity; tol?: number; hint: string; worked: string }
  | { kind: 'vector'; prompt: string; answer: Quantity; hint: string; worked: string }
  | { kind: 'triage'; problem: string; stages: TriageStage[]; answer: Quantity; worked: string }
  | { kind: 'selfExplain'; prompt: string; model: string };
type TriageStage = { stage: 'Translate'|'Represent'|'Identify'|'Assume'|'Generate'|'Evaluate';
                     prompt: string; tip: string; check?: Choice[] };
```

- **TRIAGE.** Each multi-step problem walks through the six stages, and each stage comes with a prompt and a study tip. Evaluate always asks three things: are the units right, is the sign or direction right, and does the answer behave sensibly at a limiting case (for example m₂ → 0 or e → 1)?
- **Originality.** All text, problems and figures are original. Lessons are keyed to chapter numbers (C1–C14, confirmed by the user) but do not reproduce or paraphrase Moore's text or end-of-chapter problems.
- **Skills Lab (v1).** Lessons cover:
  - vector components, magnitude and direction, addition and subtraction, dot product, cross product (2-D z-component and 3-D);
  - units and dimensional analysis, SI prefixes, scientific notation;
  - right-triangle trig and resolving vectors;
  - significant figures;
  - order-of-magnitude estimates.

  The Lab unlocks first, and each unit's lessons link to the Lab skills they need.

### Progression

- **Path.** Lessons run in an ordered, linear path within each unit, with Lab, then C, then N, then R. Each lesson unlocks when the previous one is done. A branching skill tree is deferred to a later version.
- **XP and streak.** A completed step earns 10 XP, a perfect lesson adds a 20 XP bonus, and a review item earns 5 XP. The streak counts consecutive local calendar days with at least one completed lesson or review session.
- **No hearts.** A wrong answer gets a retry with a hint. After two misses the app shows the worked solution and the learner moves on. Nothing ever locks them out.
- **Leitner review.** Every missed item, and every self-explanation rated Partly or Missed it, enters box 1. There are 5 boxes with intervals of 1, 2, 4, 8 and 16 days. A correct review moves the item up a box, and a miss sends it back to box 1. The daily review session pulls whatever is due, capped at 20 items.

### Progress storage

```ts
type ProgressV1 = {
  version: 1;
  xp: number;
  streak: { count: number; lastActiveDay: string /* YYYY-MM-DD local */ };
  lessons: Record<string, { done: boolean; bestScore: number; completedAt?: string }>;
  leitner: Record<string /* itemId */, { box: 1|2|3|4|5; due: string }>;
  lastExportAt?: string;
};
```

- Progress is stored in `localStorage` under the key `pp.progress`. The app reads it through a `migrate(raw) → ProgressV1` chain; an unknown or corrupt payload is kept in a backup key, and the app starts fresh with a visible notice.
- **Export.** The app writes base64 JSON plus a checksum and offers it as a downloadable file or a code to copy.
- **Import.** The app validates the checksum and version, shows a summary (XP, lessons done), and asks for confirmation before overwriting.
- **Weekly nudge.** A banner appears when `lastExportAt` is more than 7 days old.

### Accessibility and mobile

Every sim has:
- a numeric readout of its invariants;
- a text description of the current state;
- keyboard controls (arrows to adjust, Space to run or pause, R to reset).

Touch dragging works on phones, and the layout works from 360 px wide. The energy bars carry labels and values, so they don't rely on color alone.

## Alternatives

- **Single HTML artifact.** This is fastest to share, but too cramped for a multi-unit path, hard to test, and it would need a rewrite to grow. Rejected.
- **Shared leaderboard with a backend.** It would add motivation for the group, but it means accounts, hosting, privacy questions and ops burden. Rejected for now; it could come after the final if wanted.
- **Minimal checklist with no gamification** (the council Minimalist's position). It is smaller, but it delivers a different product from the one the user asked for, and spaced review is pedagogy rather than decoration. Rejected by the council chair.
- **Hearts and lives (the full Duolingo copy).** They punish the retries learning depends on. Rejected.
- **Integrating collisions with a fixed-step engine** (for example matter.js). It is a bigger dependency, conservation is only approximate at contacts, and it hides the closed-form physics the lessons teach. Rejected in favor of event-driven impulses.
- **A units library (math.js or similar).** It is heavy, and its feedback is not shaped for teaching. A small hand-written dimension algebra is about 300 lines and easy to test.

## Risks

| Risk | Likelihood | Impact | Containment / detection |
|---|---|---|---|
| Wrong answer key or checker bug silently teaches errors | Medium | High | Each answer key is derived a second, independent way and stored in table-driven tests (`tests/content/*.keys.test.ts`). A lesson cannot merge without passing keys. A checker suite covers tolerance, sig figs, unit equivalence, vector input and cross-product sign. |
| Lesson writing is slower than planned; N or R not ready before the final | Medium | High | Release order is Lab+C, then N, then R, with dated targets (see Rollout). Two weeks before the final, whatever exists ships, and the gaps are listed in the app. |
| Progress lost (cleared site data, private mode, Safari eviction) | Medium | Medium | Export/import, weekly nudge, and a corrupt-data backup key. |
| Sims conserve quantities but contradict lesson text | Low | Medium | Predict steps reference sim invariants, and a content review checks each predict step's reveal against a headless sim run. |
| Gamification crowds out understanding | Medium | Medium | No hearts. XP is weighted toward completed problems and self-explanation. Content correctness is the merge gate. |
| Copyright drift (paraphrasing Moore's problems) | Low | Medium | Originality rule written into the README and the contributing notes. Reviewers check new problems against it. |
| Unit N and R chapter lists unverified (prior: N1–N13, R1–R10) | Medium | Medium | Confirm with the group before starting each unit's content (open question). |

## Rollout

Targets assume the final is in mid-December, as confirmed by the user, about 9–10 weeks from 2026-10-08. The dates are proposed, not committed.

1. **v1.0, target 2026-10-31.** Scaffold, the physics core with conservation tests, the checker, progress storage with export/import, the Skills Lab, Unit C (C1–C14), and three sims (collisions, center of mass, energy bars).

   Build order follows what can be verified:
   1. physics core and its tests;
   2. checker and its tests;
   3. progress schema and its tests;
   4. Skills Lab content with keys;
   5. Unit C content with keys;
   6. sims and UI polish.
2. **v1.1, target 2026-11-21.** Unit N (Newtonian mechanics), with its sims chosen in a follow-up plan (likely force diagrams or projectile, and orbits). It also adds the deferred skater (angular momentum) sim if time allows.
3. **v1.2, target 2026-12-05.** Unit R (relativity), with spacetime-diagram and time-dilation demos, leaving about a week of review before the final.
4. **Deploy.** Each release is a static build pushed to GitHub Pages. Rollback means redeploying the previous build. Progress survives a rollback because the schema is versioned and migrations only move forward. A rollback across a schema version shows the corrupt-data notice and keeps the backup key.

Acceptance criteria for v1.0, from the council conditions:

1. Headless tests show collision momentum error < 0.1% over 10,000 steps and elastic KE error < 0.5%, with cases for equal masses, heavy–light, e = 0 and e = 1. The energy-bars sim keeps total energy within 0.5% over 10,000 steps at dt = 1/240 s.
2. Every numeric or vector answer key has a second-derivation test. The checker test suite covers tolerance, sig-fig feedback, N·s = kg·m/s, vector input in both syntaxes, and cross-product sign.
3. The progress schema is versioned. Tests cover a v0-to-v1 migration, a corrupt-payload fallback, and an export/import round trip with checksum rejection. The weekly export banner appears after 7 days.
4. A wrong answer gives a retry with a hint, and the worked solution appears after two misses. No lockout path exists.
5. Each sim has a numeric readout, a text description and keyboard controls, and works at 360 px width.
6. The README states that all problems and figures are original.
7. The release order and dates are recorded. If v1.0 slips past 2026-11-07, N and R are re-planned before any further content work.

## Open questions

1. **Unit N and Unit R chapter lists.** Do N1–N13 and R1–R10 (from memory) match the group's edition? Decided by: the user, before each unit's content work.
2. **Exact final exam date.** Mid-December is confirmed; the exact day sets v1.2's deadline. Decided by: the user.
3. **Hosting.** GitHub Pages under the user's account, or another static host? Decided by: the user, before the v1.0 deploy.
4. **Unit N and R sims.** Which demos land in v1.1 and v1.2? Decided by: the follow-up P10 plans for those releases.
5. **Content authoring.** Will group members write or review lessons, or only the user and Claude? This affects the review process for the answer-key gate. Decided by: the user.
