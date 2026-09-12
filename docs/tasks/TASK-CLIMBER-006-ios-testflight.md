# TASK-CLIMBER-006 — iOS TestFlight

Owner role: Astra, on the Mac Mini (Tailscale host `mac-mini`). Blocks on
Xcode installed and signed into the owner's Apple developer account.

## Context

`docs/ios-capacitor-plan.md` calls the iOS tree "Mac-blocked". A Mac is
available; the blocker is gone. `src/platform/*` already branches on
`isNative()`; `capacitor.config.ts` has appId `com.corporateclimb.app`
and appName `Corporate Climber`.

## Do

1. `npx cap add ios`, `npx cap sync`. Commit `ios/` per the plan's
   checked-in-files list (not Pods).
2. Follow the plan's phases in order; stop at the first STOP condition
   and report — do not work around signing or entitlement errors.
3. Analytics stays off in the native shell (`analyticsEnabled()` returns
   false when `isNative()`) until the App Store privacy nutrition label
   is written. Add that label text to `docs/PLATFORM.md`.
4. Ship one TestFlight build to the owner's phone. Attach the build number.

## Verify

`npm test -- boot-splash platform-native`; the plan's device checklist on
one real iPhone.
