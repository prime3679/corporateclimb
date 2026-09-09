#!/usr/bin/env python3
"""Office Floor 1–2 house plates — the 512px Headshot portraits for the seven
F1–2 speakers (Renata, Gavin, Priya, Holloway, Teddy, Whitlock, Kessler).

Until Pass J these speakers borrowed the Classic tower's enemy art
(`recruiter.webp`, `overachiever.webp`, …): Pokémon-trainer poses, three
brown-haired lookalikes, and Renata / Priya / Holloway drawn as men while the
dialogue says "she". Floors 3–5 already had calm, speaker-keyed badge
portraits (Pass E). This script is the regenerable half of bringing F1–2 to
that bar. The Classic files stay untouched — Classic still renders them.

Pipeline (same shape as Pass E's F3–5 plates):

    python3 scripts/gen_office_plates.py brief [speaker]
        Print the commission brief for one / every speaker. The identity
        carriers (hair, jacket, shirt, accent, trousers, prop) are read from
        the walk-sheet palettes in gen_office_actors.py, so the portrait and
        the OverworldActor can never disagree about who someone is.

    python3 scripts/gen_office_plates.py import <masters_dir>
        Import <masters_dir>/<speaker>.png (a full-body figure on white,
        any size) into src/assets/characters/npcs/<speaker>.webp using the
        import_art.py contract: edge flood-fill background removal, trim,
        fit to 512 height, centre, WebP q82 with alpha.

    python3 scripts/gen_office_plates.py check
        Verify the committed plates: 512x512 RGBA, transparent margins, not
        byte-identical to any Classic plate, and the hair colour sampled at
        the top of the head sits within tolerance of the actor palette 'H'.

Masters are generated from the briefs (style anchor: the Pass E F3–5 plates)
and are not committed — see README "Assets" for the precedent.
"""

from __future__ import annotations

import colorsys
import importlib.util
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'
NPC_DIR = ROOT / 'src' / 'assets' / 'characters' / 'npcs'
CANVAS = 512

# speaker → (actor constant in gen_office_actors.py, Classic plate it replaces)
SPEAKERS: dict[str, tuple[str, str]] = {
    'renata': ('RENATA', 'recruiter'),
    'gavin': ('GAVIN', 'overachiever'),
    'priya': ('PRIYA', 'scrum'),
    'holloway': ('HOLLOWAY', 'manager'),
    'teddy': ('TEDDY', 'intern'),
    'whitlock': ('WHITLOCK', 'boss'),
    'kessler': ('KESSLER', 'vp'),
}

STYLE_ANCHOR = (
    'Full-body character illustration of ONE person for a video game character '
    'roster, in exactly the same art style as the Floor 3–5 plates (sloane, '
    'harper, ashford, caldwell): clean cel-shaded anime / JRPG trainer-card '
    'style, crisp dark line art, flat colours with one level of soft shading, '
    'no gradients or painterly texture, calm "employee badge photo" expression, '
    'standing straight, facing the viewer, full body from head to shoes, '
    'centred, plain pure white background, no ground shadow, no text, no '
    'logo, no frame. Proportions and line weight must match the roster.'
)

