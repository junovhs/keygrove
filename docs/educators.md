# KeyJam for educators — concept

Status: concept, 2026-09-22. Nothing here is built unless marked **(exists)**. This is a plan, written to be argued with.
Related: DEC-21 (class accounts), the Classes plan (ACCT-06…09), DOCS-08 (teacher's companion PDF).

---

## 1. The one-sentence pitch

> **KeyJam is a complete, ready-to-teach touch-typing course that builds real technique — not just speed — and tells you exactly which student needs help with which keys, without asking your students for an email.**

Everything below exists to make that sentence true.

## 2. Why teachers would switch

Schools already have typing tools, mostly free: typing.com, TypingClub, Nitro Type and a long tail of others. They win on "free and good enough". To move a teacher, KeyJam has to be clearly better at the things a teacher actually struggles with, not just prettier.

What teachers struggle with in a typing unit:

1. **Planning.** "What do I do on day 1, week 3, week 9?" Most tools are a pile of lessons, not a course.
2. **Seeing who is really stuck.** A class average hides the four kids hunting with two fingers.
3. **Bad habits that look like progress.** A student can reach 40 WPM by looking at the keys with two fingers. Speed-first tools reward that.
4. **Grading.** Turning activity into a grade they can defend, quickly, in the gradebook they already use.
5. **Engagement without chaos.** Games keep kids busy, but races and leaderboards shame the slow ones and teach rushing.
6. **Privacy paperwork.** Every new tool that collects student data means forms, district approval and parent questions.

What KeyJam already has, or has planned, that answers each:

| Teacher problem | KeyJam answer |
|---|---|
| Planning | A finished sequenced course: 7 chapters, 36 lessons, 40 woven finger stops, checkpoints **(exists)**. Plus a term plan and assignment sheets (DOCS-08). |
| Who is stuck | Per-key mastery, confusion pairs, transition timing and error classes are already modelled per learner **(exists)**. The teacher dashboard turns them into plain sentences. |
| Bad habits | Accuracy gates, relaxed pace by design, a pace note when a learner rushes **(exists)**, and finger stops that drill each finger pair **(exists)**. |
| Grading | Grading evidence built around completion and accuracy, exported to CSV or the gradebook (section 6). |
| Engagement | Pixel-art charms that fly across the screen when earned **(exists)**. Personal and collectable, never competitive. |
| Privacy | Students join with a first name and a PIN at the teacher's link. No student email, ever (DEC-21). |

**The positioning line:** *"Other tools measure how fast kids type. KeyJam teaches them how to type — and shows you who isn't there yet."*

## 3. Who we serve

- **Primary: the individual classroom teacher** (grades 3–8 computer, library or homeroom; also high school keyboarding and adult education). They adopt tools themselves, often without asking anyone. Win them and the rest follows.
- **Secondary: the school or district** (IT and curriculum leads), who later want many teachers on one plan, SSO, rostering and a data-processing agreement.
- **Also:** homeschool parents and tutors. They're a class of 1–5 with the same needs, so they get the same tool with different words.

Design for the teacher first. Every feature has to pass this test: *could a busy teacher use it in the five minutes before class?*

## 4. Free or paid — my recommendation

**Keep everything a single teacher needs to run a class free, forever. Charge schools and districts, not teachers.**

Why:

- Teachers adopt from the bottom up, and the incumbents are free. A paywall at the teacher level stops adoption before it starts, and a teacher paying out of pocket resents it.
- Schools do pay, but for different things: many teachers on one plan, SSO, roster sync, contracts, admin reports and support. Those cost us real money and effort, and they are what schools budget for.
- The free tier is the marketing. Every free class is 25 kids and a teacher telling other teachers.
- **No ads, ever.** Ads on a children's product are a trust and privacy problem, and they would undercut the whole "calm, no-pressure" feel.

### Free: KeyJam Classroom (every teacher, forever)

- Unlimited classes and students, join links and QR codes, name+PIN student sign-in.
- The whole course, every finger stop, every charm.
- **The class dashboard:** roster, current chapter and lesson, checkpoints and stops passed, charms, and "stuck" flags.
- **Per-student insight cards** (section 5): the three keys or movements each student most needs.
- **Grading evidence** with CSV export.
- **Check-ins** (section 7): generated personal tests, a few per term.
- The teacher's companion PDF and assignment sheets.

This is deliberately generous. The free tier has to be clearly better than the free competition, or nothing else works.

### Paid: KeyJam for Schools (per school or district, annual)

- **Many teachers under one school.** Admins see all classes, move students between classes, and keep continuity from year to year.
- **SSO and rostering:** Google Classroom, Clever, ClassLink and Microsoft. Students tap "Sign in with Google" or join from their class list, with no PINs to manage.
- **Gradebook sync** (grade passback to Google Classroom, Canvas and Schoology) instead of CSV.
- **Unlimited check-ins,** a scheduled check-in calendar, and a printable version.
- **Longitudinal reports:** growth across terms and years, school-level trends, and exports for reporting.
- **A data-processing agreement,** a signed student-privacy pledge, data retention controls and priority support.

Pricing shape: a flat price per school per year, low enough for a principal to approve without a committee (a few hundred dollars), with district deals by quote. Hold the exact numbers until we've talked to about 20 teachers and 5 IT leads.

### What I would *not* do

- **No individual "Teacher Pro" subscription** at launch. It splits the teacher base, and the school plan is the better business.
- **No paywall on any learning content.** Every student gets the whole course, whoever pays.
- **No selling or sharing data.** That should be a public, one-page promise.

## 5. The teacher dashboard (free)

A single screen per class, in the same contained, no-scroll style as the course view.

**Top strip:** class progress at a glance. Chapter distribution (how many students are in each chapter), charms earned this week, students active this week.

**Roster grid:** one row per student, showing:
- where they are: chapter, lesson and next stop;
- a progress bar through the course;
- charms earned, as little pixel icons;
- **flags** in plain words, never scores:
  - *Stuck:* failed the same stop or checkpoint 3+ times.
  - *Rushing:* the pace note keeps firing. They type fast with low accuracy, which is typical of looking at the keys.
  - *Idle:* not active for 7+ days while the class is moving.
  - *Ready to push:* consistently clean and ahead.

**Student card** (click a row):
- **"Needs work on"**: the three weakest movements, in teacher language. For example: "E and I get swapped (middle fingers)", "slow from S to W (ring finger reaching up)", "misses the right Shift". These come from the key mastery, confusion matrix, transition timing and error classes the app already keeps.
- The last 5 sessions: date, what they did, accuracy.
- A growth sparkline of accuracy on assessed exercises.
- Buttons: generate a check-in, reset PIN, rename, move class.

**Class insights** (the part teachers would love):
- "Most of the class is mixing up **E and I**. Try the 5-minute warm-up for middle fingers." One click assigns a short focused exercise to everyone.
- "The pinky stops are where students stall. Budget extra time for chapter 4."
- Heat map: a keyboard coloured by class-wide error rate.

**Rules for what the dashboard shows** (how it fits DEC-11, DEC-14 and DEC-15):
- **Teacher-facing only.** Students never see a class ranking or anyone else's numbers.
- **Accuracy and progress lead; speed is secondary.** WPM appears on the student card as information, never as a grade driver or a sort key by default.
- **Never claims to know which finger was used** (DEC-15). "Rushing" is worded as a *likely* habit worth watching, not a verdict.
- **Guided exercises never count as performance** (DEC-11).

## 6. Grading — support it, but steer it

Teachers must grade. The risk is that the easiest grade to compute (WPM) teaches the wrong thing. So KeyJam should make the *good* grade the easiest one to give.

**Default grading evidence per student (CSV / gradebook):**

| Column | Meaning |
|---|---|
| Course progress | % of lessons and stops completed, and the current chapter |
| Checkpoints passed | Each chapter checkpoint at its 97% accuracy bar |
| Accuracy (assessed) | Median accuracy on assessed exercises this grading period |
| Consistency | Sessions in the period (effort, not talent) |
| Growth | Check-in change from the first to the latest |
| Speed (info) | Median WPM, labelled "for information" |

**Built-in grading presets** a teacher picks in one click:
- **Completion:** "Reach Chapter N by date X." Good for younger grades.
- **Mastery:** checkpoints passed plus accuracy. Good for keyboarding classes.
- **Growth:** improvement between check-ins. Fair to beginners and to students who started ahead.

Each preset produces a suggested mark with a one-line reason per student, and the teacher can override it. We give grading *evidence and a suggestion*; the teacher gives the grade.

**Not included:** WPM-only grading, class rankings, or percentile scores against other students. Teachers can compute those from the CSV if they insist, but the product won't encourage it.

## 7. Check-ins — personal tests built from each student's weaknesses

This is the standout feature, and it's where KeyJam can do something the competition can't.

**What it is:** a 3–5 minute assessment generated *for one student*, from that student's own model.
- **About 60% of it targets their weakest keys, confusion pairs and slow transitions.** Built from the key mastery, confusion matrix, transition model and error classes the app already maintains.
- **About 30% is review of things they've mastered,** so it measures retention and isn't just a wall of their worst keys.
- **About 10% is transfer:** an ordinary sentence using only keys they've been taught.
- Only keys the student has been taught appear. The same text generators the course uses guarantee that.

**Why "check-in", not "test":**
- The student sees a calm screen: *"A quick check-in: how are your hands doing?"* No timer and no score shown to the student by default. The teacher decides whether students see results.
- Afterwards the student sees a small, kind summary ("E and I are getting steadier"), and the teacher sees the detail.

**How teachers use it:**
- **Baseline** in week 1, **mid-term**, and **end of term**. Growth becomes gradeable and meaningful.
- **Targeted:** "generate a check-in" on any student card.
- **Class-wide:** everyone gets a *different* check-in built from their own gaps, at the same moment. It's fair, it can't be copied from a neighbour, and it tells the teacher where each student is.
- **Printable version** (Schools): the same generated text as a sheet, for teachers who want a paper record.

**How it feeds back:** a check-in's results update the student's model like any assessed run. Weak movements from check-ins then show up more in their regular practice, invisibly (DEC-14: adaptation stays invisible).

## 8. Engagement without pressure

- **Charms** are the engagement engine **(exists)**: 20 pixel-art charms that fly across the screen when earned. Kids show each other. This has to stay personal and collectable, never a leaderboard.
- **Class goals** instead of races: "When the class passes 100 finger stops, the whole class unlocks a class charm that flies across everyone's screen." Everyone contributes; nobody is last.
- **Teacher shout-outs:** a teacher can send a charm-style celebration to a student ("Great work on the gauntlet!").
- **Not included:** leaderboards, speed races, streak-shaming, or anything that makes the slowest kid in the room feel it.

## 9. Setup in under five minutes

1. The teacher signs up with email (an unticked opt-in for news, DEC-21).
2. They create a class, "Period 3", and get `keyjam.app/mr-douglas/period-3` plus a QR code.
3. They project the QR code, and students type a first name and pick a PIN.
4. The teacher gets the companion PDF: a term plan, a sheet per chapter, and a roster.
5. Day 1: "Press Continue." The course does the rest.

Returning students choose their name and enter their PIN on any device. A forgotten PIN is a teacher reset, never an email flow.

## 10. Privacy and trust (the part that wins districts)

- **Students give no email and no birthdate:** only a first name or nickname and a PIN (DEC-21).
- **Data kept:** typing progress and the learning model. No keystroke text beyond what's needed to compute results, and no free-typed personal writing stored.
- **Teachers see only their own students.** Admins see only their school's.
- **No ads, no data sales, no third-party trackers** on student pages.
- **Retention controls:** a teacher or admin can delete a class and all its data. There's an automatic purge option at year end.
- **Paperwork ready:** a public privacy page written for parents; a student-data pledge; a DPA template for schools; published answers for COPPA, FERPA and GDPR. Get these reviewed properly before launch. This document is not legal advice.

## 11. The pitch materials

- **Landing page for educators** (`keyjam.app/teachers`): the one-sentence pitch, a 60-second video of a class joining by QR code and a charm flying, the dashboard with a "needs work on" card, the privacy promise, "Free for every teacher".
- **A sample class:** a demo dashboard with 25 fake students, so a teacher can explore before signing up.
- **The companion PDF** as a free download, even without an account. It's a great lead magnet on its own.
- **One-pager for principals and IT:** the privacy summary, SSO and roster support, the price per school.
- **Where teachers already are:** teacher communities and newsletters, ed-tech directories, and conference demos. And the best channel: a charm flying across a projector in front of 25 kids.

## 12. Build order (maps to the Classes plan)

1. **Accounts and joining:** ACCT-06/07/08. Teacher sign-up, class links, name+PIN students.
2. **Dashboard v1:** ACCT-09. Roster, progress, flags, CSV.
3. **Teacher's companion PDF:** DOCS-08.
4. **Student cards and class insights:** "needs work on" in plain language, and the class heat map.
5. **Check-ins:** the generator, the calm student screen, teacher results, and baseline/mid/end scheduling.
6. **Grading presets:** completion, mastery and growth, with suggested marks.
7. **Class goals and teacher shout-outs.**
8. **Schools tier:** multi-teacher admin, SSO and rostering, gradebook passback, longitudinal reports, DPA.

Steps 1–7 are free for teachers; step 8 is paid. Ship 1–3 as soon as the course content settles, then learn from real classes before building 4–7.

## 13. Risks and open questions

- **Is the course finished enough to teach?** Classrooms magnify rough edges: the finger-stop trap fixed in FIX-03 would have hit a whole class at once. A pilot with 1–2 friendly teachers comes before any launch.
- **Shared computers and PIN sharing.** Name+PIN is simple but weak. For younger grades, add picture passwords; SSO in the Schools tier is the real answer.
- **Pace for young kids.** Chapter lengths and the 97% checkpoint bar may be too steep for grade 3. We may need a gentler class-level setting, still accuracy-first.
- **Keyboard variety.** Chromebooks, iPads with keyboards, and non-US layouts. The method framework supports new official layouts (DEC-17), but each one needs testing.
- **Support load.** Free teachers still email us. A good help page and the companion PDF keep that manageable.
- **Pricing:** validate "free for teachers, paid for schools" with about 20 teachers and 5 IT leads before building the Schools tier.

## 14. What success looks like

- A teacher gets a class running in under 5 minutes, without reading anything.
- By week 3, a teacher can name each student's weak keys from the dashboard, without watching them type.
- Students ask to keep going to get the next charm.
- The first school buys the Schools tier because their teachers were already using the free version.
