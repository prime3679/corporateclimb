# Native splash source

`splash.png` is the Capacitor splash for the iOS shell: 2732×2732, frame black
(`#06080c`, the one boot color), the boot ladder and the tracked wordmark from
`index.html`'s `.boot-splash` at native density. It is generated, and it is the
committed source of truth — do not hand-edit it.

```
node scripts/gen-splash.mjs                       # rewrite resources/splash.png
node scripts/gen-splash.mjs --preview artifacts/splash   # + device-cropped previews (not committed)
```

The render uses Playwright's Chromium (`npx playwright install chromium`), the
same browser CI already installs for the smoke suite. If the boot ladder,
wordmark, or color in `index.html` changes, regenerate; the two must stay
identical or the native → web handoff shows a seam.

## Where it goes (Mac, after `npx cap add ios`)

Capacitor's iOS template shows one square through a `scaleAspectFill` image
view in `LaunchScreen.storyboard`, and the SplashScreen plugin reuses that same
storyboard during WebView start. The template's asset catalog expects three
copies of the same 2732 square:

```
cp resources/splash.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png     # 3x
cp resources/splash.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png   # 2x
cp resources/splash.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png   # 1x
```

`Contents.json` in that imageset already names those files; nothing else to
edit. `npx cap sync` does not touch the asset catalog, so the copy survives it.

Alternatively `npx @capacitor/assets generate --ios --assetPath resources`
reads this folder by name (custom mode: `splash.png` ≥ 2732²; drop an
`icon-only.png` ≥ 1024² beside it when the app icon is ready and the same run
fills `AppIcon.appiconset`). Either path lands the same pixels.

Also set the storyboard's root view `backgroundColor` to `#06080c` in Xcode:
aspect-fill covers it in practice, but the template ships `systemBackground`
(white), and a white edge under any future letterbox would be the exact flash
this asset exists to prevent.

## Why one square

The storyboard crops the square to the screen. The widest crop any portrait
iPhone makes is ~1260 canvas px (16 Pro Max); the ladder + wordmark sit well
inside that band, and the ladder lands at the HTML boot splash's size on
2556-tall @3x phones (±10 % on the rest). `docs/ios-capacitor-plan.md` §2.7
has the full chain and the Simulator checklist.
