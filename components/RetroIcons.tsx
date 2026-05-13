const PIXEL = { shapeRendering: "crispEdges" } as const;

export function SpinningGlobe({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 18"
      style={PIXEL}
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <clipPath id="globe-clip">
          <circle cx="8" cy="8" r="6" />
        </clipPath>
      </defs>

      {/* Sphere outline */}
      <circle cx="8" cy="8" r="6.5" fill="white" stroke="black" strokeWidth="1" />

      {/* Spinning continents (two copies for seamless loop) */}
      <g clipPath="url(#globe-clip)">
        <g className="globe-spin">
          {[0, 16].map((dx) => (
            <g key={dx} transform={`translate(${dx} 0)`}>
              {/* Continent A */}
              <rect x="1" y="4" width="2" height="1" fill="black" />
              <rect x="0" y="5" width="4" height="1" fill="black" />
              <rect x="1" y="6" width="4" height="1" fill="black" />
              <rect x="2" y="7" width="2" height="1" fill="black" />
              <rect x="3" y="8" width="1" height="1" fill="black" />
              {/* Continent B */}
              <rect x="7" y="3" width="3" height="1" fill="black" />
              <rect x="6" y="4" width="6" height="1" fill="black" />
              <rect x="7" y="5" width="6" height="1" fill="black" />
              <rect x="8" y="6" width="4" height="1" fill="black" />
              <rect x="10" y="7" width="2" height="1" fill="black" />
              {/* Continent C */}
              <rect x="10" y="9" width="2" height="1" fill="black" />
              <rect x="9" y="10" width="4" height="1" fill="black" />
              <rect x="10" y="11" width="3" height="1" fill="black" />
              <rect x="11" y="12" width="1" height="1" fill="black" />
            </g>
          ))}
        </g>

        {/* Latitude lines (static, on top of continents) */}
        <line x1="2" y1="5" x2="14" y2="5" stroke="black" strokeWidth="0.4" opacity="0.4" />
        <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="black" strokeWidth="0.4" opacity="0.4" />
        <line x1="2" y1="11" x2="14" y2="11" stroke="black" strokeWidth="0.4" opacity="0.4" />
      </g>

      {/* Stand */}
      <rect x="7" y="15" width="2" height="1" fill="black" />
      <rect x="4" y="16" width="8" height="1" fill="black" />
    </svg>
  );
}

