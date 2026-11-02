/** Pointer arrow with a soft click ring. `click` 0..1 animates the press. */
export const Cursor: React.FC<{ x: number; y: number; size?: number; click?: number; opacity?: number }> = ({ x, y, size = 28, click = 0, opacity = 1 }) => {
  const ring = click > 0 && click < 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none" }}>
      {ring && <div style={{ position: "absolute", left: -size * 1.1, top: -size * 1.1, width: size * 2.2, height: size * 2.2, borderRadius: "50%", border: `2px solid rgba(255,255,255,${0.6 * (1 - click)})`, transform: `scale(${0.3 + click * 0.9})` }} />}
      <svg width={size} height={size * 1.25} viewBox="0 0 20 25" style={{ transform: `scale(${1 - 0.12 * Math.sin(Math.PI * click)})`, transformOrigin: "0 0", filter: "drop-shadow(0 3px 6px rgba(0,0,0,.5))" }}>
        <path d="M1 1 L1 19.5 L5.6 15.4 L8.7 22.6 L12 21.2 L8.9 14.2 L15 14.2 Z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
