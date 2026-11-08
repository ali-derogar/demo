# Regression checks

Run `npm test` for navigation, scroll presentation, audio, geometry, bounded image loading and adaptive quality. Run `npm run build` for TypeScript, the production bundle and all nine static demo checks.

The gallery uses one native scroll coordinate. Every project opens over 0.3 stable viewport heights, holds for 0.2, returns over 0.3 and travels to its neighbor over 0.4. Reversing scroll retraces the same mesh transform; elapsed time cannot advance a presentation. Horizontal wheel and axis-locked drag gestures update the same coordinate without release snapping. Reduced motion retains the same navigation coordinates with immediate presentation changes.

Scrolling never adds history entries or steals focus. Click/Enter adds a project route and moves to its open point; Back/close restores the originating filter, position and focus. Direct project routes close to their corresponding collapsed cards. Info panels alone own the shared scroll lock. Tests cover partially open projects under panels, deep links, reload, Back/Forward, bfcache, single-project filters, toolbar changes and orientation.

The original GPU panes, gallery posters and project posters share projected bounds and a 3:2 image ratio. A poster retires immediately after its texture has been drawn, including during gallery entry, rather than overlapping the GPU card through a CSS fade. Materials are prepared before first scroll; browser toolbar changes do not reallocate the drawing buffer. Context recovery preserves the current project and progress. Geometry tests cover all nine projects at 390×844, 768×1024 and 1440×900, visibility, picking, depth order, screen framing, stopping and smooth reversal.

The nine authored covers use the real demos' copy, typography, palettes and credited imagery. Rebuild with `npm run generate:previews` (SVG rasterization uses a locally installed Vazirmatn or Arabic-capable fallback font). `public/images/previews/ATTRIBUTION.json` records their derivative sources; image synchronization preserves those records. Covers are designed compositions, not browser screenshots.

These tests use JSDOM, real React handlers/Three geometry, and a renderer stub. They do not measure browser paint, black frames, actual GPU performance or mobile FPS. Chrome Android and Safari iPhone checks, including refresh/first scroll, browser chrome, rotation, fast direction changes and all nine projects, remain required for device-level visual verification.

`npm run check:site` has five pre-existing GitHub-reference errors in ContactSection, SiteHeader, icons, profile and ContactView. The checker and existing contact information are preserved.

The first HTML paint includes the branded orbital loader, before the application bundle arrives. React reuses the same artwork. Loader tests cover actual scene readiness, the initial animation, font readiness/fallback, reduced motion, long-load entry, StrictMode, unmount cleanup and scroll ownership. Scene recovery must not replay the initial loader. No percentage or elapsed timer stands in for scene readiness.
