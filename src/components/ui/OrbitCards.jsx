import { useMemo } from "react";

export default function OrbitCards({
  items = [],
  renderItem,
  shape = "ellipse",
  radiusX = 340,
  radiusY = 90,
  rotation = -8,
  duration = 30,
  responsive = true,
  radius = 160,
  direction = "normal",
  showPath = true,
  paused = false,
  tilt = 62,
  itemSize = 260,
  itemWidth = 280,
  itemHeight = 250,
  avoidOverlap = true,
}) {
  const computedWidth = Number(itemSize) > 0 ? itemSize : itemWidth;
  const computedHeight = Number(itemSize) > 0 ? itemSize : itemHeight;
  const baseRadiusX = shape === "ellipse" ? radiusX : radius;
  const baseRadiusY = shape === "ellipse" ? radiusY : radius;
  const minRadiusForSpacing =
    (Math.max(computedWidth, computedHeight) * Math.max(items.length, 1)) /
      (2 * Math.PI) +
    64;
  const computedRadiusX =
    avoidOverlap && shape === "circle"
      ? Math.max(baseRadiusX, minRadiusForSpacing)
      : baseRadiusX;
  const computedRadiusY =
    avoidOverlap && shape === "circle"
      ? Math.max(baseRadiusY, minRadiusForSpacing)
      : baseRadiusY;
  const orbitClass = useMemo(
    () =>
      `orbit-track ${direction === "reverse" ? "orbit-reverse" : ""} ${
        paused ? "orbit-paused" : ""
      }`,
    [direction, paused]
  );
  const uprightClass = useMemo(
    () =>
      `orbit-upright ${direction === "reverse" ? "orbit-counter-reverse" : ""} ${
        paused ? "orbit-paused" : ""
      }`,
    [direction, paused]
  );

  if (!items.length || typeof renderItem !== "function") return null;

  return (
    <div
      className="orbit-root"
      style={{
        "--orbit-rx": `${computedRadiusX}px`,
        "--orbit-ry": `${computedRadiusY}px`,
        "--orbit-rotation": `${rotation}deg`,
        "--orbit-duration": `${duration}s`,
        "--orbit-tilt": `${tilt}deg`,
        width: responsive
          ? `min(100%, ${Math.max(980, Math.round(computedRadiusX * 2 + computedWidth + 60))}px)`
          : `${computedRadiusX * 2 + computedWidth + 20}px`,
        height: responsive
          ? `${Math.max(420, Math.round(computedRadiusY * 2 + computedHeight + 60))}px`
          : `${computedRadiusY * 2 + computedHeight + 20}px`,
      }}
    >
      {showPath && <div className="orbit-path" />}
      <div className={orbitClass}>
        {items.map((item, index) => {
          const angle = (index / Math.max(items.length, 1)) * Math.PI * 2;
          const x = Math.cos(angle) * computedRadiusX;
          const y = Math.sin(angle) * computedRadiusY;
          return (
            <div
              key={item?.id ?? index}
              className="orbit-card-item"
              style={{
                width: `${computedWidth}px`,
                height: `${computedHeight}px`,
                marginLeft: `${computedWidth * -0.5}px`,
                marginTop: `${computedHeight * -0.5}px`,
                transform: `translate3d(${x}px, ${y}px, 0px)`,
              }}
            >
              <div className={uprightClass}>{renderItem(item, index)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