# Who they are. Pronouns follow the dialogue (mvp-design §2, floor-2-design §2).
CHARACTER: dict[str, str] = {
    'renata': (
        'Front-desk receptionist, woman in her early thirties. Wavy '
        'shoulder-length hair with a soft side part. Blazer over a plain white '
        'blouse, tailored trousers, dark flats. Holds a desk-phone handset at '
        'her hip, other hand on her hip. Dry, unimpressed but kind — she has '
        'seen every new hire.'
    ),
    'gavin': (
        'Senior Associate, nine years at the same desk, man in his mid-thirties. '
        'Slicked-back hair with a sharp part. Trim buttoned suit, crisp shirt, '
        'narrow tie, tiny gold company pin on the lapel. Neat stack of papers '
        'against his chest, other hand in a pocket. Smug, competitive half smile.'
    ),
    'priya': (
        'Ops coordinator who front-loads every meeting, South Asian woman in her '
        'late twenties. Short choppy spiky hair. Fitted blazer over a light shirt, '
        'charcoal trousers, ankle boots. Sticky notes stuck to the lapel like '
        'badges; a fan of index cards in one hand. Focused, tight determined smile.'
    ),
    'holloway': (
        'Interim team lead, interim for four years, woman in her mid-forties. Hair '
        'pulled into a low loose bun, faint tired shadows under the eyes. Pantsuit, '
        'pale collared shirt, slim bright tie worn loose, dark loafers. Paper '
        'coffee cup raised mid-sip. Weary, patient, resigned smile.'
    ),
    'teddy': (
        'Rotational intern fourteen months into six, also the help desk, young man '
        'about 23. Messy tousled hair, a few freckles. Slightly-too-big blazer worn '
        'open over a pale button-up, red lanyard with a white ID badge, chinos, '
        'white sneakers, grey backpack strap. Holds a coffee cup with both hands. '
        'Eager, a little anxious, wide earnest eyes.'
    ),
    'whitlock': (
        'External financial auditor ("legally, that\'s the point of me"), man in '
        'his early sixties. Swept-back white hair, long lined clean-shaven face, '
        'thin rectangular reading glasses. Severe suit with waistcoat, crisp shirt, '
        'narrow deep-red tie. Slim green hardcover ledger under one arm, pen in the '
        'other hand. Neutral, precise, faintly disapproving; mouth a flat line.'
    ),
    'kessler': (
        'Director of Operations, the Floor 2 boss who makes everyone stand, man in '
        'his late forties. Blond hair slicked straight back, strong jaw, thin mouth. '
        'Immaculate buttoned suit, crisp shirt, steel-blue tie in a tight knot, black '
        'dress shoes. Slim dark leather folder closed against his side. Stern, '
        'controlled, chin slightly raised, no smile.'
    ),
}

CARRIER_KEYS = (
    ('H', 'hair'),
    ('J', 'jacket'),
    ('S', 'shirt'),
    ('T', 'accent (tie / lanyard / belt)'),
    ('P', 'trousers'),
    ('X', 'prop'),
)

# Hair hue tolerance (degrees) and, for near-greys (white / silver hair),
# the saturation below which hue is meaningless and lightness is compared.
HUE_TOL = 28.0
GREY_SAT = 0.16
LIGHT_TOL = 0.22
CHROMA_LIGHT_TOL = 0.3


def load_actors():
    spec = importlib.util.spec_from_file_location('gen_office_actors', SCRIPTS / 'gen_office_actors.py')
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def load_import_art():
    spec = importlib.util.spec_from_file_location('import_art', SCRIPTS / 'import_art.py')
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def rgb_hex(c: tuple[int, ...]) -> str:
    return '#%02x%02x%02x' % tuple(c[:3])


def carriers(actor) -> dict[str, str]:
    return {label: rgb_hex(actor.pal[key]) for key, label in CARRIER_KEYS if key in actor.pal}


def brief(speaker: str, actors) -> str:
    actor_name, classic = SPEAKERS[speaker]
    actor = getattr(actors, actor_name)
    lines = [
        f'== {speaker.upper()}  (replaces Classic `{classic}` on the Office side)',
        STYLE_ANCHOR,
        '',
        CHARACTER[speaker],
        '',
        'Identity carriers — must match public/office/actors/%s.png:' % speaker,
    ]
    for label, hexv in carriers(actor).items():
        lines.append(f'  {label:<28s} {hexv}')
    return '\n'.join(lines)


def hair_sample(im: Image.Image) -> tuple[float, float, float] | None:
    """Median colour of the opaque, non-skin pixels in the top rows of the
    head — the fringe. Returns HLS or None when nothing opaque is up there."""
    px = im.load()
    w, h = im.size
    alpha_rows = [y for y in range(h) if any(px[x, y][3] > 200 for x in range(w))]
    if not alpha_rows:
        return None
    top = alpha_rows[0]
    sample: list[tuple[int, int, int]] = []
    for y in range(top + 4, min(top + 40, h)):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            # skip skin (warm, mid-light) and line ink (very dark)
            if r + g + b < 90:
                continue
            if r > 150 and g > 90 and b > 60 and r > g > b and (r - b) > 40 and (r - g) < 90:
                continue
            sample.append((r, g, b))
    if len(sample) < 50:
        return None
    sample.sort(key=lambda c: c[0] * 299 + c[1] * 587 + c[2] * 114)
    r, g, b = sample[len(sample) // 2]
    return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)


