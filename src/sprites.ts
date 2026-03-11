// ─── SVG CHARACTER SPRITES ──────────────────────────────────
// JRPG/Pokémon-style character illustrations as inline SVGs.
// Each returns a data:image/svg+xml URL for use in <img> tags.

function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// Shared helpers
const skin = "#F5C6A0";
const skinShadow = "#D4A574";
const eyeWhite = "#fff";
const eyePupil = "#1A1A2E";
const mouthColor = "#C0392B";

function head(hairColor: string, hairPath: string, extras = "") {
  return `
    <!-- Head -->
    <circle cx="64" cy="38" r="18" fill="${skin}" stroke="#B8926A" stroke-width="1"/>
    <!-- Hair -->
    <path d="${hairPath}" fill="${hairColor}" stroke="${hairColor}" stroke-width="0.5"/>
    <!-- Eyes -->
    <ellipse cx="57" cy="38" rx="3" ry="3.5" fill="${eyeWhite}"/>
    <ellipse cx="71" cy="38" rx="3" ry="3.5" fill="${eyeWhite}"/>
    <circle cx="58" cy="38" r="2" fill="${eyePupil}"/>
    <circle cx="72" cy="38" r="2" fill="${eyePupil}"/>
    <circle cx="58.5" cy="37" r="0.8" fill="#fff"/>
    <circle cx="72.5" cy="37" r="0.8" fill="#fff"/>
    <!-- Mouth -->
    <path d="M60 45 Q64 48 68 45" fill="none" stroke="${mouthColor}" stroke-width="1.2" stroke-linecap="round"/>
    ${extras}
  `;
}

function legs(pantsColor: string, shoeColor: string, y = 90) {
  return `
    <rect x="54" y="${y}" width="8" height="22" rx="3" fill="${pantsColor}"/>
    <rect x="66" y="${y}" width="8" height="22" rx="3" fill="${pantsColor}"/>
    <ellipse cx="58" cy="${y + 23}" rx="6" ry="3" fill="${shoeColor}"/>
    <ellipse cx="70" cy="${y + 23}" rx="6" ry="3" fill="${shoeColor}"/>
  `;
}

