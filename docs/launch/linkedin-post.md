# Launch post — LinkedIn (draft v1, 2026-09-12)

Post after steps 1–3 in `docs/LAUNCH.md` are done and the five playtests
have shipped their fixes. Attach a 12-second phone screen recording of
Floor 1 (printer → Gavin fight → offer letter), not the demo mp4. Vertical.

Rules applied: no announcement voice, no adjectives doing the work, one
idea per paragraph, numbers only where they're real, ends with a question
people can answer without playing. Anything in ⟨check⟩ is a claim only you
can confirm; delete the line rather than round it.

---

I built a video game about surviving an office. You can play it on your
phone right now: corpclimber.com

It's called Corporate Climber. You're a new hire. Reception hands you a
broken printer. Five floors later you're in the boardroom, if the interim
team lead doesn't get you first. Fights are turn-based. Coworkers you
beat can join your team. A full run is about a lunch break.

Some numbers, because "built with AI" gets said a lot and rarely
measured:

- 6 months of nights and weekends ⟨check: your honest average session⟩
- 240 commits, 715 unit tests, 22 browser tests, a CI gate on every PR
- 3 named agent roles (design, engine, review) with a written contract
  for who owns what and who is allowed to merge
- ⟨check⟩ lines of the combat engine written by me
- ⟨check⟩ of the encounter dialogue written by me

What I actually did: set the bar, wrote the design freeze, played every
floor on a phone, and said no. The agents did the typing. The hardest
part wasn't the code. It was writing instructions precise enough that a
fresh agent with no chat history could pick up the repo and not break the
save format.

Things that went wrong, briefly: I let a polish loop run for two weeks
with zero players. Five CSS passes in one day. Nobody had told the agents
to stop, so they didn't. The fix was a rule in the repo, not a better
model: no visual PR without a player signal behind it.

The game is free and open source. If you've ever had a manager who was
"interim" for four years, Floor 1 is for you.

What's the one coworker archetype I forgot?

---

## Alternate hook (if the numbers version feels like a humblebrag)

Every job I've had is in this game. The credit thief. The 8am that
wasn't necessary. The reorg that shuffled the floor while I was on it.
I made it into a five-floor RPG you can finish on your phone: corpclimber.com

## Follow-up thread (one week later, if there's data)

"1,000 people started. X reached the first fight. Y cleared Floor 1.
Here's where they stopped, and what I changed." — pull the funnel from
PostHog; this is the post the first one earns.
