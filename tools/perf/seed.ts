/**
 * The save the perf harness starts from: every main lesson before the Flow checkpoint cleared and every finger stop
 * passed, so Continue opens the checkpoint's long mixed passage with no stop or briefing in the way.
 * Run with vite-node (it imports the real curriculum); prints the save as JSON.
 */
import { MAIN_TRAILS } from '../../src/curriculum';
import { FINGER_PAIRS, FINGER_LEVEL_COUNT, fingerCourseId } from '../../src/curriculum/finger-course';
import { lessonExercises } from '../../src/curriculum/lesson-flow';
import { fresh, freshProgress } from '../../src/state/save';

const s = fresh();
const last = MAIN_TRAILS.at(-1)!;
for (const t of MAIN_TRAILS) if (t !== last) { s.trails[t.id] = { ...freshProgress(), runs: 1, cleared: true, stars: 3 }; s.lessonSteps[t.id] = lessonExercises(t).length; }
for (const pair of FINGER_PAIRS) for (const id of pair.sides) s.fingerCourses[fingerCourseId(id)] = FINGER_LEVEL_COUNT;
s.trail = last.id;
s.settings.onboarded = true;
console.log(JSON.stringify(s));
