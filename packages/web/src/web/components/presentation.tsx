import { useEffect, useRef, useState } from 'react';
import { presentationData as data } from '../lib/presentation-data';
import { ceramicState, characterState, fragmentMovement, pulseValues, type Layer } from '../lib/presentation-motion';

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadedImages = new Map<string, HTMLImageElement>();

function loadImage(src: string) {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => { loadedImages.set(src, image); resolve(image); };
    image.onerror = () => reject(new Error(`Unable to load original slide asset: ${src}`));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function assetsForSlide(slide: number): string[] {
  const base = data.pages[slide - 1];
  if (slide === 3) return [base, data.collageBase, ...data.objects.map(a => a.src)];
  if (slide === 10) return [base, data.ceramicBase, ...data.vases.flatMap(v => [v.whole.src, ...v.pieces.map(p => p.src)])];
  if (slide === 15) return [base, data.characterBase, ...data.views.map(a => a.src)];
  return [base];
}

function drawAsset(ctx: CanvasRenderingContext2D, src: string, x = 0, y = 0) {
  const image = loadedImages.get(src);
  if (image) ctx.drawImage(image, x, y);
}

function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  drawAsset(ctx, layer.src, layer.x, layer.y);
}

function paintSlide(ctx: CanvasRenderingContext2D, slide: number, time: number) {
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (slide === 3) {
    const values = pulseValues(time, 'objects');
    if (!values.some(v => v > 0)) { drawAsset(ctx, data.pages[2]); return; }
    drawAsset(ctx, data.collageBase);
    data.objects.forEach((layer, i) => {
      const scale = 1 + values[i];
      ctx.save();
      ctx.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
      ctx.scale(scale, scale);
      drawAsset(ctx, layer.src, -layer.w / 2, -layer.h / 2);
      ctx.restore();
    });
    return;
  }

  if (slide === 10) {
    const state = ceramicState(time);
    if (state.amount === 0) { drawAsset(ctx, data.pages[9]); return; }
    drawAsset(ctx, data.ceramicBase);
    // Retain the PDF's original stacking order (right behind center).
    data.vases.forEach((vase, i) => {
      if (i !== state.active) { drawLayer(ctx, vase.whole); return; }
      vase.pieces.forEach((piece, j) => {
        const motion = fragmentMovement(piece, vase.whole, j, state.amount);
        ctx.save();
        ctx.translate(piece.x + piece.w / 2 + motion.dx, piece.y + piece.h / 2 + motion.dy);
        ctx.rotate(motion.angle);
        drawAsset(ctx, piece.src, -piece.w / 2, -piece.h / 2);
        ctx.restore();
      });
    });
    return;
  }

  if (slide === 12) {
    drawAsset(ctx, data.pages[11]);
    const values = pulseValues(time, 'grid');
    data.grid.forEach((cell, i) => {
      if (values[i] === 0) return;
      ctx.save();
      // Black is the original background, not a new visual element. Drawing
      // it with this alpha is exactly a fade of the original photograph.
      ctx.globalAlpha = values[i];
      ctx.fillStyle = '#000000';
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      ctx.restore();
    });
    return;
  }

  if (slide === 15) {
    const states = data.views.map((_, i) => characterState(time, i));
    if (states.every((s, i) => s.from === i && (s.mix === 0 || s.to === i))) {
      drawAsset(ctx, data.pages[14]); return;
    }
    drawAsset(ctx, data.characterBase);
    data.views.forEach((original, slot) => {
      const state = states[slot];
      const drawView = (index: number, opacity: number) => {
        if (opacity <= 0) return;
        const view = data.views[index];
        const x = original.x + (original.w - view.w) / 2;
        const y = original.y + original.h - view.h;
        ctx.save();
        ctx.globalAlpha = opacity;
        drawAsset(ctx, view.src, x, y);
        ctx.restore();
      };
      drawView(state.from, 1 - state.mix);
      if (state.mix > 0) drawView(state.to, state.mix);
    });
    return;
  }

  drawAsset(ctx, data.pages[slide - 1]);
}

function initialSlide() {
  const query = new URLSearchParams(window.location.search);
  const supplied = Number(query.get('slide') || window.location.hash.slice(1) || 1);
  return Number.isFinite(supplied) ? Math.max(1, Math.min(20, Math.floor(supplied))) : 1;
}

export default function Presentation() {
  const [slide, setSlide] = useState(initialSlide);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Original assets are local to this app. Warm all page images without
    // waiting on a remote service or adding a loading overlay to the slides.
    void Promise.all(data.pages.map(loadImage)).catch(console.error);
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        setSlide(current => {
          if (event.key === 'Home') return 1;
          if (event.key === 'End') return 20;
          const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
          return Math.max(1, Math.min(20, current + direction));
        });
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen().catch(console.error);
        else void containerRef.current?.requestFullscreen().catch(console.error);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let time = 0;
    let lastStamp: number | undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;
    canvas.dataset.running = 'false';
    document.title = `IDENTIDAD — MIRA × ELISAVA · ${slide}/20`;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${slide}`);
    const animated = [3, 10, 12, 15].includes(slide);
    // A non-visible deterministic resting-frame mode supports fidelity tests.
    const fixed = new URLSearchParams(window.location.search).get('time');
    const fixedTime = fixed === null ? null : Math.max(0, Number(fixed) || 0);

    const paint = () => {
      paintSlide(ctx, slide, fixedTime ?? time);
      canvas.dataset.time = (fixedTime ?? time).toFixed(3);
      canvas.dataset.ready = 'true';
    };
    const tick = (stamp: number) => {
      if (cancelled || document.hidden) return;
      if (lastStamp !== undefined) time += Math.max(0, stamp - lastStamp) / 1000;
      lastStamp = stamp;
      paint();
      canvas.dataset.running = 'true';
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      lastStamp = undefined;
      canvas.dataset.running = 'false';
      if (!document.hidden && animated && fixedTime === null && canvas.dataset.ready === 'true') frame = requestAnimationFrame(tick);
    };
    canvas.dataset.ready = 'false';

    // Render the immutable page first, then begin only after its layers load.
    void loadImage(data.pages[slide - 1]).then(() => {
      if (!cancelled) drawAsset(ctx, data.pages[slide - 1]);
    });
    void Promise.all(assetsForSlide(slide).map(loadImage)).then(() => {
      if (cancelled) return;
      paint();
      if (animated && fixedTime === null && !document.hidden) frame = requestAnimationFrame(tick);
    }).catch(error => { if (!cancelled) { canvas.dataset.error = String(error); console.error(error); } });

    window.document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      canvas.dataset.running = 'false';
      window.document.removeEventListener('visibilitychange', visibility);
    };
  }, [slide]);

  return (
    <main
      ref={containerRef}
      className="presentation"
      aria-label="IDENTIDAD — MIRA × ELISAVA. Twenty slides. Arrow keys navigate; F enters fullscreen."
      onDoubleClick={() => {
        if (!document.fullscreenElement) void containerRef.current?.requestFullscreen().catch(console.error);
      }}
    >
      <canvas
        ref={canvasRef}
        width={data.width}
        height={data.height}
        className="slide"
        data-slide={slide}
        aria-label={`Original presentation slide ${slide} of 20`}
      />
    </main>
  );
}