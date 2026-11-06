 # MIRA animation task

 ## Approved decisions
 - Immutable 20-page PDF, 1440 × 810 points, rendered at 2160 × 1215 pixels.
 - Managed React web presentation; no visual redesign, controls, templates, database, or API changes.
 - Slide 3: independent original-object scale pulses. Revision requested: faster, more exaggerated; 0.8–1.2 seconds per pulse, 140–155% peak, more frequent groups, no asset changes.
 - Slide 9: entirely static, explicitly approved to protect identity.
 - Slide 10: original center/right vases only, traced existing seams; left vase static (approved). Revision requested: greater dynamism; four-second cycles, 25–35-pixel excursion, 0.7–1.2° rotations, no new fragments.
 - Slide 12: image opacity only, original nine clipped grid cells. Revision requested: faster, more noticeable; 0.5–0.85 seconds per fade direction, more frequent groups, still reaching 30% opacity.
 - Slide 15: transitions using four original views only, no mirroring, synthesis, or pixel edits.
 - Arrows manual navigation, F fullscreen, animations mounted only on active page.

 ## Work
 - [x] Inspect PDF and resolve fidelity blockers.
 - [x] Initialize managed app.
 - [x] Render all original pages and extract transparent layers directly from PDF.
 - [x] Trace center/right vase seams, preserve every pixel in a disjoint partition.
 - [x] Implement presentation and motion schedules.
 - [x] Build and browser-test every slide, resting fidelity, loops, navigation, fullscreen.
 - [x] Deliver complete presentation (initial version).
 - [x] Verify the faster/stronger slide 3, 10, and 12 revisions: all 20 resting frames remain exact, loops and navigation pass, build/lint pass, production assets unchanged.
 - [ ] Deliver revised presentation.

 ## Verification results
 - All 20 canvas resting frames are pixel-identical to original PDF renders (zero changed pixels).
 - Motion verified on slides 3, 10, 12, 15; static regions have zero modified pixels.
 - Loop boundaries and repeated cycles tested; original imagery returns exactly.
 - Slide 9 confirmed unchanged, including after time elapses.
 - Live motion starts on entry and stops on exit; navigation is manual and bounded.
 - Fullscreen and 16:9 viewport fitting tested in Chrome; no visible controls or console errors.
 - A post-optimization fidelity hook restores original PNG bytes so production assets remain identical; all 65 PNGs checked.
 - Browser evidence: verification/results.json and verification/*.png/jpg (internal, not extra presentation elements).