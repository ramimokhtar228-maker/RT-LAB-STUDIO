import React from 'react';

interface BarcodeRendererProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  width = 160,
  height = 42,
  showText = true,
  className = ''
}) => {
  // Generate a deterministic visual barcode pattern based on string characters
  const bars: { width: number; isSpace: boolean }[] = [];
  
  // Guard
  const safeVal = value || 'SMP-0000';
  
  // Start guard
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 1, isSpace: false });
  bars.push({ width: 2, isSpace: true });

  for (let i = 0; i < safeVal.length; i++) {
    const code = safeVal.charCodeAt(i);
    const pattern = (code * 17 + i * 31) % 64;
    
    // Convert pattern to 4 alternating bars/spaces
    bars.push({ width: (pattern & 1) ? 2 : 1, isSpace: false });
    bars.push({ width: (pattern & 2) ? 2 : 1, isSpace: true });
    bars.push({ width: (pattern & 4) ? 3 : 1, isSpace: false });
    bars.push({ width: (pattern & 8) ? 2 : 1, isSpace: true });
  }

  // Stop guard
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 1, isSpace: true });
  bars.push({ width: 2, isSpace: false });

  // Calculate total units
  const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);
  const unitWidth = width / Math.max(totalUnits, 1);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className="overflow-visible"
        aria-label={`Barcode: ${safeVal}`}
      >
        <rect width={width} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => {
          const rect = !bar.isSpace ? (
            <rect
              key={idx}
              x={currentX}
              y={0}
              width={bar.width * unitWidth}
              height={height}
              fill="#111827"
            />
          ) : null;
          currentX += bar.width * unitWidth;
          return rect;
        })}
      </svg>
      {showText && (
        <span className="text-[11px] font-mono tracking-wider font-bold text-slate-800 mt-0.5">
          {safeVal}
        </span>
      )}
    </div>
  );
};
