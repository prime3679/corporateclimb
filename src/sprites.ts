// ─── SVG CHARACTER SPRITES ──────────────────────────────────
// Modern Pokémon trainer-style: full anime proportions, detailed
// linework, cel-shaded coloring, expressive faces, dynamic poses.
// ViewBox 128x160 for tall character proportions.

function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

const O = "#2D2D3D"; // outline
const S = "#FCCCA0"; // skin
const Sd = "#E4AA80"; // skin shadow
const Sh = "#FFE0C0"; // skin highlight

function sprite(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 160">${inner}</svg>`;
}

// Anime eye helper — large, detailed eyes with iris + pupil + highlights
function animeEye(cx: number, cy: number, irisColor: string, size = 1, lookDir = 0): string {
  const r = 4.5 * size;
  const irisR = 3.5 * size;
  const pupilR = 1.8 * size;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.85}" ry="${r}" fill="#fff" stroke="${O}" stroke-width="1.2"/>
    <ellipse cx="${cx + lookDir}" cy="${cy + 0.5}" rx="${irisR * 0.85}" ry="${irisR}" fill="${irisColor}"/>
    <ellipse cx="${cx + lookDir}" cy="${cy + 1.5 * size}" rx="${pupilR * 0.8}" ry="${pupilR}" fill="${O}"/>
    <ellipse cx="${cx + lookDir + 1}" cy="${cy - 1 * size}" rx="${1.2 * size}" ry="${1.5 * size}" fill="#fff" opacity="0.9"/>
    <ellipse cx="${cx + lookDir - 0.8}" cy="${cy + 1.5 * size}" rx="${0.6 * size}" ry="${0.8 * size}" fill="#fff" opacity="0.5"/>
  `;
}

const SVG_SPRITES: Record<string, string> = {

  // ── Product Manager ─────────────────────────────────────
  // Teal blazer over white tee, dark jeans, tablet in one hand, stylus raised
  pm: sprite(`
    <defs>
      <linearGradient id="pm-hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5D4037"/>
        <stop offset="100%" stop-color="#3E2723"/>
      </linearGradient>
      <linearGradient id="pm-blazer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#26A69A"/>
        <stop offset="100%" stop-color="#00897B"/>
      </linearGradient>
    </defs>
    <!-- Hair back -->
    <path d="M44 22 Q44 4 64 2 Q84 4 84 22 L86 28 Q86 8 64 4 Q42 8 42 28 Z" fill="url(#pm-hair)" stroke="${O}" stroke-width="1.2"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Hair front — side sweep -->
    <path d="M46 24 Q46 8 64 5 Q76 6 82 14 L78 18 Q74 10 64 8 Q50 10 48 22 Z" fill="url(#pm-hair)" stroke="${O}" stroke-width="1"/>
    <path d="M46 20 Q46 14 52 12 L50 22 Q48 24 46 24 Z" fill="#4E342E"/>
    <!-- Hair highlight -->
    <path d="M56 8 Q60 6 64 8" fill="none" stroke="#8D6E63" stroke-width="1" opacity="0.5"/>
    <!-- Eyes -->
    ${animeEye(56, 30, "#6D4C41")}
    ${animeEye(72, 30, "#6D4C41")}
    <!-- Eyebrows -->
    <path d="M50 24 Q56 22 60 24" fill="none" stroke="#3E2723" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M68 24 Q72 22 78 24" fill="none" stroke="#3E2723" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 34 L62 37" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Open smile -->
    <path d="M58 40 Q64 45 70 40" fill="#fff" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M58 40 Q64 42 70 40" fill="${O}" opacity="0.1"/>
    <!-- Blush -->
    <ellipse cx="50" cy="36" rx="4" ry="2" fill="#FFAB91" opacity="0.3"/>
    <ellipse cx="78" cy="36" rx="4" ry="2" fill="#FFAB91" opacity="0.3"/>
    <!-- Earring -->
    <circle cx="82" cy="32" r="1.2" fill="#B0BEC5"/>
    <!-- Neck -->
    <path d="M58 46 L58 54 Q64 56 70 54 L70 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <path d="M62 46 L62 52 Q64 53 66 52 L66 46" fill="${Sd}" opacity="0.3"/>
    <!-- White tee (V-neck visible) -->
    <path d="M52 54 L58 52 Q64 56 70 52 L76 54 L78 64 L50 64 Z" fill="#fff" stroke="${O}" stroke-width="1"/>
    <path d="M58 52 L64 58 L70 52" fill="none" stroke="#ddd" stroke-width="0.8"/>
    <!-- Teal blazer -->
    <path d="M38 56 L52 52 L52 64 L38 64 Z" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <path d="M90 56 L76 52 L76 64 L90 64 Z" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <path d="M38 64 L40 108 L56 108 L56 64 Z" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <path d="M90 64 L88 108 L72 108 L72 64 Z" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <!-- Blazer lapels -->
    <path d="M52 54 L58 66 L52 66 Z" fill="#1B7A6E" stroke="${O}" stroke-width="0.8"/>
    <path d="M76 54 L70 66 L76 66 Z" fill="#1B7A6E" stroke="${O}" stroke-width="0.8"/>
    <!-- Belt -->
    <rect x="42" y="104" width="44" height="4" rx="1" fill="#5D4037" stroke="${O}" stroke-width="0.8"/>
    <ellipse cx="64" cy="106" rx="3" ry="2" fill="#E53935"/>
    <!-- Right arm raised — holding stylus -->
    <path d="M90 58 L102 48 L106 38 L102 36 L98 46 L88 56" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <path d="M102 36 L106 38 L108 36" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <line x1="105" y1="36" x2="110" y2="24" stroke="#607D8B" stroke-width="2" stroke-linecap="round"/>
    <!-- Left arm — holding tablet -->
    <path d="M38 58 L26 72 L28 90 L34 90 L34 74 L40 62" fill="url(#pm-blazer)" stroke="${O}" stroke-width="1.2"/>
    <path d="M28 90 L34 90 L32 88" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <!-- Tablet -->
    <rect x="18" y="72" width="16" height="22" rx="2" fill="#263238" stroke="${O}" stroke-width="1"/>
    <rect x="20" y="74" width="12" height="18" rx="1" fill="#E3F2FD"/>
    <text x="22" y="80" fill="#333" font-size="3.5" font-family="sans-serif" font-weight="bold">ROADMAP</text>
    <rect x="21" y="82" width="10" height="2" rx="0.5" fill="#4CAF50"/>
    <rect x="21" y="85" width="7" height="2" rx="0.5" fill="#FF9800"/>
    <rect x="21" y="88" width="4" height="2" rx="0.5" fill="#F44336"/>
    <!-- Dark jeans -->
    <path d="M42 108 L40 146 L54 146 L56 108" fill="#37474F" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 108 L74 146 L88 146 L86 108" fill="#37474F" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M38 144 L56 144 L56 152 Q48 154 38 152 Z" fill="#455A64" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 144 L90 144 L90 152 Q82 154 72 152 Z" fill="#455A64" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── Senior Engineer ─────────────────────────────────────
  // Dark hoodie, messy hair, over-ear headphones, laptop under arm
  eng: sprite(`
    <defs>
      <linearGradient id="eng-hair" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#5D4037"/>
        <stop offset="100%" stop-color="#3E2723"/>
      </linearGradient>
    </defs>
    <!-- Headphones -->
    <path d="M42 20 Q40 4 64 2 Q88 4 86 20" fill="none" stroke="#424242" stroke-width="4" stroke-linecap="round"/>
    <rect x="38" y="18" width="8" height="12" rx="3" fill="#616161" stroke="${O}" stroke-width="1"/>
    <rect x="82" y="18" width="8" height="12" rx="3" fill="#616161" stroke="${O}" stroke-width="1"/>
    <rect x="40" y="20" width="4" height="8" rx="1.5" fill="#9E9E9E"/>
    <rect x="84" y="20" width="4" height="8" rx="1.5" fill="#9E9E9E"/>
    <!-- Hair back -->
    <path d="M44 24 Q42 6 64 3 Q86 6 84 24" fill="url(#eng-hair)"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Messy hair -->
    <path d="M46 22 Q44 6 64 4 Q84 6 82 22 L80 16 Q76 8 64 7 Q52 8 48 16 Z" fill="url(#eng-hair)" stroke="${O}" stroke-width="1"/>
    <path d="M50 10 L46 6 L50 14 Z" fill="#4E342E"/>
    <path d="M78 10 L82 5 L78 14 Z" fill="#4E342E"/>
    <path d="M66 6 L68 2 L70 8 Z" fill="#4E342E"/>
    <path d="M58 8 L56 4 L60 10 Z" fill="#4E342E"/>
    <!-- Eyes (slightly tired, half-lidded) -->
    ${animeEye(56, 30, "#455A64")}
    ${animeEye(72, 30, "#455A64")}
    <!-- Heavy lids -->
    <path d="M50 26 Q56 25 62 27" fill="${S}" stroke="${O}" stroke-width="1"/>
    <path d="M66 27 Q72 25 78 26" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Nose -->
    <path d="M64 34 L62 37" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Slight smirk -->
    <path d="M60 40 Q64 42 68 40" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Neck -->
    <path d="M58 46 L58 52 Q64 54 70 52 L70 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Dark hoodie -->
    <path d="M34 54 L54 50 Q64 54 74 50 L94 54 L96 110 L32 110 Z" fill="#333" stroke="${O}" stroke-width="1.5"/>
    <!-- Hood -->
    <path d="M40 54 L54 48 Q64 52 74 48 L88 54 L84 58 Q64 62 44 58 Z" fill="#444" stroke="${O}" stroke-width="1"/>
    <!-- Hoodie front pocket -->
    <path d="M44 82 L84 82 L84 98 Q64 102 44 98 Z" fill="none" stroke="#555" stroke-width="1.2"/>
    <!-- Drawstrings -->
    <line x1="58" y1="56" x2="56" y2="72" stroke="#888" stroke-width="0.8"/>
    <line x1="70" y1="56" x2="72" y2="72" stroke="#888" stroke-width="0.8"/>
    <circle cx="56" cy="73" r="1.5" fill="#888"/>
    <circle cx="72" cy="73" r="1.5" fill="#888"/>
    <!-- Left arm — laptop under arm -->
    <path d="M34 56 L22 72 L24 94 L30 94 L30 76 L36 60" fill="#333" stroke="${O}" stroke-width="1.2"/>
    <path d="M24 94 L30 94 L28 92" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <!-- Laptop -->
    <rect x="14" y="82" width="16" height="12" rx="2" fill="#37474F" stroke="${O}" stroke-width="1" transform="rotate(-10 22 88)"/>
    <rect x="16" y="84" width="12" height="8" rx="1" fill="#263238" transform="rotate(-10 22 88)"/>
    <text x="19" y="90" fill="#00E676" font-size="4" font-family="monospace" transform="rotate(-10 22 88)">&gt;_</text>
    <!-- Right arm — in pocket -->
    <path d="M94 56 L98 70 L96 86 L92 86" fill="#333" stroke="${O}" stroke-width="1.2"/>
    <!-- Jeans -->
    <path d="M38 108 L36 146 L52 146 L54 108" fill="#546E7A" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 108 L76 146 L92 146 L90 108" fill="#546E7A" stroke="${O}" stroke-width="1.2"/>
    <!-- Sneakers -->
    <path d="M34 144 L54 144 L54 152 Q44 156 34 152 Z" fill="#424242" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 144 L94 144 L94 152 Q84 156 74 152 Z" fill="#424242" stroke="${O}" stroke-width="1.2"/>
    <path d="M36 148 L52 148" stroke="#fff" stroke-width="1" opacity="0.6"/>
    <path d="M76 148 L92 148" stroke="#fff" stroke-width="1" opacity="0.6"/>
  `),

  // ── UX Designer ─────────────────────────────────────────
  // Beret, paint-splattered smock, warm colors, confident pose with stylus
  design: sprite(`
    <defs>
      <linearGradient id="des-hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D32F2F"/>
        <stop offset="100%" stop-color="#B71C1C"/>
      </linearGradient>
    </defs>
    <!-- Beret -->
    <ellipse cx="64" cy="10" rx="20" ry="6" fill="#E53935" stroke="${O}" stroke-width="1.2"/>
    <path d="M44 12 Q44 0 64 -2 Q84 0 84 12" fill="#E53935" stroke="${O}" stroke-width="1"/>
    <circle cx="64" cy="0" r="3" fill="#C62828" stroke="${O}" stroke-width="0.8"/>
    <!-- Hair -->
    <path d="M44 24 Q42 10 64 8 Q86 10 84 24 L82 18 Q78 12 64 11 Q50 12 46 18 Z" fill="url(#des-hair)" stroke="${O}" stroke-width="1"/>
    <path d="M44 20 Q42 16 48 14 L46 22 Z" fill="#C62828"/>
    <path d="M84 20 Q86 16 80 14 L82 22 Z" fill="#C62828"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="19" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Eyes — large, expressive -->
    ${animeEye(56, 29, "#7B1FA2", 1.1)}
    ${animeEye(72, 29, "#7B1FA2", 1.1)}
    <!-- Lashes -->
    <path d="M49 25 L51 27" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M79 25 L77 27" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Brows -->
    <path d="M50 23 Q56 21 61 23" fill="none" stroke="#B71C1C" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M67 23 Q72 21 78 23" fill="none" stroke="#B71C1C" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 33 L62 36" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Bright smile -->
    <path d="M57 39 Q64 44 71 39" fill="#fff" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="49" cy="35" rx="4" ry="2.5" fill="#FFAB91" opacity="0.35"/>
    <ellipse cx="79" cy="35" rx="4" ry="2.5" fill="#FFAB91" opacity="0.35"/>
    <!-- Earrings -->
    <circle cx="83" cy="32" r="1.5" fill="#FDD835" stroke="${O}" stroke-width="0.5"/>
    <!-- Neck -->
    <path d="M58 45 L58 52 Q64 54 70 52 L70 45" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Scarf -->
    <path d="M50 50 Q64 58 78 50" fill="#FDD835" stroke="${O}" stroke-width="1"/>
    <path d="M70 52 L74 74 L68 74 Z" fill="#FDD835" stroke="${O}" stroke-width="0.8"/>
    <!-- Purple wrap top -->
    <path d="M36 54 L54 50 Q64 54 74 50 L92 54 L94 96 L34 96 Z" fill="#9C27B0" stroke="${O}" stroke-width="1.5"/>
    <path d="M36 54 L54 50 L64 68 L34 68 Z" fill="#7B1FA2"/>
    <path d="M92 54 L74 50 L64 68 L94 68 Z" fill="#7B1FA2"/>
    <!-- Left arm — hand on hip -->
    <path d="M36 56 L28 68 L32 80 L36 78 L34 70 L38 60" fill="#9C27B0" stroke="${O}" stroke-width="1.2"/>
    <circle cx="32" cy="80" r="3" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — stylus raised -->
    <path d="M92 56 L102 48 L106 40 L102 38 L98 46 L90 54" fill="#9C27B0" stroke="${O}" stroke-width="1.2"/>
    <path d="M104 38 L102 38 L106 40" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <line x1="105" y1="38" x2="112" y2="24" stroke="#FDD835" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="112" cy="23" r="1.5" fill="#E53935"/>
    <!-- Skirt -->
    <path d="M38 94 L32 130 L96 130 L90 94 Z" fill="#37474F" stroke="${O}" stroke-width="1.2"/>
    <!-- Legs -->
    <path d="M46 128 L44 146 L56 146 L54 128" fill="${S}" stroke="${O}" stroke-width="1"/>
    <path d="M74 128 L72 146 L84 146 L82 128" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Red shoes -->
    <path d="M42 144 L58 144 L58 152 Q50 155 42 152 Z" fill="#E53935" stroke="${O}" stroke-width="1.2"/>
    <path d="M70 144 L86 144 L86 152 Q78 155 70 152 Z" fill="#E53935" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── Intern ──────────────────────────────────────────────
  // Young-looking, wide eyes, green polo, lanyard, holding coffee nervously
  intern: sprite(`
    <defs>
      <linearGradient id="int-hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFB74D"/>
        <stop offset="100%" stop-color="#F57C00"/>
      </linearGradient>
    </defs>
    <!-- Hair -->
    <path d="M46 24 Q44 6 64 3 Q84 6 82 24 L80 16 Q76 8 64 7 Q52 8 48 16 Z" fill="url(#int-hair)" stroke="${O}" stroke-width="1"/>
    <path d="M48 14 Q48 10 54 10 L50 18 Z" fill="#F57C00"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Big nervous eyes -->
    ${animeEye(56, 30, "#4CAF50", 1.2)}
    ${animeEye(72, 30, "#4CAF50", 1.2)}
    <!-- Worried brows -->
    <path d="M50 23 Q54 25 60 24" fill="none" stroke="#F57C00" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M68 24 Q74 25 78 23" fill="none" stroke="#F57C00" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 34 L62 37" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Nervous smile -->
    <path d="M59 41 Q64 43 69 41" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Sweat drop -->
    <path d="M84 22 Q86 28 83 32 Q82 28 84 22 Z" fill="#81D4FA" stroke="#4FC3F7" stroke-width="0.5"/>
    <!-- Blush -->
    <ellipse cx="50" cy="36" rx="4" ry="2" fill="#FFAB91" opacity="0.35"/>
    <ellipse cx="78" cy="36" rx="4" ry="2" fill="#FFAB91" opacity="0.35"/>
    <!-- Neck -->
    <path d="M58 46 L58 54 Q64 56 70 54 L70 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Lanyard -->
    <line x1="58" y1="48" x2="56" y2="56" stroke="#E53935" stroke-width="1.5"/>
    <line x1="70" y1="48" x2="72" y2="56" stroke="#E53935" stroke-width="1.5"/>
    <path d="M56 56 L54 76 L74 76 L72 56" fill="none" stroke="#E53935" stroke-width="1.5"/>
    <rect x="56" y="72" width="16" height="10" rx="2" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <rect x="58" y="74" width="12" height="3" rx="1" fill="#E53935"/>
    <rect x="59" y="78" width="10" height="1.5" fill="#ccc"/>
    <!-- Green polo -->
    <path d="M36 54 L56 50 Q64 54 72 50 L92 54 L94 110 L34 110 Z" fill="#43A047" stroke="${O}" stroke-width="1.5"/>
    <!-- Collar -->
    <path d="M54 50 Q64 56 74 50" fill="#388E3C" stroke="${O}" stroke-width="1"/>
    <path d="M56 50 L64 56 L72 50" fill="none" stroke="#2E7D32" stroke-width="1"/>
    <!-- Left arm — holding coffee cup -->
    <path d="M36 56 L24 72 L26 92 L32 92 L32 76 L38 60" fill="#43A047" stroke="${O}" stroke-width="1.2"/>
    <circle cx="28" cy="92" r="3.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Coffee cup -->
    <rect x="18" y="82" width="12" height="16" rx="3" fill="#fff" stroke="${O}" stroke-width="1"/>
    <rect x="18" y="82" width="12" height="5" rx="3" fill="#6D4C41" stroke="${O}" stroke-width="0.8"/>
    <path d="M30 88 Q34 91 30 96" fill="none" stroke="${O}" stroke-width="1.2"/>
    <!-- Steam -->
    <path d="M21 80 Q22 76 20 73" fill="none" stroke="#bbb" stroke-width="0.8" opacity="0.5"/>
    <path d="M25 79 Q26 75 24 72" fill="none" stroke="#bbb" stroke-width="0.8" opacity="0.5"/>
    <!-- Right arm — at side nervously -->
    <path d="M92 56 L98 72 L96 90 L90 90 L92 74 L90 60" fill="#43A047" stroke="${O}" stroke-width="1.2"/>
    <circle cx="93" cy="90" r="3.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Khakis -->
    <path d="M40 108 L38 146 L54 146 L56 108" fill="#8D6E63" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 108 L74 146 L90 146 L88 108" fill="#8D6E63" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M36 144 L56 144 L56 152 Q46 155 36 152 Z" fill="#795548" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 144 L92 144 L92 152 Q82 155 72 152 Z" fill="#795548" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── Recruiter ───────────────────────────────────────────
  // Slick hair, sharp navy suit, red tie, phone in hand, confident smirk
  recruiter: sprite(`
    <defs>
      <linearGradient id="rec-suit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#283593"/>
        <stop offset="100%" stop-color="#1A237E"/>
      </linearGradient>
    </defs>
    <!-- Hair — slicked back -->
    <path d="M46 24 Q46 6 64 3 Q82 6 82 24 L80 14 Q76 8 64 6 Q52 8 48 14 Z" fill="#1A1A2E" stroke="${O}" stroke-width="1"/>
    <!-- Hair shine -->
    <path d="M54 10 Q58 7 62 10" fill="none" stroke="#444" stroke-width="0.8" opacity="0.4"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Eyes — sharp, confident -->
    ${animeEye(56, 30, "#37474F")}
    ${animeEye(72, 30, "#37474F")}
    <!-- Angled brows -->
    <path d="M50 23 Q56 21 61 24" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>
    <path d="M67 24 Q72 21 78 23" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 34 L62 37" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Confident smirk -->
    <path d="M58 40 Q64 44 70 41" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Neck -->
    <path d="M58 46 L58 54 Q64 56 70 54 L70 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Navy suit -->
    <path d="M34 56 L56 50 Q64 54 72 50 L94 56 L96 110 L32 110 Z" fill="url(#rec-suit)" stroke="${O}" stroke-width="1.5"/>
    <!-- Lapels -->
    <path d="M54 50 L64 68 L56 68 L42 56 Z" fill="#1A237E" stroke="${O}" stroke-width="0.8"/>
    <path d="M74 50 L64 68 L72 68 L86 56 Z" fill="#1A237E" stroke="${O}" stroke-width="0.8"/>
    <!-- Shirt + red tie -->
    <rect x="60" y="56" width="8" height="48" fill="#ECEFF1"/>
    <path d="M62 56 L64 60 L66 56 L65 90 L64 92 L63 90 Z" fill="#C62828"/>
    <path d="M62 56 L64 60 L66 56" fill="#E53935"/>
    <!-- Pocket square -->
    <path d="M40 60 L46 58 L48 64 L42 66 Z" fill="#C62828"/>
    <!-- Left arm — at side -->
    <path d="M34 58 L24 74 L26 92 L32 92 L32 76 L36 62" fill="url(#rec-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="28" cy="92" r="3.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — holding phone up -->
    <path d="M94 58 L104 66 L104 84 L98 84 L98 70 L92 62" fill="url(#rec-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="104" cy="72" r="3" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <!-- Phone -->
    <rect x="100" y="62" width="8" height="14" rx="1.5" fill="#263238" stroke="${O}" stroke-width="0.8"/>
    <rect x="101" y="64" width="6" height="10" rx="1" fill="#4FC3F7"/>
    <!-- Belt + gold buckle -->
    <rect x="36" y="106" width="56" height="4" rx="1" fill="#263238" stroke="${O}" stroke-width="0.8"/>
    <rect x="62" y="106" width="4" height="4" rx="1" fill="#FFD54F"/>
    <!-- Dress pants -->
    <path d="M40 110 L38 146 L54 146 L56 110" fill="#1A237E" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 110 L74 146 L90 146 L88 110" fill="#1A237E" stroke="${O}" stroke-width="1.2"/>
    <!-- Dress shoes -->
    <path d="M36 144 L56 144 L56 152 Q46 155 36 152 Z" fill="#263238" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 144 L92 144 L92 152 Q82 155 72 152 Z" fill="#263238" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── Scrum Master ────────────────────────────────────────
  // Energetic, orange polo, arm raised with sticky notes, big grin
  scrum: sprite(`
    <!-- Hair -->
    <path d="M46 24 Q44 6 64 3 Q84 6 82 24 L80 16 Q76 8 64 7 Q52 8 48 16 Z" fill="#5D4037" stroke="${O}" stroke-width="1"/>
    <path d="M46 18 L42 14 L46 20 Z" fill="#5D4037"/>
    <path d="M82 18 L86 14 L82 20 Z" fill="#5D4037"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Excited eyes -->
    ${animeEye(56, 29, "#FF8F00", 1.1)}
    ${animeEye(72, 29, "#FF8F00", 1.1)}
    <!-- Happy brows -->
    <path d="M50 22 Q56 20 61 23" fill="none" stroke="#5D4037" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M67 23 Q72 20 78 22" fill="none" stroke="#5D4037" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 33 L62 36" fill="none" stroke="${Sd}" stroke-width="1" stroke-linecap="round"/>
    <!-- Big open grin -->
    <path d="M56 39 Q64 48 72 39" fill="#fff" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M56 39 Q64 42 72 39" fill="${O}" opacity="0.08"/>
    <!-- Blush -->
    <ellipse cx="48" cy="35" rx="5" ry="2.5" fill="#FFAB91" opacity="0.35"/>
    <ellipse cx="80" cy="35" rx="5" ry="2.5" fill="#FFAB91" opacity="0.35"/>
    <!-- Neck -->
    <path d="M58 46 L58 54 Q64 56 70 54 L70 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Lanyard -->
    <line x1="58" y1="48" x2="56" y2="56" stroke="#4CAF50" stroke-width="1.5"/>
    <line x1="70" y1="48" x2="72" y2="56" stroke="#4CAF50" stroke-width="1.5"/>
    <rect x="54" y="66" width="20" height="10" rx="2" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <text x="56" y="73" fill="#333" font-size="4.5" font-family="sans-serif" font-weight="bold">SCRUM</text>
    <!-- Orange polo -->
    <path d="M36 54 L56 50 Q64 54 72 50 L92 54 L94 110 L34 110 Z" fill="#F57C00" stroke="${O}" stroke-width="1.5"/>
    <!-- Collar -->
    <path d="M54 50 Q64 58 74 50" fill="#E65100" stroke="${O}" stroke-width="1"/>
    <path d="M56 50 L64 56 L72 50" fill="none" stroke="#BF360C" stroke-width="1"/>
    <!-- Left arm UP (energetic!) -->
    <path d="M36 56 L18 40 L14 26 L20 24 L24 38 L38 52" fill="#F57C00" stroke="${O}" stroke-width="1.2"/>
    <circle cx="17" cy="24" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Sticky notes in raised hand -->
    <rect x="6" y="12" width="12" height="12" rx="1" fill="#FFEB3B" stroke="${O}" stroke-width="0.8" transform="rotate(-15 12 18)"/>
    <rect x="10" y="8" width="12" height="12" rx="1" fill="#FF80AB" stroke="${O}" stroke-width="0.8" transform="rotate(5 16 14)"/>
    <rect x="2" y="16" width="12" height="12" rx="1" fill="#80DEEA" stroke="${O}" stroke-width="0.8" transform="rotate(-5 8 22)"/>
    <!-- Right arm — thumbs up -->
    <path d="M92 56 L102 70 L100 86 L94 86 L96 72 L90 60" fill="#F57C00" stroke="${O}" stroke-width="1.2"/>
    <circle cx="100" cy="86" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <path d="M100 82 L100 76" stroke="${S}" stroke-width="3" stroke-linecap="round"/>
    <!-- Pants -->
    <path d="M40 108 L38 146 L54 146 L56 108" fill="#546E7A" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 108 L74 146 L90 146 L88 108" fill="#546E7A" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M36 144 L56 144 L56 152 Q46 155 36 152 Z" fill="#795548" stroke="${O}" stroke-width="1.2"/>
    <path d="M72 144 L92 144 L92 152 Q82 155 72 152 Z" fill="#795548" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── Middle Manager ──────────────────────────────────────
  // Balding, brown suit, red tie, coffee mug, tired expression, wider build
  manager: sprite(`
    <defs>
      <linearGradient id="mgr-suit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#795548"/>
        <stop offset="100%" stop-color="#5D4037"/>
      </linearGradient>
    </defs>
    <!-- Head (slightly wider) -->
    <ellipse cx="64" cy="28" rx="20" ry="21" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Balding hair — sides only -->
    <path d="M44 26 Q44 18 48 14 L48 26 Z" fill="#90A4AE" stroke="${O}" stroke-width="0.8"/>
    <path d="M84 26 Q84 18 80 14 L80 26 Z" fill="#90A4AE" stroke="${O}" stroke-width="0.8"/>
    <path d="M52 12 Q64 8 76 12" fill="none" stroke="#B0BEC5" stroke-width="1.2"/>
    <!-- Tired eyes -->
    ${animeEye(56, 30, "#795548", 0.9)}
    ${animeEye(72, 30, "#795548", 0.9)}
    <!-- Heavy lids -->
    <path d="M50 27 Q56 26 62 28" fill="${S}" stroke="${O}" stroke-width="1"/>
    <path d="M66 28 Q72 26 78 27" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Eye bags -->
    <path d="M52 34 Q56 36 60 34" fill="none" stroke="${Sd}" stroke-width="0.8"/>
    <path d="M68 34 Q72 36 76 34" fill="none" stroke="${Sd}" stroke-width="0.8"/>
    <!-- Tired brows -->
    <path d="M50 24 Q56 23 62 25" fill="none" stroke="#90A4AE" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M66 25 Q72 23 78 24" fill="none" stroke="#90A4AE" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 34 L62 38" fill="none" stroke="${Sd}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Flat tired mouth -->
    <line x1="58" y1="42" x2="70" y2="42" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Neck (wider) -->
    <path d="M56 47 L56 54 Q64 56 72 54 L72 47" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Brown suit (wider build) -->
    <path d="M28 56 L52 50 Q64 54 76 50 L100 56 L102 112 L26 112 Z" fill="url(#mgr-suit)" stroke="${O}" stroke-width="1.5"/>
    <!-- Lapels -->
    <path d="M52 50 L64 70 L56 70 L36 56 Z" fill="#5D4037" stroke="${O}" stroke-width="0.8"/>
    <path d="M76 50 L64 70 L72 70 L92 56 Z" fill="#5D4037" stroke="${O}" stroke-width="0.8"/>
    <!-- Shirt + red tie -->
    <rect x="60" y="56" width="8" height="52" fill="#ECEFF1"/>
    <path d="M62 56 L64 60 L66 56 L65 94 L64 96 L63 94 Z" fill="#C62828"/>
    <path d="M62 56 L64 60 L66 56" fill="#E53935"/>
    <!-- Left arm — coffee mug -->
    <path d="M28 58 L16 76 L18 96 L24 96 L24 80 L30 62" fill="url(#mgr-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="20" cy="96" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Coffee mug -->
    <rect x="8" y="84" width="14" height="18" rx="3" fill="#fff" stroke="${O}" stroke-width="1"/>
    <rect x="8" y="84" width="14" height="6" rx="3" fill="#6D4C41" stroke="${O}" stroke-width="0.8"/>
    <path d="M22 90 Q27 94 22 98" fill="none" stroke="${O}" stroke-width="1.2"/>
    <text x="11" y="100" fill="#E53935" font-size="4" font-family="sans-serif" font-weight="bold">#1</text>
    <!-- Steam -->
    <path d="M12 82 Q14 77 11 74" fill="none" stroke="#bbb" stroke-width="0.8" opacity="0.5"/>
    <path d="M17 81 Q19 76 16 73" fill="none" stroke="#bbb" stroke-width="0.8" opacity="0.5"/>
    <!-- Right arm — at side -->
    <path d="M100 58 L108 74 L106 92 L100 92 L102 76 L98 62" fill="url(#mgr-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="103" cy="92" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Belt -->
    <rect x="30" y="108" width="68" height="4" rx="1" fill="#3E2723" stroke="${O}" stroke-width="0.8"/>
    <rect x="62" y="108" width="4" height="4" rx="1" fill="#B0BEC5"/>
    <!-- Wider pants -->
    <path d="M36 112 L34 146 L52 146 L54 112" fill="#3E2723" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 112 L76 146 L94 146 L92 112" fill="#3E2723" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M32 144 L54 144 L54 152 Q44 155 32 152 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 144 L96 144 L96 152 Q86 155 74 152 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── VP of Synergy ───────────────────────────────────────
  // Charcoal power suit, gold accents, broad shoulders, pointing, stern
  vp: sprite(`
    <defs>
      <linearGradient id="vp-suit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#455A64"/>
        <stop offset="100%" stop-color="#37474F"/>
      </linearGradient>
    </defs>
    <!-- Hair — slick combover -->
    <path d="M46 24 Q46 4 64 2 Q82 4 82 24 L80 14 Q76 6 64 5 Q52 6 48 14 Z" fill="#263238" stroke="${O}" stroke-width="1"/>
    <path d="M46 16 Q48 8 64 5 L56 20 Z" fill="#37474F"/>
    <!-- Head -->
    <ellipse cx="64" cy="28" rx="18" ry="20" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Stern eyes -->
    ${animeEye(56, 30, "#546E7A")}
    ${animeEye(72, 30, "#546E7A")}
    <!-- Stern angled brows -->
    <path d="M49 22 Q55 20 62 23" fill="none" stroke="#263238" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M66 23 Q73 20 79 22" fill="none" stroke="#263238" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 34 L62 38" fill="none" stroke="${Sd}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Thin confident mouth -->
    <path d="M58 41 Q64 43 70 41" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Neck -->
    <path d="M56 46 L56 54 Q64 56 72 54 L72 46" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Charcoal power suit — broad -->
    <path d="M24 56 L52 50 Q64 54 76 50 L104 56 L106 112 L22 112 Z" fill="url(#vp-suit)" stroke="${O}" stroke-width="1.5"/>
    <!-- Shoulder pads -->
    <path d="M24 56 L32 50 L42 56 L32 60 Z" fill="#546E7A" stroke="${O}" stroke-width="0.8"/>
    <path d="M104 56 L96 50 L86 56 L96 60 Z" fill="#546E7A" stroke="${O}" stroke-width="0.8"/>
    <!-- Lapels -->
    <path d="M52 50 L64 70 L56 70 L34 56 Z" fill="#37474F" stroke="${O}" stroke-width="0.8"/>
    <path d="M76 50 L64 70 L72 70 L94 56 Z" fill="#37474F" stroke="${O}" stroke-width="0.8"/>
    <!-- Shirt + gold tie -->
    <rect x="60" y="56" width="8" height="52" fill="#ECEFF1"/>
    <path d="M62 56 L64 60 L66 56 L65 94 L64 96 L63 94 Z" fill="#FFD54F"/>
    <path d="M62 56 L64 60 L66 56" fill="#FFE082"/>
    <!-- Gold tie pin -->
    <rect x="60" y="72" width="8" height="2" rx="0.5" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <!-- Left arm -->
    <path d="M24 58 L12 76 L14 96 L20 96 L20 80 L26 62" fill="url(#vp-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="16" cy="96" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — pointing forward -->
    <path d="M104 58 L114 68 L112 84 L106 84 L108 72 L102 62" fill="url(#vp-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="112" cy="84" r="4" fill="${S}" stroke="${O}" stroke-width="1"/>
    <line x1="114" y1="82" x2="122" y2="76" stroke="${S}" stroke-width="3" stroke-linecap="round"/>
    <!-- Gold watch -->
    <rect x="108" y="80" width="5" height="3.5" rx="1" fill="#FFD54F" stroke="${O}" stroke-width="0.5"/>
    <!-- Gold cufflinks -->
    <circle cx="22" cy="88" r="1.5" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <circle cx="106" cy="78" r="1.5" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <!-- Belt -->
    <rect x="26" y="108" width="76" height="4" rx="1" fill="#263238" stroke="${O}" stroke-width="0.8"/>
    <rect x="62" y="108" width="4" height="4" rx="1" fill="#FFD54F"/>
    <!-- Pants -->
    <path d="M34 112 L32 146 L52 146 L54 112" fill="#263238" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 112 L76 146 L96 146 L94 112" fill="#263238" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M30 144 L54 144 L54 152 Q42 155 30 152 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
    <path d="M74 144 L98 144 L98 152 Q86 155 74 152 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
  `),

  // ── C-Suite Boss ────────────────────────────────────────
  // Crown, black power suit, gold everywhere, imposing, broadest build
  boss: sprite(`
    <defs>
      <linearGradient id="boss-suit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A1A2E"/>
        <stop offset="100%" stop-color="#0D0D1A"/>
      </linearGradient>
      <linearGradient id="boss-crown" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA000"/>
      </linearGradient>
    </defs>
    <!-- Crown -->
    <path d="M44 10 L48 -4 L54 8 L58 -6 L64 8 L70 -6 L74 8 L80 -4 L84 10 Z" fill="url(#boss-crown)" stroke="#B8860B" stroke-width="1"/>
    <rect x="44" y="8" width="40" height="5" rx="1" fill="url(#boss-crown)" stroke="#B8860B" stroke-width="0.8"/>
    <!-- Crown jewels -->
    <circle cx="54" cy="10" r="2" fill="#E53935" stroke="${O}" stroke-width="0.5"/>
    <circle cx="64" cy="10" r="2.5" fill="#2196F3" stroke="${O}" stroke-width="0.5"/>
    <circle cx="74" cy="10" r="2" fill="#4CAF50" stroke="${O}" stroke-width="0.5"/>
    <!-- Hair -->
    <path d="M44 26 Q44 10 64 8 Q84 10 84 26 L82 18 Q78 12 64 11 Q50 12 46 18 Z" fill="#1A1A2E" stroke="${O}" stroke-width="1"/>
    <!-- Head -->
    <ellipse cx="64" cy="30" rx="20" ry="21" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Imposing eyes (dark red iris) -->
    ${animeEye(56, 31, "#B71C1C", 1.1)}
    ${animeEye(72, 31, "#B71C1C", 1.1)}
    <!-- Thick commanding brows -->
    <path d="M48 24 Q54 21 62 24" fill="none" stroke="#1A1A2E" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M66 24 Q74 21 80 24" fill="none" stroke="#1A1A2E" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Nose -->
    <path d="M64 36 L62 40" fill="none" stroke="${Sd}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Smug power grin -->
    <path d="M56 44 Q64 49 72 44" fill="#fff" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Neck (thick) -->
    <path d="M54 49 L54 56 Q64 58 74 56 L74 49" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Black power suit — broadest -->
    <path d="M18 58 L50 52 Q64 56 78 52 L110 58 L112 114 L16 114 Z" fill="url(#boss-suit)" stroke="${O}" stroke-width="1.5"/>
    <!-- Massive shoulder pads -->
    <path d="M18 58 L28 52 L38 58 L28 62 Z" fill="#2D2D3D" stroke="${O}" stroke-width="0.8"/>
    <path d="M110 58 L100 52 L90 58 L100 62 Z" fill="#2D2D3D" stroke="${O}" stroke-width="0.8"/>
    <!-- Lapels -->
    <path d="M50 52 L64 74 L56 74 L28 58 Z" fill="#12121F" stroke="${O}" stroke-width="0.8"/>
    <path d="M78 52 L64 74 L72 74 L100 58 Z" fill="#12121F" stroke="${O}" stroke-width="0.8"/>
    <!-- Shirt + red power tie -->
    <rect x="60" y="58" width="8" height="52" fill="#ECEFF1"/>
    <path d="M62 58 L64 62 L66 58 L65 96 L64 98 L63 96 Z" fill="#B71C1C"/>
    <path d="M62 58 L64 62 L66 58" fill="#C62828"/>
    <!-- Gold tie clip -->
    <rect x="60" y="74" width="8" height="2.5" rx="0.5" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <!-- Gold pocket hanky -->
    <path d="M30 62 L38 60 L40 68 L32 70 Z" fill="#FFD700" stroke="${O}" stroke-width="0.5"/>
    <!-- Left arm -->
    <path d="M18 60 L6 80 L8 100 L14 100 L14 84 L20 64" fill="url(#boss-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="10" cy="100" r="4.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — power fist -->
    <path d="M110 60 L120 76 L118 96 L112 96 L114 80 L108 64" fill="url(#boss-suit)" stroke="${O}" stroke-width="1.2"/>
    <circle cx="118" cy="96" r="5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Gold rings -->
    <circle cx="120" cy="94" r="1.5" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <circle cx="116" cy="98" r="1.5" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <!-- Gold watch -->
    <rect x="114" y="92" width="5" height="3.5" rx="1" fill="#FFD700" stroke="${O}" stroke-width="0.5"/>
    <!-- Belt + gold buckle -->
    <rect x="20" y="110" width="88" height="4" rx="1" fill="#1A1A2E" stroke="${O}" stroke-width="0.8"/>
    <rect x="62" y="110" width="4" height="4" rx="1" fill="#FFD700"/>
    <!-- Pants -->
    <path d="M30 114 L28 148 L50 148 L52 114" fill="#0D0D1A" stroke="${O}" stroke-width="1.2"/>
    <path d="M76 114 L78 148 L100 148 L98 114" fill="#0D0D1A" stroke="${O}" stroke-width="1.2"/>
    <!-- Shoes -->
    <path d="M26 146 L52 146 L52 154 Q40 158 26 154 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
    <path d="M76 146 L102 146 L102 154 Q90 158 76 154 Z" fill="#1a1a2e" stroke="${O}" stroke-width="1.2"/>
  `),
};

// Build the sprite URL map
export function buildSpriteUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [id, svg] of Object.entries(SVG_SPRITES)) {
    urls[id] = svgToDataUrl(svg);
  }
  return urls;
}