const SVG_SPRITES: Record<string, string> = {
  // ── Product Manager ────────────────────────────────────
  pm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#2C3E50",
      "M46 34 Q46 18 64 16 Q82 18 82 34 L82 30 Q82 20 64 18 Q46 20 46 30 Z",
      `<!-- Earpiece -->
       <rect x="79" y="34" width="5" height="8" rx="2" fill="#34495E"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — blue button-up -->
    <path d="M46 60 L54 58 L64 62 L74 58 L82 60 L84 92 L44 92 Z" fill="#3498DB"/>
    <path d="M46 60 L54 58 L64 62 L74 58 L82 60 L78 65 L64 68 L50 65 Z" fill="#2980B9"/>
    <!-- Collar -->
    <path d="M56 58 L64 64 L72 58" fill="none" stroke="#fff" stroke-width="1.5"/>
    <!-- Buttons -->
    <circle cx="64" cy="70" r="1" fill="#fff"/>
    <circle cx="64" cy="76" r="1" fill="#fff"/>
    <circle cx="64" cy="82" r="1" fill="#fff"/>
    <!-- Left arm holding clipboard -->
    <path d="M46 62 L36 72 L38 88 L42 88 L44 74 L46 66" fill="#3498DB" stroke="#2471A3" stroke-width="0.5"/>
    <rect x="30" y="72" width="12" height="16" rx="2" fill="#795548" stroke="#5D4037" stroke-width="0.5"/>
    <rect x="32" y="74" width="8" height="12" rx="1" fill="#fff"/>
    <line x1="33" y1="77" x2="39" y2="77" stroke="#ccc" stroke-width="0.5"/>
    <line x1="33" y1="80" x2="39" y2="80" stroke="#ccc" stroke-width="0.5"/>
    <line x1="33" y1="83" x2="37" y2="83" stroke="#ccc" stroke-width="0.5"/>
    <!-- Right arm -->
    <path d="M82 62 L90 70 L88 78 L84 78 L86 72 L82 66" fill="#3498DB" stroke="#2471A3" stroke-width="0.5"/>
    <ellipse cx="88" cy="79" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Belt -->
    <rect x="46" y="88" width="36" height="4" rx="1" fill="#2C3E50"/>
    <rect x="62" y="88" width="4" height="4" rx="1" fill="#B0BEC5"/>
    ${legs("#2C3E50", "#1A1A2E")}
  </svg>`,

  // ── Senior Engineer ────────────────────────────────────
  eng: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#4E342E",
      "M44 36 Q42 16 64 14 Q86 16 84 36 L84 32 Q86 18 64 16 Q42 18 44 32 Z M44 30 Q44 26 50 28 L44 34 Z M84 30 Q84 26 78 28 L84 34 Z",
      `<!-- Headphones -->
       <path d="M44 32 Q42 22 52 22" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
       <path d="M84 32 Q86 22 76 22" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
       <rect x="42" y="30" width="5" height="8" rx="2" fill="#555"/>
       <rect x="81" y="30" width="5" height="8" rx="2" fill="#555"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — dark hoodie -->
    <path d="M44 60 L56 58 L64 62 L72 58 L84 60 L86 94 L42 94 Z" fill="#2D2D2D"/>
    <!-- Hood -->
    <path d="M48 60 L56 56 L64 60 L72 56 L80 60 L78 64 L64 66 L50 64 Z" fill="#383838"/>
    <!-- Hoodie pocket -->
    <path d="M50 78 L78 78 L78 88 Q64 92 50 88 Z" fill="none" stroke="#444" stroke-width="1"/>
    <!-- Hoodie strings -->
    <line x1="60" y1="60" x2="58" y2="72" stroke="#666" stroke-width="0.8"/>
    <line x1="68" y1="60" x2="70" y2="72" stroke="#666" stroke-width="0.8"/>
    <!-- Left arm with laptop -->
    <path d="M44 62 L34 74 L36 86 L40 86 L42 76 L44 66" fill="#2D2D2D" stroke="#222" stroke-width="0.5"/>
    <!-- Right arm -->
    <path d="M84 62 L92 72 L90 80 L86 80 L88 74 L84 66" fill="#2D2D2D" stroke="#222" stroke-width="0.5"/>
    <ellipse cx="90" cy="81" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Laptop glow -->
    <rect x="28" y="80" width="16" height="10" rx="2" fill="#263238" stroke="#37474F" stroke-width="0.5"/>
    <rect x="30" y="82" width="12" height="6" rx="1" fill="#0D1117"/>
    <text x="33" y="87" fill="#00FF41" font-size="4" font-family="monospace">&gt;_</text>
    ${legs("#4A5568", "#333")}
  </svg>`,

  // ── UX Designer ────────────────────────────────────────
  design: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <!-- Beret -->
    <ellipse cx="64" cy="22" rx="18" ry="5" fill="#E74C3C"/>
    <path d="M46 24 Q46 12 64 10 Q82 12 82 24" fill="#E74C3C"/>
    <circle cx="64" cy="12" r="3" fill="#C0392B"/>
    ${head(
      "#C0392B",
      "M48 36 Q48 24 64 22 Q80 24 80 36 L80 30 Q80 24 72 26 L68 32 L64 26 L60 32 L56 26 Q48 24 48 30 Z",
      `<!-- Earring -->
       <circle cx="82" cy="42" r="1.5" fill="#F1C40F" stroke="#F39C12" stroke-width="0.5"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — colorful wrap top -->
    <path d="M46 60 L56 58 L64 62 L72 58 L82 60 L84 92 L44 92 Z" fill="#9B59B6"/>
    <path d="M46 60 L56 58 L64 72 L44 72 Z" fill="#8E44AD"/>
    <path d="M82 60 L72 58 L64 72 L84 72 Z" fill="#8E44AD"/>
    <!-- Scarf -->
    <path d="M56 56 Q64 64 72 56" fill="#F1C40F" stroke="#F39C12" stroke-width="0.5"/>
    <path d="M68 58 L72 76 L68 76" fill="#F1C40F"/>
    <!-- Left arm -->
    <path d="M46 62 L36 72 L38 86 L42 86 L42 74 L46 66" fill="#9B59B6" stroke="#7D3C98" stroke-width="0.5"/>
    <ellipse cx="40" cy="87" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Right arm with stylus -->
    <path d="M82 62 L92 72 L90 84 L86 84 L88 74 L82 66" fill="#9B59B6" stroke="#7D3C98" stroke-width="0.5"/>
    <ellipse cx="90" cy="84" rx="3" ry="3.5" fill="${skin}"/>
    <!-- Stylus -->
    <line x1="90" y1="80" x2="96" y2="68" stroke="#F1C40F" stroke-width="2" stroke-linecap="round"/>
    <circle cx="96" cy="67" r="1" fill="#E74C3C"/>
    <!-- Skirt -->
    <path d="M46 88 L42 108 L86 108 L82 88 Z" fill="#2C3E50"/>
    <!-- Legs -->
    <rect x="54" y="104" width="6" height="10" rx="2" fill="${skin}"/>
    <rect x="68" y="104" width="6" height="10" rx="2" fill="${skin}"/>
    <ellipse cx="57" cy="115" rx="6" ry="3" fill="#E74C3C"/>
    <ellipse cx="71" cy="115" rx="6" ry="3" fill="#E74C3C"/>
  </svg>`,

  // ── Intern ─────────────────────────────────────────────
  intern: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#F39C12",
      "M48 34 Q48 20 64 18 Q80 20 80 34 L80 28 Q80 22 64 20 Q48 22 48 28 Z",
      `<!-- Nervous sweat drop -->
       <path d="M82 28 Q84 32 82 36" fill="#81D4FA" stroke="#4FC3F7" stroke-width="0.5"/>
       <!-- Slight frown/nervous mouth override -->
       <path d="M60 45 Q64 44 68 45" fill="none" stroke="${mouthColor}" stroke-width="1" stroke-linecap="round"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Lanyard -->
    <path d="M58 54 L56 60 L56 78 L72 78 L72 60 L70 54" fill="none" stroke="#E53935" stroke-width="1.5"/>
    <rect x="58" y="74" width="12" height="8" rx="1" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
    <rect x="60" y="76" width="8" height="2" rx="0.5" fill="#E53935"/>
    <rect x="61" y="79" width="6" height="1" fill="#ccc"/>
    <!-- Torso — green polo (slightly smaller/younger) -->
    <path d="M48 60 L56 58 L64 62 L72 58 L80 60 L82 90 L46 90 Z" fill="#27AE60"/>
    <path d="M48 60 L56 58 L64 64 L72 58 L80 60 L76 64 L64 66 L52 64 Z" fill="#229954"/>
    <!-- Collar -->
    <path d="M58 58 L64 63 L70 58" fill="none" stroke="#1E8449" stroke-width="1.2"/>
    <!-- Left arm holding coffee -->
    <path d="M48 62 L38 74 L40 86 L44 86 L44 76 L48 66" fill="#27AE60" stroke="#1E8449" stroke-width="0.5"/>
    <!-- Coffee cup -->
    <rect x="32" y="78" width="10" height="12" rx="2" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
    <rect x="32" y="78" width="10" height="4" rx="2" fill="#795548"/>
    <path d="M42 82 Q46 84 42 88" fill="none" stroke="#ccc" stroke-width="1"/>
    <!-- Steam -->
    <path d="M35 76 Q36 72 34 70" fill="none" stroke="#ccc" stroke-width="0.5" opacity="0.6"/>
    <path d="M38 75 Q39 71 37 69" fill="none" stroke="#ccc" stroke-width="0.5" opacity="0.6"/>
    <!-- Right arm -->
    <path d="M80 62 L88 72 L86 80 L82 80 L84 74 L80 66" fill="#27AE60" stroke="#1E8449" stroke-width="0.5"/>
    <ellipse cx="86" cy="81" rx="3" ry="3.5" fill="${skin}"/>
    ${legs("#4A6FA5", "#795548", 88)}
  </svg>`,

  // ── Recruiter ──────────────────────────────────────────
  recruiter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#1A1A2E",
      "M48 34 Q48 18 64 16 Q80 18 80 34 L80 28 Q78 20 64 18 Q50 20 48 28 Z",
      `<!-- Slicked hair shine -->
       <path d="M54 22 Q58 18 62 22" fill="none" stroke="#333" stroke-width="0.8" opacity="0.5"/>
       <!-- Confident smirk -->
       <path d="M60 45 Q64 49 68 46" fill="none" stroke="${mouthColor}" stroke-width="1.2" stroke-linecap="round"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — sharp navy suit -->
    <path d="M44 60 L56 57 L64 62 L72 57 L84 60 L86 94 L42 94 Z" fill="#1A237E"/>
    <!-- Lapels -->
    <path d="M56 57 L64 72 L58 72 L52 62 Z" fill="#0D1557"/>
    <path d="M72 57 L64 72 L70 72 L76 62 Z" fill="#0D1557"/>
    <!-- Shirt + tie -->
    <rect x="61" y="62" width="6" height="30" rx="1" fill="#ECEFF1"/>
    <path d="M62 62 L64 64 L66 62 L65 78 L64 80 L63 78 Z" fill="#C62828"/>
    <path d="M62 62 L64 65 L66 62" fill="#E53935"/>
    <!-- Pocket square -->
    <path d="M48 64 L52 62 L54 66 L50 68 Z" fill="#C62828"/>
    <!-- Left arm -->
    <path d="M44 62 L36 74 L38 86 L42 86 L42 76 L44 66" fill="#1A237E" stroke="#0D1557" stroke-width="0.5"/>
    <ellipse cx="40" cy="87" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Right arm with phone -->
    <path d="M84 62 L92 70 L92 82 L88 82 L88 72 L84 66" fill="#1A237E" stroke="#0D1557" stroke-width="0.5"/>
    <ellipse cx="92" cy="74" rx="3" ry="3.5" fill="${skin}"/>
    <rect x="88" y="66" width="6" height="11" rx="1" fill="#263238" stroke="#37474F" stroke-width="0.5"/>
    <rect x="89" y="67" width="4" height="8" rx="0.5" fill="#4FC3F7"/>
    <!-- Belt -->
    <rect x="44" y="90" width="40" height="4" rx="1" fill="#263238"/>
    <rect x="62" y="90" width="4" height="4" rx="1" fill="#FFD54F"/>
    ${legs("#1A237E", "#263238")}
  </svg>`,

  // ── Scrum Master ───────────────────────────────────────
  scrum: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#6D4C41",
      "M48 34 Q48 20 64 18 Q80 20 80 34 L80 28 Q80 22 64 20 Q48 22 48 28 Z M46 34 L50 32 L48 36 Z M82 34 L78 32 L80 36 Z",
      `<!-- Big enthusiastic smile -->
       <path d="M58 44 Q64 50 70 44" fill="#fff" stroke="${mouthColor}" stroke-width="1.2" stroke-linecap="round"/>
       <!-- Cheek blush -->
       <ellipse cx="50" cy="42" rx="3" ry="2" fill="#FFAB91" opacity="0.4"/>
       <ellipse cx="78" cy="42" rx="3" ry="2" fill="#FFAB91" opacity="0.4"/>`
    )}
    <!-- Neck -->
    <rect x="60" y="54" width="8" height="6" rx="2" fill="${skin}"/>
    <!-- Lanyard -->
    <path d="M60 54 L58 60 L58 72" fill="none" stroke="#4CAF50" stroke-width="1.5"/>
    <path d="M68 54 L70 60 L70 72" fill="none" stroke="#4CAF50" stroke-width="1.5"/>
    <rect x="56" y="70" width="16" height="8" rx="1" fill="#fff" stroke="#aaa" stroke-width="0.5"/>
    <text x="58" y="76" fill="#333" font-size="4" font-family="sans-serif">SCRUM</text>
    <!-- Torso — orange polo -->
    <path d="M46 60 L56 58 L64 62 L72 58 L82 60 L84 92 L44 92 Z" fill="#E67E22"/>
    <path d="M46 60 L56 58 L64 64 L72 58 L82 60 L78 64 L64 66 L50 64 Z" fill="#D35400"/>
    <!-- Collar -->
    <path d="M58 58 L64 63 L70 58" fill="none" stroke="#BA4A00" stroke-width="1.2"/>
    <!-- Left arm up (energetic pose) -->
    <path d="M46 62 L32 56 L30 48 L34 46 L36 54 L46 60" fill="#E67E22" stroke="#D35400" stroke-width="0.5"/>
    <ellipse cx="32" cy="46" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Sticky notes in raised hand -->
    <rect x="26" y="38" width="8" height="8" rx="1" fill="#FFEB3B" transform="rotate(-10 30 42)"/>
    <rect x="28" y="36" width="8" height="8" rx="1" fill="#FF80AB" transform="rotate(5 32 40)"/>
    <rect x="24" y="40" width="8" height="8" rx="1" fill="#80DEEA" transform="rotate(-5 28 44)"/>
    <!-- Right arm with whiteboard marker -->
    <path d="M82 62 L92 72 L90 82 L86 82 L88 74 L82 66" fill="#E67E22" stroke="#D35400" stroke-width="0.5"/>
    <ellipse cx="90" cy="82" rx="3" ry="3.5" fill="${skin}"/>
    <rect x="88" y="76" width="3" height="12" rx="1" fill="#333"/>
    <rect x="88" y="86" width="3" height="2" rx="0.5" fill="#E53935"/>
    ${legs("#546E7A", "#795548")}
  </svg>`,

  // ── Middle Manager ─────────────────────────────────────
  manager: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <!-- Balding head -->
    <circle cx="64" cy="38" r="20" fill="${skin}" stroke="#B8926A" stroke-width="1"/>
    <!-- Balding hair — sides only -->
    <path d="M44 38 Q44 28 48 24 L48 38 Z" fill="#90A4AE"/>
    <path d="M84 38 Q84 28 80 24 L80 38 Z" fill="#90A4AE"/>
    <path d="M52 22 Q64 18 76 22" fill="none" stroke="#90A4AE" stroke-width="1.5"/>
    <!-- Eyes (tired) -->
    <ellipse cx="57" cy="38" rx="3" ry="3" fill="${eyeWhite}"/>
    <ellipse cx="71" cy="38" rx="3" ry="3" fill="${eyeWhite}"/>
    <circle cx="58" cy="39" r="2" fill="${eyePupil}"/>
    <circle cx="72" cy="39" r="2" fill="${eyePupil}"/>
    <circle cx="58.5" cy="38" r="0.8" fill="#fff"/>
    <circle cx="72.5" cy="38" r="0.8" fill="#fff"/>
    <!-- Eye bags -->
    <path d="M54 42 Q57 43 60 42" fill="none" stroke="#C9A882" stroke-width="0.6"/>
    <path d="M68 42 Q71 43 74 42" fill="none" stroke="#C9A882" stroke-width="0.6"/>
    <!-- Tired mouth -->
    <path d="M60 47 L68 47" fill="none" stroke="${mouthColor}" stroke-width="1" stroke-linecap="round"/>
    <!-- Neck (wider) -->
    <rect x="58" y="56" width="12" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — brown suit (wider build) -->
    <path d="M40 62 L54 58 L64 62 L74 58 L88 62 L90 96 L38 96 Z" fill="#6D4C41"/>
    <!-- Lapels -->
    <path d="M54 58 L64 72 L58 72 L48 62 Z" fill="#5D4037"/>
    <path d="M74 58 L64 72 L70 72 L80 62 Z" fill="#5D4037"/>
    <!-- Shirt + tie -->
    <rect x="61" y="62" width="6" height="32" rx="1" fill="#ECEFF1"/>
    <path d="M62 62 L64 65 L66 62 L65 82 L64 84 L63 82 Z" fill="#C62828"/>
    <path d="M62 62 L64 65 L66 62" fill="#E53935"/>
    <!-- Left arm holding coffee mug -->
    <path d="M40 64 L30 76 L32 90 L36 90 L36 78 L40 68" fill="#6D4C41" stroke="#5D4037" stroke-width="0.5"/>
    <!-- Coffee mug -->
    <rect x="24" y="82" width="12" height="14" rx="3" fill="#fff" stroke="#ccc" stroke-width="0.8"/>
    <rect x="24" y="82" width="12" height="5" rx="3" fill="#795548"/>
    <path d="M36 86 Q40 88 36 92" fill="none" stroke="#ccc" stroke-width="1.5"/>
    <!-- "World's OK-est Boss" text area -->
    <text x="26" y="94" fill="#E53935" font-size="2.5" font-family="sans-serif">#1</text>
    <!-- Steam -->
    <path d="M28 80 Q29 76 27 74" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.5"/>
    <path d="M32 79 Q33 75 31 73" fill="none" stroke="#aaa" stroke-width="0.5" opacity="0.5"/>
    <!-- Right arm -->
    <path d="M88 64 L96 74 L94 84 L90 84 L92 76 L88 68" fill="#6D4C41" stroke="#5D4037" stroke-width="0.5"/>
    <ellipse cx="94" cy="85" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Belt -->
    <rect x="40" y="92" width="48" height="4" rx="1" fill="#3E2723"/>
    <rect x="62" y="92" width="4" height="4" rx="1" fill="#B0BEC5"/>
    ${legs("#3E2723", "#1A1A2E", 94)}
  </svg>`,

  // ── VP of Synergy ──────────────────────────────────────
  vp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    ${head(
      "#263238",
      "M46 34 Q46 16 64 14 Q82 16 82 34 L82 28 Q80 18 64 16 Q48 18 46 28 Z",
      `<!-- Slick combover -->
       <path d="M46 28 Q48 20 64 18 L58 28 Z" fill="#37474F"/>
       <!-- Power stare — sharper eyes -->
       <!-- Stern mouth -->
       <path d="M60 45 Q64 44 68 45" fill="none" stroke="${mouthColor}" stroke-width="1.2" stroke-linecap="round"/>`
    )}
    <!-- Neck -->
    <rect x="58" y="54" width="12" height="6" rx="2" fill="${skin}"/>
    <!-- Torso — charcoal power suit (broad shoulders) -->
    <path d="M36 60 L54 56 L64 62 L74 56 L92 60 L94 96 L34 96 Z" fill="#37474F"/>
    <!-- Wide shoulder pads -->
    <path d="M36 60 L42 56 L48 60 L42 64 Z" fill="#455A64"/>
    <path d="M92 60 L86 56 L80 60 L86 64 Z" fill="#455A64"/>
    <!-- Lapels -->
    <path d="M54 56 L64 72 L58 72 L46 62 Z" fill="#2C3E3F"/>
    <path d="M74 56 L64 72 L70 72 L82 62 Z" fill="#2C3E3F"/>
    <!-- Shirt + gold tie -->
    <rect x="61" y="62" width="6" height="32" rx="1" fill="#ECEFF1"/>
    <path d="M62 62 L64 65 L66 62 L65 82 L64 84 L63 82 Z" fill="#FFD54F"/>
    <path d="M62 62 L64 65 L66 62" fill="#FFE082"/>
    <!-- Gold tie pin -->
    <rect x="61" y="72" width="6" height="1.5" rx="0.5" fill="#FFD54F"/>
    <!-- Gold cufflinks -->
    <circle cx="40" cy="82" r="1.5" fill="#FFD54F"/>
    <circle cx="88" cy="82" r="1.5" fill="#FFD54F"/>
    <!-- Left arm -->
    <path d="M36 62 L28 76 L30 88 L34 88 L34 78 L38 66" fill="#37474F" stroke="#2C3E3F" stroke-width="0.5"/>
    <ellipse cx="32" cy="89" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Right arm — power gesture -->
    <path d="M92 62 L100 72 L98 84 L94 84 L96 74 L92 66" fill="#37474F" stroke="#2C3E3F" stroke-width="0.5"/>
    <ellipse cx="98" cy="84" rx="3.5" ry="4" fill="${skin}"/>
    <!-- Pointing finger -->
    <line x1="100" y1="82" x2="106" y2="78" stroke="${skin}" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Gold watch -->
    <rect x="94" y="80" width="4" height="3" rx="1" fill="#FFD54F" stroke="#FFC107" stroke-width="0.5"/>
    <!-- Belt -->
    <rect x="36" y="92" width="56" height="4" rx="1" fill="#263238"/>
    <rect x="62" y="92" width="4" height="4" rx="1" fill="#FFD54F"/>
    ${legs("#263238", "#1A1A2E", 94)}
  </svg>`,

  // ── C-Suite Boss ───────────────────────────────────────
  boss: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <!-- Crown -->
    <path d="M48 18 L50 8 L56 16 L60 4 L64 16 L68 4 L72 16 L78 8 L80 18 Z" fill="#FFD700" stroke="#FFA000" stroke-width="0.8"/>
    <rect x="48" y="16" width="32" height="4" rx="1" fill="#FFD700" stroke="#FFA000" stroke-width="0.5"/>
    <!-- Crown jewels -->
    <circle cx="56" cy="18" r="1.5" fill="#E53935"/>
    <circle cx="64" cy="18" r="2" fill="#2196F3"/>
    <circle cx="72" cy="18" r="1.5" fill="#4CAF50"/>
    <!-- Head -->
    <circle cx="64" cy="36" r="20" fill="${skin}" stroke="#B8926A" stroke-width="1"/>
    <!-- Slicked dark hair -->
    <path d="M44 34 Q44 18 64 16 Q84 18 84 34 L84 28 Q82 20 64 18 Q46 20 44 28 Z" fill="#1A1A2E"/>
    <!-- Imposing eyes -->
    <ellipse cx="56" cy="36" rx="3.5" ry="3.5" fill="${eyeWhite}"/>
    <ellipse cx="72" cy="36" rx="3.5" ry="3.5" fill="${eyeWhite}"/>
    <circle cx="57" cy="36" r="2.5" fill="#8B0000"/>
    <circle cx="73" cy="36" r="2.5" fill="#8B0000"/>
    <circle cx="57.5" cy="35" r="1" fill="#fff"/>
    <circle cx="73.5" cy="35" r="1" fill="#fff"/>
    <!-- Thick eyebrows -->
    <path d="M52 31 L60 30" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>
    <path d="M68 30 L76 31" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>
    <!-- Smug grin -->
    <path d="M58 44 Q64 49 70 44" fill="none" stroke="${mouthColor}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Neck (thick) -->
    <rect x="56" y="54" width="16" height="6" rx="3" fill="${skin}"/>
    <!-- Torso — black power suit (broadest) -->
    <path d="M32 62 L54 56 L64 62 L74 56 L96 62 L98 98 L30 98 Z" fill="#0D0D0D"/>
    <!-- Massive shoulder pads -->
    <path d="M32 62 L40 56 L48 62 L40 66 Z" fill="#1A1A2E"/>
    <path d="M96 62 L88 56 L80 62 L88 66 Z" fill="#1A1A2E"/>
    <!-- Lapels -->
    <path d="M54 56 L64 74 L58 74 L42 62 Z" fill="#1A1A1A"/>
    <path d="M74 56 L64 74 L70 74 L86 62 Z" fill="#1A1A1A"/>
    <!-- Red power tie -->
    <rect x="61" y="62" width="6" height="34" rx="1" fill="#ECEFF1"/>
    <path d="M62 62 L64 66 L66 62 L65 84 L64 86 L63 84 Z" fill="#B71C1C"/>
    <path d="M62 62 L64 66 L66 62" fill="#C62828"/>
    <!-- Gold tie clip -->
    <rect x="61" y="72" width="6" height="2" rx="0.5" fill="#FFD700"/>
    <!-- Breast pocket with gold hanky -->
    <path d="M42 66 L48 64 L50 70 L44 72 Z" fill="#FFD700"/>
    <!-- Left arm -->
    <path d="M32 64 L22 78 L24 92 L28 92 L28 80 L34 68" fill="#0D0D0D" stroke="#1A1A1A" stroke-width="0.5"/>
    <ellipse cx="26" cy="93" rx="4" ry="4.5" fill="${skin}"/>
    <!-- Right arm — fist -->
    <path d="M96 64 L104 76 L102 88 L98 88 L100 78 L96 68" fill="#0D0D0D" stroke="#1A1A1A" stroke-width="0.5"/>
    <ellipse cx="102" cy="88" rx="4" ry="4.5" fill="${skin}"/>
    <!-- Gold rings -->
    <circle cx="104" cy="86" r="1.2" fill="#FFD700"/>
    <circle cx="100" cy="90" r="1.2" fill="#FFD700"/>
    <!-- Gold watch -->
    <rect x="96" y="84" width="5" height="3.5" rx="1" fill="#FFD700" stroke="#FFA000" stroke-width="0.5"/>
    <!-- Belt -->
    <rect x="32" y="94" width="64" height="4" rx="1" fill="#1A1A2E"/>
    <rect x="62" y="94" width="4" height="4" rx="1" fill="#FFD700"/>
    ${legs("#0D0D0D", "#1A1A1A", 96)}
  </svg>`,
};

// Build the sprite URL map
export function buildSpriteUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [id, svg] of Object.entries(SVG_SPRITES)) {
    urls[id] = svgToDataUrl(svg);
  }
  return urls;
}
