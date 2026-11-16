import { useMemo } from 'react';
import { generateDeterministicQrMatrix } from '../utils/almahyra';

interface QrCodeMatrixProps {
  value: string;
  sizePx?: number;
  label?: string;
}

export function QrCodeMatrix({
  value,
  sizePx = 92,
  label = 'Kode QR Anggota',
}: QrCodeMatrixProps) {
  const matrix = useMemo(() => generateDeterministicQrMatrix(value, 19), [value]);
  const cells = matrix.length;

  return (
    <div
      className="preserve-light inline-flex flex-col items-center rounded-xl border border-[#DCE4DF] bg-white p-2"
      aria-label={label}
    >
      <svg
        width={sizePx}
        height={sizePx}
        viewBox={`0 0 ${cells} ${cells}`}
        role="img"
        aria-label={`${label}: ${value}`}
        className="block"
      >
        <rect width={cells} height={cells} fill="#FFFFFF" />
        {matrix.map((row, rIdx) =>
          row.map((filled, cIdx) =>
            filled ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill="#111C17"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
