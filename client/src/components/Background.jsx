/**
 * Fixed, page-wide backdrop: three slowly drifting aurora blobs, a faint dot grid, a radial vignette and film grain.
 * Pure CSS (see .bg-* in styles.css) – no canvas, no library, respects prefers-reduced-motion.
 */
export default function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-grid" />
      <div className="bg-vignette" />
      <div className="bg-noise" />
    </div>
  );
}
