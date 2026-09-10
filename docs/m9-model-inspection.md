# User-supplied AITO M9 model inspection

Inspected on 2026-09-08. Source: the user-provided `C:/Users/Administrator/Downloads/aito-m9.zip` (7,555,534 bytes). This is an asset/data inspection, not an engineering accuracy certification or a browser rendering test.

## Safe extraction and source integrity

All ZIP entries were checked before extraction: relative paths only, no path traversal, no absolute paths/alternate-stream syntax, no symlink entries, and no executable file types. Extraction used a new destination and refused to overwrite existing contents. No attachment code was executed.

The archive contained four files and one directory entry, expanded size 13,404,944 bytes:

| File under `public/models/aito-m9/` | Bytes |
| --- | ---: |
| `license.txt` | 738 |
| `scene.gltf` | 398,729 |
| `scene.bin` | 12,493,760 |
| `textures/gsraitom9_screen_baseColor.png` | 511,717 |

The glTF parses successfully. Its one buffer URI and one image URI resolve to local files in that directory. Buffer length matches exactly. All 984 accessor ranges and 3 source bufferView ranges fit the binary buffer. All triangle indices were checked against POSITION counts: 0 out-of-range indices. All POSITION components were checked: 0 nonfinite values. The PNG has a valid signature and a 1024 × 1024 IHDR.

## License and required credit

Both `license.txt` and `asset.extras` agree:

- Title: **aito-m9**
- Author: **MattDoesBlender** — https://sketchfab.com/MattDoesBlender
- Source: https://sketchfab.com/3d-models/aito-m9-1096bd9a49044fd481c61542bded3097
- License: **CC BY-NC-SA 4.0** — https://creativecommons.org/licenses/by-nc-sa/4.0/
- Conditions stated by the source: credit the author; no commercial use; modified versions use the same license.

Suggested displayed attribution: **aito-m9 — MattDoesBlender, CC BY-NC-SA 4.0. Source: Sketchfab.** Identify any runtime view/material changes or visual assembly adjustments. Preserve the supplied license file when sharing the application/model. The model is a community asset, not an official Huawei/AITO engineering asset. Brand identification does not imply endorsement.

## Exact structure counts

| Metric | Count |
| --- | ---: |
| Scenes | 1 |
| Nodes | 281 |
| Named assembly groups below the two scene/root nodes | 49 |
| Meshes | 230 |
| Mesh-bearing node instances | 230 |
| Primitives | 230 |
| Indexed triangles | 339,904 |
| Sum of POSITION accessor counts across primitives | 247,641 |
| Materials | 72 |
| Textures / images | 1 / 1 |
| Animations / skins | 0 / 0 |

Each mesh has exactly one primitive. The summed accessor position count is not a deduplicated vertex count; it can differ from platform statistics. Mesh/primitive counts are graphics counts, not an authentic vehicle bill of materials. No Draco or other geometry decoder extension is required.

## Self-contained GLB conversion

Produced `public/models/aito-m9.glb` with `scripts/pack-m9.mjs` using Node standard-library operations only. The script combines the existing binary and PNG with 4-byte alignment, adds an image bufferView and MIME type, and removes resource URIs only in the output copy. It does not simplify, remodel, recolor, recenter or reposition anything. The source glTF/bin/PNG/license files remain unchanged. The script refuses to overwrite an existing output.

- GLB size: **13,232,360 bytes**
- SHA-256: `33a2bca0a5a64b1692b707ccc58d0d263bb50e5c4fd1a160a90d35a6ad33324b`
- Exported meshes/primitives/nodes/materials: **230 / 230 / 281 / 72**
- Source and exported node/mesh/material descriptions compare identically.
- Geometry bytes compare identically.
- Embedded PNG bytes compare identically.
- One embedded image; **zero external buffer/image resource references**.

## Axes and bounds

The root converts the source coordinates to **Y-up**. With all authored node transforms applied, the **front is +Z**, **rear is −Z**, **vehicle left is +X**, and **vehicle right is −X**. This is opposite to the previous Tesla model along the longitudinal axis. A front-view camera should be on +Z unless the application intentionally rotates the entire model.

Coordinates below are model-space world coordinates after source hierarchy transforms, before the viewer's normalization. Units have not been certified as true meters. Overall width/height/length including the unplaced wheel templates: `[2.021848, 1.979391, 4.770726]`. Do not publish these as real-car specifications.

Excluding unplaced tire, wheel and plate templates, the assembled body bounds are:

- Minimum: `[-1.010924, 0.109115, -2.455084]`
- Maximum: `[1.010924, 1.613524, 2.315642]`
- Lowest assembled-body point: **Y = 0.109115**, in `gsraitom9_under`.

