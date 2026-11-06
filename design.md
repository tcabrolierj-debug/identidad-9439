# MIRA — Immutable presentation

## Visual source
The supplied IDENTIDAD PDF is the only design reference. All 20 pages retain their exact composition, typography, colors, photographs, framing, and aspect ratio. No new visual elements or UI.

## Rendering
Original page dimensions: 1440 × 810 points (16:9). Lossless page renders at 2160 × 1215 pixels. A canvas occupies the largest 16:9 rectangle inside the viewport, with black letterboxing outside the slide only. Resting frames use the original page render directly. Body font is Arial solely as a non-visible fallback; no slide text is re-typeset.

## Motion
Only original image layers can move. Slide 3 revised at the user's request: stronger 140–155% scale pulses lasting 0.8–1.2 seconds, more frequent irregular groups, centered and smooth. Slide 9 remains untouched. Slide 10 revised for greater dynamism: center/right vases alternate four-second reconstruction cycles; fragment excursion 25–35 render pixels and 0.7–1.2° gentle rotation along existing seams; left remains untouched. Slide 12 revised for greater dynamism: original clipped grid images fade toward 30%, with 0.5–0.85 seconds each direction and more frequent irregular groups. Slide 15 transitions between four original views, feet aligned, no mirroring or generated views. Exact originals periodically return.

## Interaction and architecture
Web only. One React presentation component; canvas animation via requestAnimationFrame. Arrow keys advance manually; Home/End optional navigation; F toggles fullscreen; Escape exits browser fullscreen. No buttons, badges, progress bars, or decorations. Active-slide animation cancels when leaving; hidden tabs pause. No new API routes or tables. All page renders and original layers remain local static assets in public/slides.
