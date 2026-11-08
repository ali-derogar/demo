# Regression checks

Run `npm test` for the navigation, audio, gallery interactions, resource queue and adaptive-quality checks.

Project activation has two steps: a normal first click/tap or Enter selects and focuses the project; the next activation follows its native demo link. Modified links keep their native browser behavior. Tests cover all nine demo links, poster fallback, reduced motion, Escape, scrolling, camera/card interpolation and ray picking after selection. In the browser, also verify the zoom, light sweep, surrounding-card fade and caption reveal, then open the demo with the second click.

The gallery uses a radius of 7.6 with curved panes, screen-space glass and Persian text textures. Selection stays inside the shared Three scene; there is no flat project preview overlay. Native posters remain available for slow textures, reduced motion and missing WebGL, and only disappear after a complete, visible card frame. The first three previews are prioritized with at most two concurrent requests.

`gallery.test.mjs` checks the actual curved geometry at widths 390, 768 and 1440, including selection transforms and a conservative envelope for every possible vertex-shader bend. It also checks all nine card centers using the real raycaster, the selected card's projected bounds, transparent draw order and slow texture completion. Navigation tests cover the 0.8-height entry hold, 0.62-height project steps, 0.3-height exit hold and stable sticky-height measurement during changes to the mobile visual viewport. These checks run without GPU drawing.

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
