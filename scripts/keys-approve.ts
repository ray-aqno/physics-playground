/**
 * Records that a person reviewed a lesson's answer keys: writes the lesson's current content hash
 * to src/content/review.json and appends a line to docs/key-review.md (SC3, SC15).
 * Usage: pnpm keys:approve <lesson-id> "<reviewer name>"
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ALL_LESSONS } from '../src/content/catalog';
import { lessonHash } from '../src/content/validate';

const [lessonId, reviewer] = process.argv.slice(2);
if (lessonId === undefined || reviewer === undefined || reviewer.trim() === '') {
  console.error('Usage: pnpm keys:approve <lesson-id> "<reviewer name>"');
  process.exit(1);
}
const lesson = ALL_LESSONS.find((l) => l.id === lessonId);
if (lesson === undefined) {
  console.error(`No lesson with id ${lessonId}`);
  process.exit(1);
}
const path = 'src/content/review.json';
const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
const review: Record<string, string> = {};
if (typeof parsed === 'object' && parsed !== null) {
  for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string') review[k] = v;
}
const hash = lessonHash(lesson);
review[lesson.id] = hash;
writeFileSync(path, `${JSON.stringify(review, null, 2)}\n`);
const log = 'docs/key-review.md';
if (!existsSync(log)) writeFileSync(log, '# Answer key reviews\n\n| Date | Lesson | Hash | Reviewer |\n|---|---|---|---|\n');
appendFileSync(log, `| ${new Date().toISOString().slice(0, 10)} | ${lesson.id} | ${hash} | ${reviewer.trim()} |\n`);
console.log(`Approved ${lesson.id} (${hash}) by ${reviewer.trim()}`);
