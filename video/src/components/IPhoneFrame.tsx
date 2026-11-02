/** A generic modern phone silhouette (no logos, no system UI): bezel, rounded screen, a pill cut-out. */
export const IPhoneFrame: React.FC<{ width: number; children?: React.ReactNode; screen?: string }> = ({ width, children, screen = "#000" }) => {
  const h = width * (844 / 390);
  const bezel = width * 0.035;
  const r = width * 0.155;
  return (
    <div style={{ width, height: h, borderRadius: r, background: "linear-gradient(145deg,#3a3a3e,#1c1c1f 40%,#0e0e10)", padding: bezel, boxShadow: "0 40px 90px -20px rgba(0,0,0,.8), inset 0 0 0 1.5px rgba(255,255,255,.12)", position: "relative" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: r - bezel, background: screen, overflow: "hidden", position: "relative" }}>
        {children}
        <div style={{ position: "absolute", top: width * 0.03, left: "50%", transform: "translateX(-50%)", width: width * 0.3, height: width * 0.088, borderRadius: 999, background: "#000" }} />
      </div>
    </div>
  );
};
