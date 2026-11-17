import type { Book } from '../types/almahyra';

interface CustomBookCoverSvgProps {
  book: Book;
  className?: string;
}

interface PaletteSpec {
  skyStart: string;
  skyEnd: string;
  hillBack: string;
  hillFront: string;
  sun: string;
  accent: string;
}

function resolveCoverPalette(book: Book): PaletteSpec {
  const k = book.kategori.toLowerCase();
  if (book.kodeBuku === 'IMG-001' || k.includes('cerita nusantara')) {
    return {
      skyStart: '#065F46',
      skyEnd: '#F59E0B',
      hillBack: '#047857',
      hillFront: '#064E3B',
      sun: '#FDE047',
      accent: '#FEF3C7',
    };
  }
  if (book.kodeBuku === 'FBL-002' || k.includes('fabel')) {
    return {
      skyStart: '#047857',
      skyEnd: '#6EE7B7',
      hillBack: '#10B981',
      hillFront: '#065F46',
      sun: '#FACC15',
      accent: '#FEF08A',
    };
  }
  if (book.kodeBuku === 'SNS-003' || k.includes('sains') || k.includes('ensiklopedia')) {
    return {
      skyStart: '#0F766E',
      skyEnd: '#38BDF8',
      hillBack: '#0D9488',
      hillFront: '#115E59',
      sun: '#FDE047',
      accent: '#BAE6FD',
    };
  }
  if (book.kodeBuku === 'DNG-004' || k.includes('dongeng')) {
    return {
      skyStart: '#0284C7',
      skyEnd: '#FDE68A',
      hillBack: '#059669',
      hillFront: '#047857',
      sun: '#FEF08A',
      accent: '#FFFFFF',
    };
  }
  if (book.kodeBuku === 'KMK-005' || k.includes('komik')) {
    return {
      skyStart: '#059669',
      skyEnd: '#FBBF24',
      hillBack: '#16A34A',
      hillFront: '#15803D',
      sun: '#FEF08A',
      accent: '#ECFEFF',
    };
  }
  if (book.kodeBuku === 'LNG-006' || k.includes('lingkungan')) {
    return {
      skyStart: '#15803D',
      skyEnd: '#A7F3D0',
      hillBack: '#22C55E',
      hillFront: '#166534',
      sun: '#FACC15',
      accent: '#DCFCE7',
    };
  }
  if (k.includes('sejarah') || k.includes('budaya')) {
    return {
      skyStart: '#B45309',
      skyEnd: '#FDE68A',
      hillBack: '#047857',
      hillFront: '#064E3B',
      sun: '#FEF3C7',
      accent: '#FBBF24',
    };
  }
  return {
    skyStart: '#047857',
    skyEnd: '#34D399',
    hillBack: '#10B981',
    hillFront: '#065F46',
    sun: '#FACC15',
    accent: '#FEF9C3',
  };
}

