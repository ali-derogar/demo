# Regression checks

Run `npm test` for the navigation, audio, gallery interactions, resource queue and adaptive-quality checks.

Project activation has two steps: a normal first click/tap or Enter opens `#work/<id>` and a 1.5-second presentation; the image and entry button then follow native demo links in a new tab. Modified gallery links retain native behavior. The source gallery filter, target, camera position, scroll and focus are restored on close. Escape, the close button and browser Back close the presentation; wheel/touch do not dismiss it or scroll the gallery. Info panels can open above a presentation without releasing its shared scroll lock.

The gallery retains radius 7.6 and its curved panes. The selected pane waits for neighbors to fade over 300ms before enlarging, retains slight curvature and a lit 3D rim, and continues floating after entry. Desktop pointer movement tilts the actual mesh; touch remains independent of hover. The original sculpture and particle simulation stay active behind it. The glass glaze adds at most 38% opacity rather than painting a separate opaque background.

Presentation surface availability (`pending`, `webgl`, `fallback`, `reduced`) is independent of texture readiness. A slow image cannot cover the shared scene with a solid HTML background, and dimming an already rendered card for an info panel cannot bring back its native poster. Posters still cover slow textures and missing WebGL and use the actual projected card bounds. Native pointer/hand/grab cursors, 12px fluid displacement and 2px color separation are retained; text and controls stay in HTML. Project particle budgets start at 24,576 desktop / 6,144 mobile and reduce with quality. The first three previews retain at most two concurrent requests and one retry.

`gallery.test.mjs` checks the actual curved geometry at widths 390, 768 and 1440, including selection transforms and a conservative envelope for every possible vertex-shader bend. It also checks all nine card centers using the real raycaster, the selected card's projected bounds, transparent draw order and slow texture completion. Navigation tests cover the 0.8-height entry hold, 0.62-height project steps, 0.3-height exit hold and stable sticky-height measurement during changes to the mobile visual viewport. These checks run without GPU drawing.

`presentation.test.mjs` checks the actual mesh transforms and projected bounds for all nine projects at 390×844, 768×1024 and 1440×900, ongoing motion after entry, mouse response, touch behavior, the transition clock/reversal, neighbor fade, shared textures, first visible frame, quality budgets and disposal. A DOM/CSS check prevents an opaque project page while textures load. Navigation tests cover all project deep links, invalid IDs, refresh to home, browser history, single-project filtering, nested panels, native second activation, fallback and focus. Stage's renderer-stub test preserves an in-progress project through context restoration and checks that the original sculpture and particles remain visible.

Separate EGL/GLES3 diagnostics during this change compiled and linked all nine shader programs on an NVIDIA RTX 3050. GPU fluid passes checked finite/bounded velocity and dye, and measured approximately 1.8% wake retention after one second. These diagnostics and isolated GPU render inspections are not browser screenshots or FPS measurements and are not part of `npm test`.

Compare glass/refraction, title readability and project transitions in a real browser before claiming visual parity. Reference footage was inspected from the credited developer's public project page: https://www.richardczhou.com/posts/atv6. Reference images and videos are not shipped in the app.

These use real React handlers in JSDOM with simulated layout and AudioContext. Stage's context recovery test uses real Three scene objects and a renderer stub to verify lifecycle, cleanup and position preservation. These checks do not establish browser rendering, audible playback, real GPU recovery or FPS. Real Chromium/Firefox and mobile browser checks are still required at widths 390, 768 and 1440, including pull-to-refresh, direct links, Back/Forward, bfcache, context loss/restoration and all nine demos.

## Existing independent site-check failures

`npm run check:site` currently reports five existing GitHub-reference errors in:

- `src/components/ContactSection.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/icons.tsx`
- `src/data/profile.ts`
- `src/immersive/ContactView.tsx`

The checker rules and existing contact information are preserved. These failures are separate from the new regression tests.
