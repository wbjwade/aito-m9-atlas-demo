# Community Model 3 GLB inspection

Source and license: `public/models/MODEL-LICENSE.md`.

The file is a valid glTF 2.0 binary. Its JSON chunk parses. It contains 482 nodes, 177 meshes, 35 materials and 681,368 indexed triangles. Draco decoder is required. Two materials are named `Paint`; these are the safest paint-color replacement target.

Use `Box3.setFromObject` after loading to normalize world scale and center. Do not assume the coordinates are meters: an inner `Tesla Model 3_3` group has scale 100 and nested axis rotations.

## Useful group names (exact names in GLB)

| Assembly | Node names |
| --- | --- |
| Front-left door | `door_lf_dummy_184` |
| Rear-left door | `door_lr_dummy_202` |
| Front-right door | `door_rf_dummy_218` |
| Rear-right door | `door_rr_dummy_235` |
| Hood | `bonnet_dummy_279` |
| Trunk | `boot_dummy_158` |
| Front bumper | `bump_front_dummy_253` |
| Rear bumper | `bump_rear_dummy_270` |
| Windscreen | `windscreen_dummy_250` |
| Body shell | `body_32`, `bodysills_34` |
| Wheels | `wheel_rf_dummy_284`, with children `wheels_285`, `wheels.001_293` |
| Hubs | `hub_rb_4`, `hub_lb_6`, `hub_rf_8`, `hub_lf_11` |
| Suspension | `suspensi_91`, `suspensi2_142` |
| Steering | `steering_dummy_20` |
| Seats/interior | `Seat Leather white_149`, `Leather_white_151`, `whiteleather_120`, `Carpet_Light_138`, `LCDs_147` |
| Main glass | `glass_155`, `windscreen_dummy_250`; other panes are descendants within door groups |
| Charging flap | `charge_dummy` |

The wheel group layout does not reliably correspond to one mesh per physical wheel. The mesh count is not a physical parts count. For a clean interactive explosion, keep authored subassembly hierarchy or group by category, and label counts as mesh groups rather than authentic Tesla parts.

No verified HV battery or electric motor groups were found. Do not manufacture their existence in the UI or advertise engineering-accurate disassembly.

Inspection performed 2026-09-08. Browser rendering is still required; static metadata inspection does not prove visual correctness or performance.
