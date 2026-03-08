import { useCallback } from "react";

type Direction = "up" | "down" | "left" | "right";

interface MobileControlsProps {
  onDirection: (dir: Direction) => void;
  onRelease: (dir: Direction) => void;
}

interface DpadButtonProps {
  dir: Direction;
  label: string;
  ocid: string;
  onDirection: (dir: Direction) => void;
  onRelease: (dir: Direction) => void;
  style?: React.CSSProperties;
}

function DpadButton({
  dir,
  label,
  ocid,
  onDirection,
  onRelease,
  style,
}: DpadButtonProps) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onDirection(dir);
    },
    [dir, onDirection],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      onRelease(dir);
    },
    [dir, onRelease],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      onRelease(dir);
    },
    [dir, onRelease],
  );

  return (
    <button
      type="button"
      data-ocid={ocid}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Move ${dir}`}
      style={{
        width: 64,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        lineHeight: 1,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        /* Minecraft stone-block style */
        background:
          "linear-gradient(135deg, #6b6b6b 0%, #4a4a4a 40%, #333 100%)",
        border: "3px solid",
        borderColor: "#8a8a8a #2a2a2a #2a2a2a #8a8a8a",
        boxShadow:
          "inset 1px 1px 0 #aaa, inset -1px -1px 0 #1a1a1a, 2px 2px 0 #000",
        color: "#f0c030",
        fontFamily: "'Press Start 2P', monospace",
        position: "relative",
        transition: "filter 0.05s",
        borderRadius: 2,
        ...style,
      }}
      onPointerEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter =
          "brightness(1.25)";
      }}
      onPointerOut={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
      }}
    >
      {label}
    </button>
  );
}

export function MobileControls({
  onDirection,
  onRelease,
}: MobileControlsProps) {
  return (
    <div
      aria-label="Directional controls"
      style={{
        display: "grid",
        gridTemplateColumns: "64px 64px 64px",
        gridTemplateRows: "64px 64px 64px",
        gap: 4,
        padding: "12px 0 8px",
        justifyContent: "center",
        /* Mossy-green center piece */
        background: "rgba(0,0,0,0.5)",
        borderTop: "2px solid #3a3a3a",
        touchAction: "none",
      }}
    >
      {/* Row 1: Up button centered */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <DpadButton
          dir="up"
          label="▲"
          ocid="controls.up_button"
          onDirection={onDirection}
          onRelease={onRelease}
        />
      </div>

      {/* Row 2: Left, Center (decorative), Right */}
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <DpadButton
          dir="left"
          label="◀"
          ocid="controls.left_button"
          onDirection={onDirection}
          onRelease={onRelease}
        />
      </div>

      {/* Center decorative tile */}
      <div
        style={{
          gridColumn: 2,
          gridRow: 2,
          width: 64,
          height: 64,
          background:
            "linear-gradient(135deg, #3a5a1e 0%, #2a4a14 50%, #1e3a0e 100%)",
          border: "3px solid",
          borderColor: "#5a8a2c #1a3a0a #1a3a0a #5a8a2c",
          boxShadow:
            "inset 1px 1px 0 #7ab53c, inset -1px -1px 0 #0e2006, 2px 2px 0 #000",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
      >
        🐺
      </div>

      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <DpadButton
          dir="right"
          label="▶"
          ocid="controls.right_button"
          onDirection={onDirection}
          onRelease={onRelease}
        />
      </div>

      {/* Row 3: Down button centered */}
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <DpadButton
          dir="down"
          label="▼"
          ocid="controls.down_button"
          onDirection={onDirection}
          onRelease={onRelease}
        />
      </div>
    </div>
  );
}
