/**
 * Animated conic-gradient beam that travels around a container's border.
 * Wrap any positioned container; the beam is masked to a 1-2px ring.
 */
export default function BorderBeam({ duration = 9, borderWidth = 1.5, color1 = 'var(--brand-400)', color2 = 'var(--cyan-400)', radius = 'inherit' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
        padding: borderWidth,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
      }}
    >
      <div
        style={{
          position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
          background: `conic-gradient(from 0deg, transparent 0 70%, ${color1} 85%, ${color2} 94%, transparent 100%)`,
          animation: `beam ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