def hue_delta(a: float, b: float) -> float:
    d = abs(a - b) * 360
    return min(d, 360 - d)


def check(actors) -> int:
    failures = 0
    classic = {}
    for _, (_, classic_id) in SPEAKERS.items():
        classic[classic_id] = (NPC_DIR / f'{classic_id}.webp').read_bytes()
    for speaker, (actor_name, classic_id) in SPEAKERS.items():
        path = NPC_DIR / f'{speaker}.webp'
        problems: list[str] = []
        if not path.exists():
            print(f'{speaker}: MISSING {path.relative_to(ROOT)}')
            failures += 1
            continue
        raw = path.read_bytes()
        for cid, blob in classic.items():
            if raw == blob:
                problems.append(f'byte-identical to Classic {cid}.webp')
        im = Image.open(path).convert('RGBA')
        if im.size != (CANVAS, CANVAS):
            problems.append(f'size {im.size}, want {CANVAS}x{CANVAS}')
        bbox = im.getchannel('A').getbbox()
        if bbox is None or bbox[0] < 8 or bbox[2] > CANVAS - 8:
            problems.append(f'figure touches the side margins: alpha bbox {bbox}')
        actor = getattr(actors, actor_name)
        want = colorsys.rgb_to_hls(*(c / 255 for c in actor.pal['H'][:3]))
        got = hair_sample(im)
        if got is None:
            problems.append('could not sample hair at the top of the head')
        else:
            if want[2] < GREY_SAT or got[2] < GREY_SAT:
                if abs(want[1] - got[1]) > LIGHT_TOL or max(want[2], got[2]) > 0.35:
                    problems.append(
                        f'hair lightness {got[1]:.2f} vs walk-sheet {want[1]:.2f} (grey / white hair)'
                    )
            elif hue_delta(want[0], got[0]) > HUE_TOL:
                problems.append(
                    f'hair hue {got[0] * 360:.0f}° vs walk-sheet {want[0] * 360:.0f}° (tol {HUE_TOL:.0f}°)'
                )
            elif abs(want[1] - got[1]) > CHROMA_LIGHT_TOL:
                problems.append(
                    f'hair lightness {got[1]:.2f} vs walk-sheet {want[1]:.2f} (blond vs brunette drift)'
                )
        status = 'ok' if not problems else 'FAIL'
        print(f'{speaker:<9s} {status}  {"; ".join(problems)}')
        failures += bool(problems)
    return failures


def do_import(masters: Path) -> None:
    import_art = load_import_art()
    for speaker in SPEAKERS:
        src = masters / f'{speaker}.png'
        if not src.exists():
            print(f'{speaker}: no master at {src}, skipped')
            continue
        im = import_art.fit_to_canvas(import_art.remove_background(Image.open(src)))
        dst = NPC_DIR / f'{speaker}.webp'
        im.save(dst, 'WEBP', quality=82)
        print(f'{dst.relative_to(ROOT)}: 512x512 webp written')


def main(argv: list[str]) -> int:
    if not argv or argv[0] not in ('brief', 'import', 'check'):
        print(__doc__)
        return 2
    actors = load_actors()
    if argv[0] == 'brief':
        who = argv[1:] or list(SPEAKERS)
        for speaker in who:
            if speaker not in SPEAKERS:
                raise SystemExit(f'unknown speaker {speaker!r}; one of {", ".join(SPEAKERS)}')
            print(brief(speaker, actors))
            print()
        return 0
    if argv[0] == 'import':
        if len(argv) != 2:
            raise SystemExit('usage: gen_office_plates.py import <masters_dir>')
        do_import(Path(argv[1]))
        return 0
    failures = check(actors)
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
