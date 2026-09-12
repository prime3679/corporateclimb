# First-session playtest script (phone, 15 minutes, unassisted)

Five people, five phones, before 2026-09-25. Candidates: Nicole, John,
Damion, two BPM mentees. Not you, not an agent, nobody who has seen the
game. One session per person; you watch, you do not help.

## Setup (2 min)

- Their phone, their browser, over cellular if possible. Send the link:
  https://corpclimber.com — do not open it for them.
- Say only this: "It's a game I made. Play it like you found it on your
  own. Think out loud if you want. I'm not going to answer questions until
  the end."
- Start a timer when the page loads.

## What you record (use `sessions.md`, one block per person)

Write the timestamp and what happened for each of these. A blank line
under a heading is a finding too.

1. First tap. What did they tap first on the title? Did they read the
   tagline? (Hero CTA is THE OFFICE.)
2. Class pick. Did they hesitate? Did they read the moves or just pick?
3. First minute on the floor. Did they find the printer? Did they know
   where to go? Did they try to tap-to-move, swipe, or hunt for a D-pad?
4. First fight (Gavin, desk pit). Did they understand the stakes screen?
   Did they read the type hint? Did they pick moves by name or by colour?
5. First win. Did they understand the offer letter / recruit card? Did
   they hire Gavin?
6. Holloway. Did they switch teammates? Did they lose? What did they do
   after losing — retry, quit, look at you?
7. Floor 1 clear. Did they understand the badge → elevator link? Did they
   press CONTINUE or stop?
8. Any moment they said "wait", "huh", "what", or went silent for >10s.
9. Any moment they looked at you. (That's a UX failure, not a social cue.)
10. Stop at 15 minutes or Floor 2 arrival, whichever first.

## Debrief (3 questions, verbatim answers)

- "What is this game about, in one sentence?"
- "What was the most confusing moment?"
- "Would you play Floor 2 on your own? Why / why not?"

## After five sessions

Sort every #8 and #9 by how many people hit it. The top three become the
next PRs, with the session line linked in the PR body (see
`docs/LAUNCH.md` → the rule). Everything else waits for PostHog.
