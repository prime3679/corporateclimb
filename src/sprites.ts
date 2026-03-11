// ─── SVG CHARACTER SPRITES ──────────────────────────────────
// Pokémon chibi trainer-style: big heads, bold outlines, flat colors.
// ViewBox 64x64 for crisp rendering at battle sizes.

function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

const O = "#1a1a2e"; // outline color
const S = "#FCCCA0"; // skin
const Sd = "#E8B48A"; // skin shadow

// Wrap every sprite in consistent SVG boilerplate
function sprite(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${inner}</svg>`;
}

const SVG_SPRITES: Record<string, string> = {

  // ── Product Manager ─────────────────────────────────────
  // Neat side-part hair, blue button-up, clipboard
  pm: sprite(`
    <!-- Hair back -->
    <ellipse cx="32" cy="16" rx="14" ry="12" fill="#3B2314"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Hair front — side part -->
    <path d="M20 16 Q20 6 32 6 Q44 6 44 16 L42 14 Q42 8 32 8 Q22 8 21 14 Z" fill="#3B2314" stroke="${O}" stroke-width="1"/>
    <path d="M20 14 Q20 10 26 10 L24 16 Z" fill="#3B2314"/>
    <!-- Eyes -->
    <circle cx="27" cy="19" r="2.5" fill="${O}"/>
    <circle cx="37" cy="19" r="2.5" fill="${O}"/>
    <circle cx="27.8" cy="18.2" r="1" fill="#fff"/>
    <circle cx="37.8" cy="18.2" r="1" fill="#fff"/>
    <!-- Mouth -->
    <path d="M29 24 Q32 26 35 24" fill="none" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck -->
    <rect x="29" y="28" width="6" height="4" fill="${S}"/>
    <!-- Body — blue button-up -->
    <path d="M20 32 L28 30 L36 30 L44 32 L46 50 L18 50 Z" fill="#3498DB" stroke="${O}" stroke-width="1.5"/>
    <!-- Collar -->
    <path d="M26 30 L32 34 L38 30" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <!-- Buttons -->
    <circle cx="32" cy="37" r="0.8" fill="#fff"/>
    <circle cx="32" cy="41" r="0.8" fill="#fff"/>
    <circle cx="32" cy="45" r="0.8" fill="#fff"/>
    <!-- Left arm + clipboard -->
    <path d="M20 33 L14 40 L16 48 L19 47 L18 41 L20 36" fill="#3498DB" stroke="${O}" stroke-width="1"/>
    <rect x="10" y="40" width="8" height="10" rx="1" fill="#8D6E63" stroke="${O}" stroke-width="1"/>
    <rect x="11" y="41" width="6" height="8" rx="0.5" fill="#fff"/>
    <line x1="12" y1="43" x2="16" y2="43" stroke="#ccc" stroke-width="0.5"/>
    <line x1="12" y1="45" x2="16" y2="45" stroke="#ccc" stroke-width="0.5"/>
    <line x1="12" y1="47" x2="15" y2="47" stroke="#ccc" stroke-width="0.5"/>
    <!-- Right arm -->
    <path d="M44 33 L50 40 L48 46 L45 45 L47 41 L44 36" fill="#3498DB" stroke="${O}" stroke-width="1"/>
    <circle cx="49" cy="46" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Legs -->
    <rect x="24" y="49" width="7" height="10" rx="2" fill="#2C3E50" stroke="${O}" stroke-width="1"/>
    <rect x="33" y="49" width="7" height="10" rx="2" fill="#2C3E50" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="27" cy="60" rx="5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
    <ellipse cx="37" cy="60" rx="5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
  `),

  // ── Senior Engineer ─────────────────────────────────────
  // Messy hair, hoodie, headphones, laptop glow
  eng: sprite(`
    <!-- Headphone band -->
    <path d="M19 14 Q19 4 32 4 Q45 4 45 14" fill="none" stroke="#555" stroke-width="3" stroke-linecap="round"/>
    <rect x="16" y="12" width="5" height="7" rx="2" fill="#444" stroke="${O}" stroke-width="1"/>
    <rect x="43" y="12" width="5" height="7" rx="2" fill="#444" stroke="${O}" stroke-width="1"/>
    <!-- Hair back (messy) -->
    <ellipse cx="32" cy="15" rx="14" ry="12" fill="#5D4037"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Messy hair -->
    <path d="M20 15 Q18 5 32 4 Q46 5 44 15 L42 12 Q40 6 32 6 Q24 6 22 12 Z" fill="#5D4037" stroke="${O}" stroke-width="1"/>
    <path d="M22 10 L19 8 L22 12 Z" fill="#5D4037"/>
    <path d="M42 10 L45 7 L42 12 Z" fill="#5D4037"/>
    <path d="M34 6 L36 3 L37 7 Z" fill="#5D4037"/>
    <!-- Eyes (slightly tired) -->
    <ellipse cx="27" cy="19" rx="2.5" ry="2" fill="${O}"/>
    <ellipse cx="37" cy="19" rx="2.5" ry="2" fill="${O}"/>
    <circle cx="27.8" cy="18.4" r="0.9" fill="#fff"/>
    <circle cx="37.8" cy="18.4" r="0.9" fill="#fff"/>
    <!-- Flat mouth -->
    <line x1="29" y1="24" x2="35" y2="24" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck -->
    <rect x="29" y="28" width="6" height="4" fill="${S}"/>
    <!-- Body — dark hoodie -->
    <path d="M18 32 L28 30 L36 30 L46 32 L48 52 L16 52 Z" fill="#333" stroke="${O}" stroke-width="1.5"/>
    <!-- Hood -->
    <path d="M22 32 L28 29 L36 29 L42 32 L40 34 L32 35 L24 34 Z" fill="#444" stroke="${O}" stroke-width="0.8"/>
    <!-- Hoodie pocket -->
    <rect x="24" y="42" width="16" height="6" rx="2" fill="none" stroke="#555" stroke-width="0.8"/>
    <!-- Hoodie strings -->
    <line x1="29" y1="33" x2="28" y2="40" stroke="#666" stroke-width="0.6"/>
    <line x1="35" y1="33" x2="36" y2="40" stroke="#666" stroke-width="0.6"/>
    <!-- Left arm + laptop -->
    <path d="M18 34 L12 42 L14 48 L17 47 L16 43 L18 37" fill="#333" stroke="${O}" stroke-width="1"/>
    <rect x="8" y="44" width="10" height="6" rx="1" fill="#263238" stroke="${O}" stroke-width="0.8"/>
    <rect x="9" y="45" width="8" height="4" rx="0.5" fill="#0D1117"/>
    <text x="11" y="48" fill="#00FF41" font-size="3" font-family="monospace">&gt;_</text>
    <!-- Right arm -->
    <path d="M46 34 L52 42 L50 47 L47 46 L49 42 L46 37" fill="#333" stroke="${O}" stroke-width="1"/>
    <circle cx="51" cy="47" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Legs — jeans -->
    <rect x="23" y="51" width="7" height="9" rx="2" fill="#4A6FA5" stroke="${O}" stroke-width="1"/>
    <rect x="34" y="51" width="7" height="9" rx="2" fill="#4A6FA5" stroke="${O}" stroke-width="1"/>
    <!-- Sneakers -->
    <ellipse cx="26" cy="61" rx="5" ry="2.5" fill="#333" stroke="${O}" stroke-width="1"/>
    <ellipse cx="38" cy="61" rx="5" ry="2.5" fill="#333" stroke="${O}" stroke-width="1"/>
  `),

  // ── UX Designer ─────────────────────────────────────────
  // Beret, colorful top, scarf, stylus
  design: sprite(`
    <!-- Beret -->
    <ellipse cx="32" cy="9" rx="14" ry="4" fill="#E74C3C" stroke="${O}" stroke-width="1"/>
    <path d="M18 10 Q18 2 32 0 Q46 2 46 10" fill="#E74C3C" stroke="${O}" stroke-width="1"/>
    <circle cx="32" cy="2" r="2" fill="#C0392B" stroke="${O}" stroke-width="0.5"/>
    <!-- Hair -->
    <path d="M20 16 Q20 8 32 8 Q44 8 44 16 L44 12 Q42 10 32 10 Q22 10 20 12 Z" fill="#C0392B" stroke="${O}" stroke-width="0.8"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="10" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Eyes — big & expressive -->
    <circle cx="27" cy="18" r="2.5" fill="${O}"/>
    <circle cx="37" cy="18" r="2.5" fill="${O}"/>
    <circle cx="27.8" cy="17.4" r="1" fill="#fff"/>
    <circle cx="37.8" cy="17.4" r="1" fill="#fff"/>
    <!-- Eyelashes -->
    <line x1="24" y1="16" x2="25" y2="17" stroke="${O}" stroke-width="0.8"/>
    <line x1="40" y1="16" x2="39" y2="17" stroke="${O}" stroke-width="0.8"/>
    <!-- Smile -->
    <path d="M29 23 Q32 26 35 23" fill="none" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Earring -->
    <circle cx="44" cy="20" r="1.2" fill="#F1C40F" stroke="${O}" stroke-width="0.5"/>
    <!-- Neck -->
    <rect x="29" y="27" width="6" height="4" fill="${S}"/>
    <!-- Scarf -->
    <path d="M25 30 Q32 34 39 30" fill="#F1C40F" stroke="${O}" stroke-width="0.8"/>
    <path d="M35 31 L37 42 L34 42 Z" fill="#F1C40F" stroke="${O}" stroke-width="0.5"/>
    <!-- Body — purple wrap top -->
    <path d="M20 32 L28 30 L36 30 L44 32 L46 48 L18 48 Z" fill="#9B59B6" stroke="${O}" stroke-width="1.5"/>
    <path d="M20 32 L28 30 L32 40 L18 40 Z" fill="#8E44AD"/>
    <path d="M44 32 L36 30 L32 40 L46 40 Z" fill="#8E44AD"/>
    <!-- Left arm -->
    <path d="M20 34 L14 42 L16 47 L19 46 L18 42 L20 37" fill="#9B59B6" stroke="${O}" stroke-width="1"/>
    <circle cx="16" cy="47" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm + stylus -->
    <path d="M44 34 L50 42 L48 48 L45 47 L47 42 L44 37" fill="#9B59B6" stroke="${O}" stroke-width="1"/>
    <circle cx="49" cy="48" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <line x1="50" y1="45" x2="54" y2="36" stroke="#F1C40F" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Skirt -->
    <path d="M20 47 L17 58 L47 58 L44 47 Z" fill="#2C3E50" stroke="${O}" stroke-width="1"/>
    <!-- Legs -->
    <rect x="24" y="56" width="6" height="4" rx="2" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <rect x="34" y="56" width="6" height="4" rx="2" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <!-- Shoes -->
    <ellipse cx="27" cy="61" rx="4.5" ry="2.5" fill="#E74C3C" stroke="${O}" stroke-width="1"/>
    <ellipse cx="37" cy="61" rx="4.5" ry="2.5" fill="#E74C3C" stroke="${O}" stroke-width="1"/>
  `),

  // ── Intern ──────────────────────────────────────────────
  // Young, wide eyes, green polo, lanyard, coffee cup
  intern: sprite(`
    <!-- Hair -->
    <path d="M20 16 Q20 5 32 4 Q44 5 44 16 L42 12 Q40 7 32 7 Q24 7 22 12 Z" fill="#F5A623" stroke="${O}" stroke-width="1"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Big nervous eyes -->
    <circle cx="26" cy="18" r="3" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <circle cx="38" cy="18" r="3" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <circle cx="26.5" cy="18.5" r="1.8" fill="${O}"/>
    <circle cx="38.5" cy="18.5" r="1.8" fill="${O}"/>
    <circle cx="27" cy="17.8" r="0.7" fill="#fff"/>
    <circle cx="39" cy="17.8" r="0.7" fill="#fff"/>
    <!-- Sweat drop -->
    <path d="M45 14 Q46 17 44 19" fill="#81D4FA" stroke="#4FC3F7" stroke-width="0.5"/>
    <!-- Nervous mouth -->
    <path d="M29 24 Q32 23 35 24" fill="none" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck -->
    <rect x="29" y="28" width="6" height="4" fill="${S}"/>
    <!-- Lanyard -->
    <path d="M28 28 L26 32 L26 42 L38 42 L38 32 L36 28" fill="none" stroke="#E53935" stroke-width="1.2"/>
    <rect x="28" y="40" width="8" height="5" rx="1" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <rect x="29" y="41" width="6" height="1.5" rx="0.5" fill="#E53935"/>
    <!-- Body — green polo -->
    <path d="M20 32 L28 30 L36 30 L44 32 L46 50 L18 50 Z" fill="#27AE60" stroke="${O}" stroke-width="1.5"/>
    <!-- Collar -->
    <path d="M27 30 L32 34 L37 30" fill="#1E8449" stroke="${O}" stroke-width="0.8"/>
    <!-- Left arm + coffee -->
    <path d="M20 34 L14 42 L16 48 L19 47 L17 43 L20 37" fill="#27AE60" stroke="${O}" stroke-width="1"/>
    <rect x="10" y="42" width="7" height="8" rx="2" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <rect x="10" y="42" width="7" height="3" rx="2" fill="#795548" stroke="${O}" stroke-width="0.5"/>
    <path d="M17 44 Q20 46 17 48" fill="none" stroke="${O}" stroke-width="0.8"/>
    <!-- Steam -->
    <path d="M12 40 Q13 38 11 36" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.6"/>
    <path d="M14 39 Q15 37 13 35" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.6"/>
    <!-- Right arm -->
    <path d="M44 34 L50 42 L48 46 L45 45 L47 42 L44 37" fill="#27AE60" stroke="${O}" stroke-width="1"/>
    <circle cx="49" cy="46" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Legs -->
    <rect x="24" y="49" width="7" height="9" rx="2" fill="#4A6FA5" stroke="${O}" stroke-width="1"/>
    <rect x="33" y="49" width="7" height="9" rx="2" fill="#4A6FA5" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="27" cy="59" rx="5" ry="2.5" fill="#795548" stroke="${O}" stroke-width="1"/>
    <ellipse cx="37" cy="59" rx="5" ry="2.5" fill="#795548" stroke="${O}" stroke-width="1"/>
  `),

  // ── Recruiter ───────────────────────────────────────────
  // Slick hair, navy suit, phone, confident
  recruiter: sprite(`
    <!-- Hair — slicked back -->
    <path d="M20 16 Q20 4 32 3 Q44 4 44 16 L42 10 Q40 6 32 5 Q24 6 22 10 Z" fill="#1A1A2E" stroke="${O}" stroke-width="1"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Hair shine -->
    <path d="M26 8 Q28 6 30 8" fill="none" stroke="#444" stroke-width="0.5" opacity="0.5"/>
    <!-- Eyes — confident -->
    <circle cx="27" cy="19" r="2.5" fill="${O}"/>
    <circle cx="37" cy="19" r="2.5" fill="${O}"/>
    <circle cx="27.8" cy="18.2" r="1" fill="#fff"/>
    <circle cx="37.8" cy="18.2" r="1" fill="#fff"/>
    <!-- Smirk -->
    <path d="M29 24 Q33 27 36 24" fill="none" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck -->
    <rect x="29" y="28" width="6" height="4" fill="${S}"/>
    <!-- Body — navy suit -->
    <path d="M18 32 L28 30 L36 30 L46 32 L48 52 L16 52 Z" fill="#1A237E" stroke="${O}" stroke-width="1.5"/>
    <!-- Lapels -->
    <path d="M26 30 L32 40 L28 40 L22 33 Z" fill="#0D1557" stroke="${O}" stroke-width="0.5"/>
    <path d="M38 30 L32 40 L36 40 L42 33 Z" fill="#0D1557" stroke="${O}" stroke-width="0.5"/>
    <!-- Shirt + red tie -->
    <rect x="30" y="32" width="4" height="18" fill="#ECEFF1"/>
    <path d="M31 32 L32 34 L33 32 L32.5 44 L32 45 L31.5 44 Z" fill="#C62828"/>
    <!-- Pocket square -->
    <path d="M21 34 L24 33 L25 36 L22 37 Z" fill="#C62828"/>
    <!-- Left arm -->
    <path d="M18 34 L12 42 L14 48 L17 47 L15 43 L18 37" fill="#1A237E" stroke="${O}" stroke-width="1"/>
    <circle cx="14" cy="48" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm + phone -->
    <path d="M46 34 L52 40 L52 48 L49 48 L49 42 L46 37" fill="#1A237E" stroke="${O}" stroke-width="1"/>
    <circle cx="52" cy="42" r="2" fill="${S}" stroke="${O}" stroke-width="0.8"/>
    <rect x="49" y="36" width="4" height="7" rx="0.8" fill="#263238" stroke="${O}" stroke-width="0.5"/>
    <rect x="49.5" y="37" width="3" height="5" rx="0.4" fill="#4FC3F7"/>
    <!-- Belt -->
    <rect x="18" y="49" width="28" height="3" fill="#263238" stroke="${O}" stroke-width="0.5"/>
    <rect x="31" y="49" width="3" height="3" rx="0.5" fill="#FFD54F"/>
    <!-- Legs -->
    <rect x="23" y="51" width="7" height="9" rx="2" fill="#1A237E" stroke="${O}" stroke-width="1"/>
    <rect x="34" y="51" width="7" height="9" rx="2" fill="#1A237E" stroke="${O}" stroke-width="1"/>
    <!-- Dress shoes -->
    <ellipse cx="26" cy="61" rx="5" ry="2.5" fill="#263238" stroke="${O}" stroke-width="1"/>
    <ellipse cx="38" cy="61" rx="5" ry="2.5" fill="#263238" stroke="${O}" stroke-width="1"/>
  `),

  // ── Scrum Master ────────────────────────────────────────
  // Energetic, orange polo, lanyard, sticky notes, big smile
  scrum: sprite(`
    <!-- Hair -->
    <path d="M20 16 Q20 5 32 4 Q44 5 44 16 L42 12 Q40 7 32 7 Q24 7 22 12 Z" fill="#6D4C41" stroke="${O}" stroke-width="1"/>
    <path d="M20 14 L18 11 L21 13 Z" fill="#6D4C41"/>
    <path d="M44 14 L46 11 L43 13 Z" fill="#6D4C41"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Excited eyes -->
    <circle cx="27" cy="18" r="2.5" fill="${O}"/>
    <circle cx="37" cy="18" r="2.5" fill="${O}"/>
    <circle cx="27.8" cy="17.2" r="1" fill="#fff"/>
    <circle cx="37.8" cy="17.2" r="1" fill="#fff"/>
    <!-- Big smile -->
    <path d="M27 23 Q32 28 37 23" fill="#fff" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Blush -->
    <ellipse cx="22" cy="21" rx="2.5" ry="1.5" fill="#FFAB91" opacity="0.4"/>
    <ellipse cx="42" cy="21" rx="2.5" ry="1.5" fill="#FFAB91" opacity="0.4"/>
    <!-- Neck -->
    <rect x="29" y="28" width="6" height="4" fill="${S}"/>
    <!-- Lanyard + badge -->
    <path d="M28 28 L27 32 L27 38" fill="none" stroke="#4CAF50" stroke-width="1"/>
    <path d="M36 28 L37 32 L37 38" fill="none" stroke="#4CAF50" stroke-width="1"/>
    <rect x="26" y="37" width="12" height="5" rx="1" fill="#fff" stroke="${O}" stroke-width="0.5"/>
    <text x="28" y="41" fill="#333" font-size="3" font-family="sans-serif">SCRUM</text>
    <!-- Body — orange polo -->
    <path d="M20 32 L28 30 L36 30 L44 32 L46 50 L18 50 Z" fill="#E67E22" stroke="${O}" stroke-width="1.5"/>
    <!-- Collar -->
    <path d="M27 30 L32 34 L37 30" fill="#D35400" stroke="${O}" stroke-width="0.8"/>
    <!-- Left arm UP (energetic!) -->
    <path d="M20 34 L10 26 L8 20 L12 19 L13 25 L20 32" fill="#E67E22" stroke="${O}" stroke-width="1"/>
    <circle cx="10" cy="19" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Sticky notes in raised hand -->
    <rect x="5" y="12" width="6" height="6" rx="0.5" fill="#FFEB3B" stroke="${O}" stroke-width="0.5" transform="rotate(-10 8 15)"/>
    <rect x="7" y="10" width="6" height="6" rx="0.5" fill="#FF80AB" stroke="${O}" stroke-width="0.5" transform="rotate(5 10 13)"/>
    <rect x="3" y="14" width="6" height="6" rx="0.5" fill="#80DEEA" stroke="${O}" stroke-width="0.5" transform="rotate(-5 6 17)"/>
    <!-- Right arm -->
    <path d="M44 34 L50 42 L48 47 L45 46 L47 42 L44 37" fill="#E67E22" stroke="${O}" stroke-width="1"/>
    <circle cx="49" cy="47" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Legs -->
    <rect x="24" y="49" width="7" height="9" rx="2" fill="#546E7A" stroke="${O}" stroke-width="1"/>
    <rect x="33" y="49" width="7" height="9" rx="2" fill="#546E7A" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="27" cy="59" rx="5" ry="2.5" fill="#795548" stroke="${O}" stroke-width="1"/>
    <ellipse cx="37" cy="59" rx="5" ry="2.5" fill="#795548" stroke="${O}" stroke-width="1"/>
  `),

  // ── Middle Manager ──────────────────────────────────────
  // Balding, wider, brown suit, tie, coffee mug
  manager: sprite(`
    <!-- Head (wider, balding) -->
    <ellipse cx="32" cy="18" rx="13" ry="12" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Balding hair — just sides -->
    <path d="M19 18 Q19 12 22 10 L22 18 Z" fill="#90A4AE" stroke="${O}" stroke-width="0.5"/>
    <path d="M45 18 Q45 12 42 10 L42 18 Z" fill="#90A4AE" stroke="${O}" stroke-width="0.5"/>
    <path d="M26 8 Q32 6 38 8" fill="none" stroke="#90A4AE" stroke-width="1"/>
    <!-- Tired eyes -->
    <ellipse cx="27" cy="19" rx="2.5" ry="2" fill="${O}"/>
    <ellipse cx="37" cy="19" rx="2.5" ry="2" fill="${O}"/>
    <circle cx="27.7" cy="18.5" r="0.8" fill="#fff"/>
    <circle cx="37.7" cy="18.5" r="0.8" fill="#fff"/>
    <!-- Eye bags -->
    <path d="M24 22 Q27 23 30 22" fill="none" stroke="${Sd}" stroke-width="0.6"/>
    <path d="M34 22 Q37 23 40 22" fill="none" stroke="${Sd}" stroke-width="0.6"/>
    <!-- Flat mouth -->
    <line x1="29" y1="25" x2="35" y2="25" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck (wider) -->
    <rect x="28" y="29" width="8" height="4" fill="${S}"/>
    <!-- Body — brown suit (wider) -->
    <path d="M16 34 L26 30 L38 30 L48 34 L50 54 L14 54 Z" fill="#6D4C41" stroke="${O}" stroke-width="1.5"/>
    <!-- Lapels -->
    <path d="M26 30 L32 42 L28 42 L20 34 Z" fill="#5D4037" stroke="${O}" stroke-width="0.5"/>
    <path d="M38 30 L32 42 L36 42 L44 34 Z" fill="#5D4037" stroke="${O}" stroke-width="0.5"/>
    <!-- Shirt + red tie -->
    <rect x="30" y="34" width="4" height="18" fill="#ECEFF1"/>
    <path d="M31 34 L32 36 L33 34 L32.5 46 L32 47 L31.5 46 Z" fill="#C62828"/>
    <!-- Left arm + coffee mug -->
    <path d="M16 36 L10 44 L12 50 L15 49 L14 45 L16 39" fill="#6D4C41" stroke="${O}" stroke-width="1"/>
    <rect x="6" y="44" width="8" height="9" rx="2" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <rect x="6" y="44" width="8" height="3" rx="2" fill="#795548" stroke="${O}" stroke-width="0.5"/>
    <path d="M14 47 Q17 49 14 51" fill="none" stroke="${O}" stroke-width="0.8"/>
    <text x="8" y="52" fill="#E53935" font-size="3" font-family="sans-serif">#1</text>
    <!-- Steam -->
    <path d="M9 42 Q10 40 8 38" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.5"/>
    <path d="M12 41 Q13 39 11 37" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.5"/>
    <!-- Right arm -->
    <path d="M48 36 L54 44 L52 50 L49 49 L51 44 L48 39" fill="#6D4C41" stroke="${O}" stroke-width="1"/>
    <circle cx="53" cy="50" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Belt -->
    <rect x="16" y="51" width="32" height="3" fill="#3E2723" stroke="${O}" stroke-width="0.5"/>
    <rect x="31" y="51" width="3" height="3" rx="0.5" fill="#B0BEC5"/>
    <!-- Legs (wider) -->
    <rect x="22" y="53" width="8" height="8" rx="2" fill="#3E2723" stroke="${O}" stroke-width="1"/>
    <rect x="34" y="53" width="8" height="8" rx="2" fill="#3E2723" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="26" cy="62" rx="5.5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
    <ellipse cx="38" cy="62" rx="5.5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
  `),

  // ── VP of Synergy ───────────────────────────────────────
  // Power suit, broad shoulders, gold accents, pointing
  vp: sprite(`
    <!-- Hair — slick combover -->
    <path d="M20 16 Q20 4 32 3 Q44 4 44 16 L42 10 Q40 5 32 5 Q24 5 22 10 Z" fill="#263238" stroke="${O}" stroke-width="1"/>
    <path d="M20 12 Q22 6 32 5 L26 14 Z" fill="#37474F"/>
    <!-- Head -->
    <ellipse cx="32" cy="18" rx="12" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Stern eyes -->
    <circle cx="27" cy="19" r="2.5" fill="${O}"/>
    <circle cx="37" cy="19" r="2.5" fill="${O}"/>
    <circle cx="27.6" cy="18.4" r="0.9" fill="#fff"/>
    <circle cx="37.6" cy="18.4" r="0.9" fill="#fff"/>
    <!-- Stern brows -->
    <line x1="24" y1="15" x2="30" y2="16" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="34" y1="16" x2="40" y2="15" stroke="${O}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Thin mouth -->
    <path d="M29 24 Q32 23 35 24" fill="none" stroke="${O}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck -->
    <rect x="28" y="28" width="8" height="4" fill="${S}"/>
    <!-- Body — charcoal power suit (broad) -->
    <path d="M14 34 L26 30 L38 30 L50 34 L52 54 L12 54 Z" fill="#37474F" stroke="${O}" stroke-width="1.5"/>
    <!-- Shoulder pads -->
    <path d="M14 34 L18 30 L24 34 L18 36 Z" fill="#455A64" stroke="${O}" stroke-width="0.5"/>
    <path d="M50 34 L46 30 L40 34 L46 36 Z" fill="#455A64" stroke="${O}" stroke-width="0.5"/>
    <!-- Lapels -->
    <path d="M26 30 L32 42 L28 42 L18 34 Z" fill="#2C3E3F" stroke="${O}" stroke-width="0.5"/>
    <path d="M38 30 L32 42 L36 42 L46 34 Z" fill="#2C3E3F" stroke="${O}" stroke-width="0.5"/>
    <!-- Shirt + gold tie -->
    <rect x="30" y="34" width="4" height="18" fill="#ECEFF1"/>
    <path d="M31 34 L32 36 L33 34 L32.5 46 L32 47 L31.5 46 Z" fill="#FFD54F"/>
    <!-- Gold tie pin -->
    <rect x="30" y="40" width="4" height="1.5" rx="0.5" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <!-- Left arm -->
    <path d="M14 36 L8 44 L10 50 L13 49 L12 45 L14 39" fill="#37474F" stroke="${O}" stroke-width="1"/>
    <circle cx="10" cy="50" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — pointing -->
    <path d="M50 36 L56 42 L54 48 L51 47 L53 43 L50 39" fill="#37474F" stroke="${O}" stroke-width="1"/>
    <circle cx="55" cy="48" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <line x1="56" y1="46" x2="60" y2="42" stroke="${S}" stroke-width="2" stroke-linecap="round"/>
    <!-- Gold watch -->
    <rect x="52" y="45" width="3" height="2" rx="0.5" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <!-- Gold cufflinks -->
    <circle cx="14" cy="46" r="1" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <circle cx="50" cy="46" r="1" fill="#FFD54F" stroke="${O}" stroke-width="0.3"/>
    <!-- Belt -->
    <rect x="14" y="51" width="36" height="3" fill="#263238" stroke="${O}" stroke-width="0.5"/>
    <rect x="31" y="51" width="3" height="3" rx="0.5" fill="#FFD54F"/>
    <!-- Legs -->
    <rect x="21" y="53" width="8" height="8" rx="2" fill="#263238" stroke="${O}" stroke-width="1"/>
    <rect x="35" y="53" width="8" height="8" rx="2" fill="#263238" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="25" cy="62" rx="5.5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
    <ellipse cx="39" cy="62" rx="5.5" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
  `),

  // ── C-Suite Boss ────────────────────────────────────────
  // Crown, imposing, black suit, gold everywhere, broadest
  boss: sprite(`
    <!-- Crown -->
    <path d="M22 8 L24 0 L28 7 L30 -1 L32 7 L34 -1 L36 7 L40 0 L42 8 Z" fill="#FFD700" stroke="#FFA000" stroke-width="0.8"/>
    <rect x="22" y="7" width="20" height="3" rx="0.5" fill="#FFD700" stroke="#FFA000" stroke-width="0.5"/>
    <circle cx="28" cy="8.5" r="1.2" fill="#E53935"/>
    <circle cx="32" cy="8.5" r="1.5" fill="#2196F3"/>
    <circle cx="36" cy="8.5" r="1.2" fill="#4CAF50"/>
    <!-- Hair -->
    <path d="M20 18 Q20 8 32 8 Q44 8 44 18 L42 14 Q40 10 32 10 Q24 10 22 14 Z" fill="#1A1A2E" stroke="${O}" stroke-width="1"/>
    <!-- Head -->
    <ellipse cx="32" cy="20" rx="13" ry="11" fill="${S}" stroke="${O}" stroke-width="1.5"/>
    <!-- Imposing eyes (dark red pupils) -->
    <circle cx="27" cy="20" r="2.8" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <circle cx="37" cy="20" r="2.8" fill="#fff" stroke="${O}" stroke-width="0.8"/>
    <circle cx="27.5" cy="20" r="2" fill="#8B0000"/>
    <circle cx="37.5" cy="20" r="2" fill="#8B0000"/>
    <circle cx="28" cy="19.2" r="0.7" fill="#fff"/>
    <circle cx="38" cy="19.2" r="0.7" fill="#fff"/>
    <!-- Thick brows -->
    <path d="M23 16 L30 15" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
    <path d="M34 15 L41 16" stroke="${O}" stroke-width="2" stroke-linecap="round"/>
    <!-- Smug grin -->
    <path d="M28 26 Q32 29 36 26" fill="none" stroke="${O}" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Neck (thick) -->
    <rect x="27" y="30" width="10" height="4" fill="${S}"/>
    <!-- Body — black power suit (broadest) -->
    <path d="M10 36 L26 32 L38 32 L54 36 L56 56 L8 56 Z" fill="#0D0D0D" stroke="${O}" stroke-width="1.5"/>
    <!-- Massive shoulder pads -->
    <path d="M10 36 L16 32 L22 36 L16 38 Z" fill="#1A1A2E" stroke="${O}" stroke-width="0.5"/>
    <path d="M54 36 L48 32 L42 36 L48 38 Z" fill="#1A1A2E" stroke="${O}" stroke-width="0.5"/>
    <!-- Lapels -->
    <path d="M26 32 L32 44 L28 44 L14 36 Z" fill="#1A1A1A" stroke="${O}" stroke-width="0.5"/>
    <path d="M38 32 L32 44 L36 44 L50 36 Z" fill="#1A1A1A" stroke="${O}" stroke-width="0.5"/>
    <!-- Shirt + red power tie -->
    <rect x="30" y="36" width="4" height="18" fill="#ECEFF1"/>
    <path d="M31 36 L32 38 L33 36 L32.5 48 L32 49 L31.5 48 Z" fill="#B71C1C"/>
    <!-- Gold tie clip -->
    <rect x="30" y="42" width="4" height="1.5" rx="0.5" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <!-- Gold pocket hanky -->
    <path d="M16 38 L20 36 L22 40 L18 42 Z" fill="#FFD700" stroke="${O}" stroke-width="0.5"/>
    <!-- Left arm -->
    <path d="M10 38 L4 46 L6 52 L9 51 L8 47 L10 41" fill="#0D0D0D" stroke="${O}" stroke-width="1"/>
    <circle cx="6" cy="52" r="2.5" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Right arm — fist -->
    <path d="M54 38 L60 46 L58 52 L55 51 L57 47 L54 41" fill="#0D0D0D" stroke="${O}" stroke-width="1"/>
    <circle cx="59" cy="52" r="3" fill="${S}" stroke="${O}" stroke-width="1"/>
    <!-- Gold rings -->
    <circle cx="60" cy="51" r="1" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <circle cx="57" cy="53" r="1" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <!-- Gold watch -->
    <rect x="54" y="49" width="3" height="2" rx="0.5" fill="#FFD700" stroke="${O}" stroke-width="0.3"/>
    <!-- Belt -->
    <rect x="10" y="53" width="44" height="3" fill="#1A1A2E" stroke="${O}" stroke-width="0.5"/>
    <rect x="31" y="53" width="3" height="3" rx="0.5" fill="#FFD700"/>
    <!-- Legs -->
    <rect x="19" y="55" width="9" height="7" rx="2" fill="#0D0D0D" stroke="${O}" stroke-width="1"/>
    <rect x="36" y="55" width="9" height="7" rx="2" fill="#0D0D0D" stroke="${O}" stroke-width="1"/>
    <!-- Shoes -->
    <ellipse cx="23" cy="63" rx="6" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
    <ellipse cx="41" cy="63" rx="6" ry="2.5" fill="#1a1a2e" stroke="${O}" stroke-width="1"/>
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