| Assembly (prefix `gsraitom9_`) | World minimum `[X,Y,Z]` | World maximum `[X,Y,Z]` |
| --- | --- | --- |
| `body` | `[-0.915042, 0.165363, -2.393067]` | `[0.921456, 1.586107, 2.297529]` |
| `door_FL` | `[0.571885, 0.199488, -0.262423]` | `[1.010924, 1.506106, 0.918245]` |
| `door_FR` | `[-1.010924, 0.199548, -0.260794]` | `[-0.576042, 1.506151, 0.920649]` |
| `door_RL` | `[0.561316, 0.201549, -1.222428]` | `[0.920406, 1.508513, -0.118903]` |
| `door_RR` | `[-0.913502, 0.201610, -1.220135]` | `[-0.565153, 1.508559, -0.116546]` |
| `fender_FL` | `[0.745550, 0.197823, 0.893372]` | `[0.920282, 1.068917, 1.924113]` |
| `fender_FR` | `[-0.915053, 0.197881, 0.895490]` | `[-0.744815, 1.068970, 1.926180]` |
| `bumper_F` | `[-0.900176, 0.182429, 1.651135]` | `[0.905058, 0.909307, 2.315642]` |
| `bumper_R` | `[-0.895627, 0.207881, -2.455084]` | `[0.902799, 0.917638, -1.720549]` |
| `hood` | `[-0.810409, 0.811757, 1.013955]` | `[0.811682, 1.078984, 2.274316]` |
| `under` | `[-0.908529, 0.109115, -2.295367]` | `[0.916823, 0.771986, 2.096697]` |

## Important assembly limitation: wheel templates

The source contains **one tire mesh and one wheel/rim mesh**, both at the origin, not four wheels installed at the wheel arches. The wheel axis is X. Their retained source relationship is:

| Template | World center | World size |
| --- | --- | --- |
| `gsraitom9_tire` | `[-0.050312, -0.00000015, -0.00000080]` | `[0.254265, 0.731734, 0.731734]` |
| `gsraitom9_wheel` | `[-0.043663, 0.001016, 0.001520]` | `[0.241984, 0.593649, 0.592924]` |

Tire radius is approximately 0.365867 in this model's coordinate scale. Keep the tire/rim together with their original relative offsets if instancing; separately centering each would change that relationship.

No wheel-center locators, assembly extras, animation, skins or instance transforms were provided. All nontrivial placement beyond the root axis conversion is for the steering wheel; there is **no exact four-wheel assembly data**. Four-wheel placement must therefore be described as a **visualization assembly adjustment** and checked against the visible wheel arches. Front fender centers around Z = 1.409 are not certified wheel centers. This inspection does not prescribe inferred wheel-center coordinates.

The source `gsraitom9_plate` is also an unplaced template centered at `[0,0,0]`, size `[0.464980,0.138020,0]`. It can be excluded from the rendered model with a documented reason; this inspection did not move it. Do not let unplaced templates determine the viewer ground height or camera framing.

## Classification suggestions

Use the closest named **assembly group**, not leaf names ending in `-material`. Many mesh node names are repeated material names and Three.js may add numeric suffixes to them. Shared materials such as chrome/plastic/clearglass do not define part identity. The body paint is the material named exactly `gsraitom9`; the secondary exterior paint is `gsraitom9_secondary`. Do not recolor all `gsraitom9_*` materials.

A nonoverlapping assembly-based mapping gives these source mesh counts:

| Category | Assembly groups (all with `gsraitom9_` prefix) | Source meshes |
| --- | --- | ---: |
| Body panels | `body`, `hood`, `bumper_F`, `bumper_R`, `fender_FL`, `fender_FR` | 26 |
| Glass and lamps | `taillight_L/R`, `quarterglass_RL/RR`, `headlightglass_L/R`, `roofglass`, `backlight`, `doorglass_FL/FR/RL/RR`, `headlight_L/R`, `windshield`, `taillightglass_L/R` | 55 |
| Cabin and interior | `dash_screens`, `carpet`, `roofint`, `3rd_seats`, `seat_FL`, `seat_FR`, `pedals`, `rear_seats`, `dash`, `steer`, `dash_screens_glass` | 70 |
| Doors and tailgate | `door_FL/FR/RL/RR`, `doorpanel_FL/FR/RL/RR`, `tailgate` | 72 |
| Underbody | `under` | 1 |
| Exterior trim/templates | `roofrack`, `lettering`, `plate` | 4 |
| Suspension/brakes | No explicit assemblies present | 0 |
| Tire/rim templates | `tire`, `wheel` | 2 |
| Total | | 230 |

This simple mapping intentionally leaves integral tailgate lights with the tailgate and bumper lamps with the bumpers so assembly toggles remain predictable. A later material-aware split is possible but would change counts. `dash_screens_glass` belongs to the cabin, not exterior glazing. `backlight` uses dark glass and is the rear window, not a lamp.

No battery, motor, air suspension, brake caliper/disc or precise structural-frame assemblies were supplied. Do not present those as working categories or fabricate physical part counts. If four copies of the wheel pair are displayed, rendered instances rise by six relative to the source; excluding the unplaced plate subtracts one. Keep source and rendered counts distinct.

## Remaining verification

The container/data checks passed. The original source is not a complete four-wheel assembly, and no claim is made that it is factory-accurate. Browser rendering, material appearance, wheel-arch alignment, part toggles, exploded presentation and camera framing require visual verification in the application. No application source was edited by this inspection.