export function CustomBookCoverSvg({
  book,
  className = 'h-full w-full',
}: CustomBookCoverSvgProps) {
  const palette = resolveCoverPalette(book);
  const safeId = book.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const bgId = `bg-${safeId}`;
  const glowId = `glow-${safeId}`;
  const code = book.kodeBuku;
  const cat = book.kategori.toLowerCase();

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      role="img"
      aria-label={`Ilustrasi sampul ${book.judul}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.skyStart} />
          <stop offset="100%" stopColor={palette.skyEnd} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.sun} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.sun} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Vibrant Gradient Sky Backdrop */}
      <rect width="400" height="300" fill={`url(#${bgId})`} />

      {/* Warm Sun / Lantern Aura */}
      <circle cx="305" cy="72" r="78" fill={`url(#${glowId})`} />
      <circle cx="305" cy="72" r="28" fill={palette.sun} />

      {/* Soft Decorative Clouds */}
      <g fill="#FFFFFF" fillOpacity="0.22">
        <ellipse cx="95" cy="64" rx="44" ry="16" />
        <ellipse cx="122" cy="58" rx="28" ry="14" />
        <ellipse cx="220" cy="46" rx="34" ry="11" />
      </g>

      {/* Layered Terraced Hills */}
      <path
        d="M0 218 Q105 162 215 198 T400 182 L400 300 L0 300 Z"
        fill={palette.hillBack}
      />
      <path
        d="M0 245 Q135 202 270 238 T400 220 L400 300 L0 300 Z"
        fill={palette.hillFront}
      />

      {/* Story-Specific Bespoke Centerpiece Illustration */}
      {code === 'IMG-001' || cat.includes('cerita nusantara') ? (
        <g transform="translate(110, 88)">
          {/* Traditional Bamboo Teras + Warm Reading Lantern */}
          <path d="M18 76 L90 28 L162 76 Z" fill="#FDE68A" fillOpacity="0.95" />
          <rect x="34" y="76" width="112" height="68" rx="8" fill="#FFFBEB" />
          <rect x="48" y="88" width="38" height="44" rx="4" fill="#047857" />
          <rect x="94" y="88" width="38" height="44" rx="4" fill="#F59E0B" />
          {/* Glowing Hanging Lantern */}
          <line x1="90" y1="48" x2="90" y2="66" stroke="#78350F" strokeWidth="3" />
          <ellipse cx="90" cy="76" rx="14" ry="16" fill="#FACC15" stroke="#B45309" strokeWidth="2.5" />
          <circle cx="90" cy="76" r="7" fill="#FEF9C3" />
        </g>
      ) : code === 'FBL-002' || cat.includes('fabel') ? (
        <g transform="translate(120, 92)">
          {/* River Stream + Friendly Kancil Ears & Leaf Motif */}
          <path
            d="M-30 142 Q40 120 85 138 T190 132"
            stroke="#BAE6FD"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="80" cy="96" rx="42" ry="34" fill="#FEF3C7" />
          <ellipse cx="58" cy="54" rx="10" ry="28" transform="rotate(-14 58 54)" fill="#FDE68A" />
          <ellipse cx="102" cy="54" rx="10" ry="28" transform="rotate(14 102 54)" fill="#FDE68A" />
          <circle cx="65" cy="92" r="5" fill="#064E3B" />
          <circle cx="95" cy="92" r="5" fill="#064E3B" />
          <ellipse cx="80" cy="108" rx="8" ry="6" fill="#B45309" />
          <circle cx="24" cy="72" r="14" fill="#34D399" />
          <circle cx="138" cy="68" r="16" fill="#6EE7B7" />
        </g>
      ) : code === 'SNS-003' || cat.includes('sains') || cat.includes('ensiklopedia') ? (
        <g transform="translate(118, 80)">
          {/* Science Flask + Colorful Rainbow Leaf Capillary Jar */}
          <rect x="28" y="42" width="46" height="84" rx="10" fill="#FFFFFF" fillOpacity="0.92" />
          <rect x="34" y="82" width="34" height="38" rx="6" fill="#38BDF8" fillOpacity="0.7" />
          <path d="M51 88 L51 28 M51 44 L36 30 M51 48 L66 34" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
          <circle cx="34" cy="28" r="9" fill="#FACC15" />
          <circle cx="68" cy="32" r="9" fill="#10B981" />
          {/* Magnifying Glass */}
          <circle cx="116" cy="76" r="28" fill="#E0F2FE" stroke="#FACC15" strokeWidth="7" />
          <line x1="136" y1="96" x2="156" y2="118" stroke="#B45309" strokeWidth="8" strokeLinecap="round" />
        </g>
      ) : code === 'KMK-005' || cat.includes('komik') ? (
        <g transform="translate(96, 86)">
          {/* Comic Burst + Three Eco Sorting Bins */}
          <polygon
            points="104,10 120,38 152,32 138,60 164,82 132,92 128,122 104,102 80,122 76,92 44,82 70,60 56,32 88,38"
            fill="#FEF08A"
            fillOpacity="0.88"
          />
          <rect x="24" y="72" width="44" height="62" rx="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="82" y="64" width="44" height="70" rx="7" fill="#FACC15" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="140" y="72" width="44" height="62" rx="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="46" cy="96" r="9" fill="#FFFFFF" fillOpacity="0.85" />
          <circle cx="104" cy="92" r="9" fill="#FFFFFF" fillOpacity="0.85" />
          <circle cx="162" cy="96" r="9" fill="#FFFFFF" fillOpacity="0.85" />
        </g>
      ) : code === 'DNG-004' || cat.includes('dongeng') ? (
        <g transform="translate(105, 80)">
          {/* Paper Origami Stars & Paper Bird Gliding */}
          <polygon points="88,24 148,54 102,78 122,108 68,80" fill="#FFFFFF" fillOpacity="0.95" />
          <polygon points="88,24 102,78 68,80" fill="#FDE68A" />
          <polygon points="34,42 42,58 58,60 46,72 48,88 34,80 20,88 22,72 10,60 26,58" fill="#FACC15" />
          <polygon points="154,88 160,100 174,102 164,112 166,126 154,120 142,126 144,112 134,102 148,100" fill="#FEF08A" />
        </g>
      ) : (
        <g transform="translate(120, 82)">
          {/* Open Storybook + Sprouting Golden Leaves */}
          <path d="M18 118 Q50 100 80 116 Q110 100 142 118 L142 62 Q110 46 80 62 Q50 46 18 62 Z" fill="#FFFBEB" />
          <line x1="80" y1="62" x2="80" y2="116" stroke="#D97706" strokeWidth="3" />
          <path d="M80 62 Q80 30 104 22 Q104 48 80 62 Z" fill="#34D399" />
          <path d="M80 62 Q80 34 56 26 Q56 50 80 62 Z" fill="#FACC15" />
        </g>
      )}

      {/* Subtle Crisp Frame Border */}
      <rect
        x="10"
        y="10"
        width="380"
        height="280"
        rx="14"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
    </svg>
  );
}
