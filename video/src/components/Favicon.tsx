import { ICON } from "../theme";

/**
 * The gitcard app icon (src/app/icon.svg), drawn from the same geometry so it stays crisp at any size.
 * `cells` (0..1) reveals the 25 cells; `tile` (0..1) fades in the rounded tile.
 */
export const Favicon: React.FC<{ size: number; cells?: number; tile?: number; style?: React.CSSProperties }> = ({ size, cells = 1, tile = 1, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "block", overflow: "visible", ...style }}>
    <rect width="32" height="32" rx={ICON.radius} fill={ICON.tile} opacity={tile} />
    {ICON.grid.flatMap((row, r) =>
      row.map((lv, c) => {
        // diagonal reveal, bottom-left to top-right like the icon's streak
        const k = Math.min(1, Math.max(0, cells * 1.6 - ((c + (4 - r)) / 8) * 0.6));
        const x = ICON.offset + c * ICON.pitch, y = ICON.offset + r * ICON.pitch, h = ICON.cell / 2;
        return <rect key={`${r}-${c}`} x={x} y={y} width={ICON.cell} height={ICON.cell} rx={ICON.cellRadius} fill={ICON.cells[lv]} opacity={k} transform={`translate(${x + h} ${y + h}) scale(${0.6 + 0.4 * k}) translate(${-x - h} ${-y - h})`} />;
      }),
    )}
  </svg>
);
