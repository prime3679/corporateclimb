# The Office — audio

Pass C deferred “new audio samples.” This pass ships them: original,
license-safe loops and stingers, wired through the live `Music` / `SFX`
hooks so the game plays them — not a trailer mux.

There is no `src/sfx/` package. Playback is `src/sfx.ts` + `src/music.ts`;
files live in `public/audio/`. Classic beds and stings are unchanged.

Regenerate Office files with `python3 scripts/gen_office_audio.py`
(numpy + ffmpeg). The script never overwrites Classic filenames.

## Shipped

| Cue                                                 | File                                  | When the live game plays it                                      |
| --------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Office title / start / role                         | `music_office_title_after_hours.mp3`  | `officeStart`, `officeClassSelect` via `Music.playOfficeTitle()` |
| Floor 1 overworld + combat                          | `music_office_floor1_cubicle_hum.mp3` | `office` + `floor_01` via `Music.playOfficeFloor`                |
| Floor 2 Operations (also F3–4 until dedicated beds) | `music_office_floor2_operations.mp3`  | `floor_02` / `floor_03` / `floor_04`                             |
| Floor 5 Exec                                        | `music_office_exec_the_nod.mp3`       | `floor_05`                                                       |
| Cab doors open                                      | `sfx_elevator_door_open.mp3`          | `ElevatorRide` mount (`SFX.elevatorOpen`)                        |
| Cab doors close                                     | `sfx_elevator_door_close.mp3`         | ride close beat (`SFX.elevatorClose`)                            |
| Cab arrive chime                                    | `sfx_elevator_arrive_chime.mp3`       | ride arrive / reduced-motion skip (`SFX.elevatorChime`)          |
| Combat hit                                          | `sfx_office_hit.mp3`                  | existing `SFX.hit` / `critHit` when `SFX.setCampaign('office')`  |
| Combat win                                          | `sfx_office_win.mp3`                  | existing `SFX.victory` in Office campaign                        |
| CLEARED stamp                                       | `sting_cleared_stamp.mp3`             | floor celebrations + spar/review hold (`SFX.stampCleared`)       |
| THE NOD stamp                                       | `sting_the_nod_stamp.mp3`             | Floor 5 celebration only (`SFX.stampTheNod`)                     |

Shared title (Classic / Daily / THE OFFICE still on one card) keeps the
Classic lobby bed so the Classic path is bit-identical until the player
enters THE OFFICE.

Office battles keep the floor bed. Sequencer hooks are unchanged; the
campaign flag remaps hit/win onto the Office samples.

`e2e/office-audio.spec.ts` pins the live facade: shared title stays
`title`, THE OFFICE plays `officeTitle`, Floor 1 / 2 / 5 pick their own
beds, Classic battle stays `battle`.

## Classic — unbroken

`CLASSIC_TRACKS` still points at:

- `music_menu_corporate_lobby.mp3`
- `music_gameplay_ladder_grind.mp3`
- `music_executive_floor_luxury_predator.mp3`
- `music_gameplay_pressure_review.mp3`

`Music.playTitle` / `playBattle` / `playBoss` / `playEvent` are the same
four keys. Classic `SFX.hit` / `victory` still play `reviewHit` /
`promotion`. `SFX.setCampaign('classic')` is the default and is restored
when leaving Office screens.

## Deferred

- Dedicated Floor 3 Product and Floor 4 Sales beds (F3–4 reuse Operations)
- Combat music duck / battle-only Office bed (mvp-design §13)
- Wipe low-pass return (mvp-design §13)
- Per-zone light-pool SFX beyond the existing coffee / badge zone cues
- Recruit / printer / vending restages
- Hand-composed replacements if Adrian wants a musician pass
- Demo PR `#87` muxes a single bed in ffmpeg — re-record after this lands
  so the trailer hears the live mix (`scripts/office-demo.mjs` now points
  at the Office title bed, not Classic exec)

## License

All Office files in this pass are original synthesis in
`scripts/gen_office_audio.py`. No third-party samples. Public-domain
math, not public-domain recordings.
