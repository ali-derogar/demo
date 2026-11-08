# Regression checks

Run `npm test` for the navigation, audio, gallery interactions, resource queue and adaptive-quality checks.

Project activation has two steps: a normal first click/tap or Enter opens `#work/<id>` and a 1.5-second presentation; the image and entry button then follow native demo links in a new tab. Modified gallery links retain native behavior. The source gallery filter, target, camera position, scroll and focus are restored on close. Escape, the close button and browser Back close the presentation; wheel/touch do not dismiss it or scroll the gallery. Info panels can open above a presentation without releasing its shared scroll lock.

The gallery retains radius 7.6 and its curved panes. The selected pane waits for neighbors to fade over 300ms before flattening and enlarging into the project image. The glass cavity and media-colored particles share Stage's renderer, texture cache and fluid field. Native pointer/hand/grab cursors replace the decorative ring. Project images have bounded 12px fluid displacement and 2px color separation; text and controls stay in HTML. Particle budgets start at 24,576 desktop / 6,144 mobile and reduce with quality. Native posters cover slow textures, reduced motion and missing WebGL and only disappear after a complete, visible card frame. The first three previews retain at most two concurrent requests and one retry.

`gallery.test.mjs` checks the actual curved geometry at widths 390, 768 and 1440, including selection transforms and a conservative envelope for every possible vertex-shader bend. It also checks all nine card centers using the real raycaster, the selected card's projected bounds, transparent draw order and slow texture completion. Navigation tests cover the 0.8-height entry hold, 0.62-height project steps, 0.3-height exit hold and stable sticky-height measurement during changes to the mobile visual viewport. These checks run without GPU drawing.

`presentation.test.mjs` checks the actual mesh transforms and projected bounds for all nine projects at 390×844, 768×1024 and 1440×900, the transition clock/reversal, neighbor fade, shared textures, first visible frame, quality budgets and disposal. Navigation tests cover all project deep links, invalid IDs, refresh to home, browser history, single-project filtering, nested panels, native second activation, fallback and focus. Stage's renderer-stub test also preserves an in-progress project through context restoration.

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
