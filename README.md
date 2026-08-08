# SynthViewTopy Lab Island

SynthViewTopy is an interactive Three.js spatial editor for the YouTopy Lab Island masterplan in `YT_LabIsland_Ideas1.png`. It turns the sketch into a navigable, procedural 3D island with editable research districts, six climate domes, transit rings, a coastal railway, an Alpine logistics port, a bridge, and a distant cyberpunk city. The scene can accept external meshes and export a named, Blender-ready GLB hierarchy.

## Current masterplan coverage

- 35 editable district programs covering every district/lab label in the sketch; each has a description-specific, widely spaced satellite campus, at least four themed objects, and a normalized street graph joining every building approach to the shared arterial system
- A district-scale dark-academia university with 14 configured, walk-accessible facilities; a gate and porter lodge; central and secondary courts; library, humanities, chapel, dining, science, residence, garden, canal, boathouse, and service zones; three furnished interiors; and optional discoveries
- 6 editable, fully populated biome domes at 2.15x their original dimensions: alpine, tundra, desert, savanna, temperate deciduous forest, and tropical rainforest; each has a distinct ecology set and named field laboratory
- 1 bridge connection centered between the Alpine and Tundra sectors, leading across the expanded sea to a long cyberpunk mainland skyline
- 1 industrial cold-chain port with four piers, three ships, and a direct freight road to Logistics
- 1 continuous double-track railway following the hexagonal coastline
- An exact pointy-top regular-hex island whose only district delimiters are five concentric ring roads and three continuous biome-to-biome roads, forming six radial spokes; no per-campus boundary overlays are rendered
- A cohesive road hierarchy: generic campuses use closed collectors, specialized campuses retain their authored circulation, obstacle-aware graded connectors meet adjacent ring arterials at the exact road datum, and every curb opens at its real junction
- A Design Studio catalog with 10 exterior building/landscape assets and 12 interior lab, office, furniture, and systems assets
- Procedural terrain, architecture, biome interiors, roads, landscape, labels, water, lighting, and atmosphere

The source wording is retained as `sourceLabel` where a display name was normalized. The three central labels are represented as closely grouped parts of the integrated core complex.

## Run locally

Node.js 20.19+ or 22.12+ is recommended.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5178](http://127.0.0.1:5178). The fixed local-only port avoids colliding with other Vite projects that commonly use `5173`.

```bash
npm run build     # Type-check and create the production bundle in dist/
npm run preview   # Preview the production bundle locally
npm run test:streaming          # Verify balanced Explore/Walk rendering and inside-only interiors
npm run test:genomics           # Audit the five-building Genomics Labs District exterior package
npm run test:proteomics         # Audit the five-building Proteomics Labs District exterior package
npm run test:computational-biology # Audit the ten-building Computational Biology Labs District exterior package
npm run test:biochemistry       # Audit the ten-building Biochemistry Labs District exterior package
npm run test:inorganic-chemistry # Audit the fifteen-building Inorganic Chemistry Labs District exterior package
npm run test:particle-physics # Audit the fifteen-building Particle Physics Labs District exterior package
npm run test:astronomy-astrobiology # Audit the fifteen-building Astronomy / Astrobiology Labs District exterior package
npm run test:roads            # Audit all district graphs, arterial seams, obstacle clearance, curbs, and Plan HLOD roads
npm run test:district-walkability # Probe every district delimiter and current generic entrance in WALK
npm run export:unreal-bootstrap # Generate the one-way Unreal bootstrap manifest
```

## Streamed browser preview and Unreal migration

The browser is now explicitly a **sandbox editor and lightweight preview**.
Explore renders all 35 district and six biome exterior packages, with interiors
hidden, so the island remains a complete atmospheric 3D map. Walk keeps nearby
exteriors at full detail and replaces distant packages with atmospheric HLODs;
an authored interior is rendered only while the walker is inside its building.
Cerebrum Externum follows the same inside-only policy and is disposed as soon as
the walker leaves. The Debug panel reports resident packages and the interior
lifecycle.

Production content is owned exclusively by Unreal Editor. The browser exposes
a one-way, bootstrap-only manifest/GLB interface for the initial staged
migration; browser changes never merge back into production. The native C++
project, importer, streaming entrance component, SaveGame/interaction contract,
quality configuration, and Cerebrum vertical-slice definition are documented in
[`../YouTopiaProgrammabilis/README.md`](../YouTopiaProgrammabilis/README.md).

## Editor modes and controls

| Mode | Purpose | Mouse controls | Shortcut |
| --- | --- | --- | --- |
| Explore | Orbit around the complete exterior 3D map and inspect districts | Drag to orbit, scroll to zoom, click to select | `1` |
| Plan | Read the sketch as a north-up overhead masterplan | Drag to pan, scroll to zoom, click to select | `2` |
| Edit | Move, rotate, and scale the selected district, dome, or imported mesh | Click to select, then drag the transform gizmo | `3` |
| Walk | Explore the island at human eye level with collision-aware movement | Click the viewport for mouse-look; use movement keys to walk | `4` |

Additional controls:

- Click a district in the Atlas to select it; double-click a model or Atlas item to focus the camera.
- In Edit mode, use `G` for Move, `R` for Rotate, and `S` for Scale.
- The Inspector exposes editable object names, independent floating scene labels, descriptions, numeric XYZ position, Y rotation, uniform scale, accent color, visibility, Focus, and Reset controls. Identity edits update the Atlas, search, labels, Academic building cards, project JSON, and GLB metadata while retaining each object's stable selection ID.
- Press `/` to focus Atlas search, `Escape` to clear selection, `Home` to return to the overview, and `F` to toggle fullscreen.
- Toggle the Architecture, Landscape, Labels, and Transit layer buttons independently.
- Switch between Blue hour and Daylight from the top bar.
- Explore and Edit preserve the exact camera view when switching. Walk starts on safe ground at the current viewed area and returning to Explore or Edit keeps the resulting Walk position and heading.

### Edit workspaces

- Choose **Edit → Landscape** to select, move, rotate, scale, recolor, add, import, or delete buildings and outdoor objects. Choose an asset card and press **Add asset** or `A`; remove the selected object with **Delete** or the `Delete` key.
- Choose **Edit → Interior Design**, select a district building or biome dome in the scene or Atlas, and choose **Enter Interior**. The editor opens a lit cutaway room tied to that object's transform and exposes a dedicated catalog of lab benches, safety cabinets, scientific instruments, workstations, furniture, storage, servers, airlocks, and utility systems. Dome interiors begin with five field-laboratory fixtures and remain extensible through the same catalog.
- Interior objects use the same transform Inspector and gizmo as exterior assets. Imported meshes are automatically fitted and parented to the active building while Interior Design is open.
- Choose **Exit Interior** to restore the island view. Authored interiors remain attached to their buildings and are included in project JSON and Blender-ready GLB exports.

### Walk mode

- Press `4` or choose **Walk**, then click the 3D viewport to capture the pointer for mouse-look. If pointer lock is unavailable or denied, Walk automatically switches to drag-based mouse look; move or drag on the viewport to turn the camera.
- Move with `W`, `A`, `S`, `D` or the arrow keys. Set the exact walking speed in km/h from the WALK panel.
- Press `Space` for a 0.55 m hop or hold it for a 1.6 m traversal jump. Airborne collision uses the character's actual feet height, so a sufficiently high jump can clear low walls and props while full-height architecture remains solid.
- Special object and entrance interactions are temporarily disabled; `E` does not open an interaction menu.
- Press `Escape` to release pointer lock and return the mouse to the interface.
- WALK is calibrated to a 1.7 m adult: the camera eye level is 0.162 world units (1.62 m), the configured km/h speed is converted exactly to world motion, and the dedicated 55° vertical field of view is restored to the overview lens when WALK ends.
- Terrain, roads, district plots, bridge approaches, and city ramps expose semantic walkable surfaces. Buildings, biome structures, and imported meshes participate in collision/obstacle checks, while ramps keep traversal grounded across elevation changes. Collision now uses each obstacle's transformed local footprint after a cheap world-bounds broad phase, so rotated plots and structural masses cannot project invisible AABB corners across adjacent ring or radial roads.
- The five concentric delimiter roads and six radial spokes remain continuously open through all 35 district cells. At the integrated core, the Dark Center podium is split into two visible wings around a ground-level covered civic passage instead of relying on a non-visual collision exemption.
- Local streets now form one island-wide hierarchy: building approaches feed district collectors or authored spines, graded obstacle-aware links reach the adjacent ring roads without steps or curb lines, and those rings connect directly to all six spokes. The same schematic remains visible in Plan and distant HLOD views.
- Every district has a lit entry door and a walkable foyer linked to its approach ramp. All 14 Academic District facilities have their own open arched doorway, walkable ground floor, and exterior path; Cerebrum Externum, Founders Dining Hall, and St Anselm Chapel are furnished in-place rather than loaded as disconnected scenes. Cerebrum Externum includes connected reading halls, stacks, an upper gallery, and the underground Cerebrum Occultum archive. Each climate dome has a glazed airlock corridor: follow its ramp, cross the glowing threshold, and continue onto the dome's interior ground.

## Entry and Logistics District

The city-facing north-east perimeter wedge now follows the supplied red-line program. The bridge alignment divides it into a warmer public Entry/Commercial half toward the Tundra Dome and an operational Logistics half extending west toward the Alpine Dome. Every authored building anchor and complete exterior footprint remains between the inner perimeter road, coast-side limit, and its assigned side of that bridge split.

- Entry contains the Bridgehead Tunnel and Island Gate, Welcome and Registration Hall, Meridian Transit Pavilion, Clearline Glassfront Cafe, Ringwalk Galleria Mall, The Catwalk Fashion Runway Club, Old Circuit Arcade, Bridgeview Arrival Hotel, Dock Market Hall, Island Showcase Pavilion, Beacon Picture House, East Quay Water-Taxi Pavilion, and Cityline Orientation Tower.
- Logistics contains Skydeck Parking House, Northfield Airport Terminal, Airfield Operations and Control Tower, Aircraft Maintenance Hangar One, Cargo Inspection and Transfer Depot, Cold-Chain Distribution Center, and Ground Fleet Maintenance Depot.
- The public road descends beneath the freight branch before opening into the oval Welcome plaza. One bridge-arrival backbone and a shortest-entrance pedestrian tree connect the commercial buildings without redundant crossings; the reflecting pool, quay promenade, and protected Alpine view corridor organize the public side.
- The short runway occupies the extreme northern edge with its approach over water. The terminal, tower, and hangar share one airside apron; cargo, cold-chain, and fleet buildings follow one controlled freight spine, joined through a single checkpoint. A planted acoustic berm and translucent security wall separate those yards from public streets.
- In **Edit**, all twenty program buildings have individual Atlas entries and direct façade selection. Each keeps its own Move/Rotate/Scale gizmo, transform state, Reset, Undo, and project persistence. The Inspector adds relative X/Y/Z scale fields for deliberate width, height, or depth elongation; attached road branches, normalized route metadata, runtime batches, and Plan/HLOD road schematics rebuild from the live entrance after a move, rotation, or scale change.
- These are exterior-only runtime programs. WALK routes and yards are grounded, while special object interactions remain disabled under the current global policy.

## Security District

The eastern outer-ring Security District is now the **Aegis Arc**, a dedicated exterior master plan of fifteen shield-like facilities arranged between the Secret Labs/bio-science interface, the Forensic/Cyberforensic boundary, and the Tundra/perimeter route.

- **Central core:** Porta Aegis, Praesidium Nexus, and Forum Meridian establish the credentialing threshold, command skyline, and emergency assembly square.
- **Perimeter:** Sentinel Crown, Strix Aviary, and Limes Forge provide the sensor-fusion landmark, autonomous aerial operations, and coast-integrated perimeter maintenance edge.
- **Operational belt:** Celeritas Response Arc, Cerberus Yard, Via Custos, and Aegis Proving Hall share a curved deployment and service boulevard.
- **Protected interfaces:** Janus Clean Gate and Silentium Bureau face the bio-science side; Scutum Blackglass, Custodia Vault, and Concordia Court face Forensics/Cyberforensics.
- Frost-white ceramic, charcoal basalt, brushed titanium, smoked electrochromic glass, pale-blue normal-state lighting, restrained amber emergency seams, black reflecting water, high-canopy trees, and low geometric planters define one district-wide language without visible fences or crude barricades.
- The main boulevard, operational arc, perimeter maintenance arc, and three radial service routes are grounded WALK surfaces. The complete district remains within its shared outer-ring road cell and participates in normal HLOD streaming, project persistence, selection, and GLB export. Interiors are intentionally deferred; Porta Aegis and Praesidium Nexus are the recommended first interior phase.

## Forensic / Cyberforensic Labs District

The eastern outer ring now contains a complete fifteen-facility forensic campus conceived as one persistent-signature system rather than a police or administrative compound.

- **Biological and material evidence:** Evidentia Nexus, Helix Trace Institute, Proteomic Residue Observatory, Microbiome Provenance Conservatory, Thanatoscan Monolith, Ridge Morphology Institute, Isotope Geolocation Spire, Nanotrace Materials Foundry, and Ecological Evidence Terraces progress from chain of custody through trace extraction and origin analysis.
- **Cyberforensic evidence:** Silicon Autopsy Foundry, Malware Ecology Containment Tower, Network Reconstruction Array, Veritas Prism, and Quantum Evidence Vault move from damaged hardware and adversarial code through distributed incident reconstruction, media authenticity, and long-term cryptographic provenance.
- **Convergence range:** the Cyber-Physical Reconstruction Range combines a crescent reconfigurable hangar, six sensor-calibration doors, configurable road and rail elements, a drone cage, water-damage basin, reconstruction gantries, and the rotating Forensic Eye.
- The curved **Evidence Line** is a grounded boulevard with split amber/cyan signature traces, embedded sample/hash markers, four controlled cross-links, an outer sealed service arc, exposed environmental sampling drains, and an exact approach to every facility.
- The elevated **Chainline** uses 71 opal transport-tube segments, eleven titanium pylons, and ten animated hermetic evidence capsules. Anthracite ceramic, black basalt, satin titanium, smoked glass, opal panels, conductive mesh, restricted copper detailing, low silver grass, monitored moss, trimmed trees, and shallow reflecting water establish the district-wide language.
- The complete exterior campus remains inside its outer-ring sector with non-overlapping facility envelopes and supports normal WALK grounding, HLOD streaming, project persistence, selection, deterministic animation, text-state inspection, and GLB export. Interiors remain intentionally deferred by the exterior brief.

## Genomics Labs District

The southern inner-ring Genomics Labs District is an exterior-only code landscape whose five buildings share volcanic basalt foundations, pearl-white genomic ceramic, brushed titanium, electrochromic glass, and restrained four-base spectral wayfinding.

- **The Pangenome Confluence / Atrium Variorum** branches three horizontal research ribbons across Haplotype Court, variant bubbles, overlapping bridges, a deep entrance incision, and a floating roof graph.
- **Helix Meridian** rises as three unequal read-length shafts above a vibration-isolated sequencing podium. Irregular metallic alignment bands, moiré blades, pore windows, upward read signals, and the instrument crown make it the district's vertical landmark.
- **Tessera Vitae** forms a low tissue-like field of exactly thirty pentagonal and hexagonal cell modules with heterogeneous facades, nuclei skylights, three layered section walls, vascular bridges, Coordinate Court, branching water, and a rotating calibration mast.
- **Fabrica Genomica** uses a heavy split basalt base, six exchangeable chromosome modules with displaced centromere bands, an elliptical gantry with four moving carriages, service tower, utility cylinders, controlled watercourse, and visitor pavilion.
- **The Variant Constellation** combines a twelve-facet waisted core, projecting variant panels and luminous regulatory links, an interrupted translucent research ring, twelve leaning pylons, three structural-variant bridges, and the Manhattan Colonnade of statistical peaks.
- The grounded **Base-Pair Promenade** carries four separating and recombining spectral traces, four district-interface links, and five exact building approaches. The complete 1,116-mesh campus stays within its inner-ring sector with zero facility-envelope overlaps and participates in HLOD streaming, persistence migration, selection, deterministic animation, text-state inspection, WALK navigation, and GLB export.

## Proteomics Labs District

The north-western inner-ring Proteomics Labs District is an exterior-only folded molecular landscape. Pearl technical ceramic, graphite and dark titanium, smoked glass, cyan-violet dichroic glazing, and restrained amber, magenta, and electric-blue modifications unify five deliberately different scientific silhouettes.

- **The Monocell Proteome Array** raises seven independently illuminated tapered laboratory blades from an oval microplate podium with 96 heterogeneous wells, capillary signals, modification capsules, electrospray crowns, recessed bridges, and a floating oval roof ring.
- **The Tissue Cartography Hall** folds two low tissue plates around the black Segmentation Passage. Its 144 heterogeneous cellular facade panels, luminous cell boundaries, false-colour roof map, microscope-aperture housings, and layered magnification entrance preserve the spatial-proteomics theme at every viewing height.
- **The Proteoform Resonance Basilica** wraps two dark folded shells around a full-height central void and tilted analytical ring. Forty appended facade modifications, exposed branching supports, reflection basins, and nested elliptical crown frames express intact proteoforms and native complexes.
- **The Interactome Constellation** assembles nine faceted nodes into a compact research settlement linked by sixteen bridges and cross-links. A suspended 96-disc interaction cloud, coloured hub joints, and responsive court markers make the network readable without a conventional monumental front.
- **The Amino-Pore Sequencing Veil** forms the Genomics-facing frontier from two long porous membrane walls, 240 independently lit pores, paired Primary Pore rings, an open sequencing canyon, and a rotated crystalline data prism carrying an irregular single-chain signal motif.
- The grounded **Polypeptide Walk** carries three molecular-backbone lights, four branching side-chain paths, and five exact approaches through 36 heterogeneous cell gardens and nine specimen-tree islands. The 1,494-element package stays inside its inner-ring sector with zero facility-envelope overlaps, uses 24 runtime draw calls and approximately 66,000 triangles, and participates in HLOD streaming, revision-12 persistence migration, selection, deterministic animation, deep text-state inspection, WALK navigation, and GLB export. Interiors remain intentionally deferred by the exterior specification.

## Computational Biology Labs District

The outer-ring Computational Biology Labs District is a ten-building exterior campus organized as a continuous model-to-observation system. Black basalt, graphite and pale titanium, mineral ceramic, white UHPC, violet-black electrochromic glass, translucent photovoltaic glass, and restrained iridescent metal unify ten distinct scientific silhouettes.

- **Cellularis Nexus**, **Causa Array**, and **Proteus Fold** establish cell-state inference, causal intervention, and protein-folding research through displaced shells, a counterfactual slab void, twin folded towers, contact lattices, and validation landscapes.
- **Pangenome Meridian**, **Morphospace Atlas**, and **Regula Loom** translate graph genomes, tissue sections, and context-dependent regulation into five branching bars, six offset tissue plates, three veil towers, section breaks, enhancer bridges, and cellular relief.
- **Immunome Exchange**, **Kinetica Dynamics Array**, **Aion Evolution Engine**, and **Continuum BioTwin Observatory** complete the district with a crescent Recognition Court, trajectory ribbons, a phylogenetic canyon, eighteen Thermal Reef towers, nested biological-scale terraces, and the Systems Tower.
- The 32-metre **Inference Spine** carries three signal lines, five branching paths, a Cartesian grid, an 87-part courier track, six animated couriers, eighteen sensor masts, thirty-six validation domains, ten heat exchangers, and exact approaches to every building. The 1,887-mesh package stays within its outer-ring sector with zero facility-envelope overlaps and participates in HLOD streaming, revision-13 persistence migration, selection, deterministic animation, text-state inspection, WALK navigation, and GLB export. Interiors remain intentionally deferred by the exterior specification.

## Particle Physics Labs District

The south-eastern perimeter Particle Physics Labs District is a fifteen-building, surface-only exterior campus organized as a physical visualization of event tracks, detector layers, probability fields, symmetry breaking, interference, and curved spacetime. It deliberately contains no accelerator, beam hall, magnet hall, or accelerator-access structure.

- The central interaction zone joins the twelve-sector **Conventus Orbis** convention ring and open Interaction Court with the floating Higgs cube **Scalaris**, braided **Chromodynamic Court**, moire-screened neutrino institute **Oscilla**, and subtly mismatched twin towers of **The Asymmetry House**.
- The computational and operational arc places **Chronos Relay**, **The Event Loom**, and **The Lattice Citadel** on curved data routes leading to **The Signal Coast Archive**, whose basalt storm barrier, wave canopy, twin sentinels, and exposed data conduits form the fortified Data Coast.
- The low-signal garden groups incomplete black-ring **Noctis**, cruciform **Symmetria**, and the six isolated volumes beneath **The Quantum Silence Pavilion** with sparse landscaping and embedded fibre-optic points.
- The northern theory ridge progresses from crystalline **Amplituhedron House** through the seven displaced regimes of **The Renormalization Tower** to the dark-to-pale expansion of **Genesis Spiral**.
- Event Track Promenade, Theory Ridge Path, Data Coast Service Road, Probability Field Spine, four curved operational links, and fifteen exact approaches form 23 grounded routes. Shared primitive geometry, instanced facade/landscape fields, low-segment curves, HLOD/full-island batching, selective animation, and sparse linear lighting keep the district performance-conscious while preserving every building's authored silhouette. Interiors remain intentionally deferred by the exterior specification.

## Industrial District Labs

The southern perimeter Industrial District is a fifteen-facility production landscape arranged around the Production Meridian. Blackened steel, basalt, soot-stained ceramic, white process vessels, amber guidance light, and exposed pipe-and-conveyor infrastructure distinguish it from the neighboring research campuses.

- **Shift Meridian**, **Continuous Works**, **Black Kiln**, **Vacuum Casting Cathedral**, and **Metamaterial Loomworks** form the logistics, continuous-production, induction, vacuum-casting, and precision-fabrication front.
- **Cryogenic Forming Plant**, **Additive Megafabrication Yard**, **Autonomous Microfactory Hive**, **Biogenic Materials Foundry**, and **Machine Genesis Hall** expose their forming ports, gantry printers, cellular production units, bioreactors, machine datum grids, and calibration doors to the main works route.
- **Destructive Testing Monolith**, **Platform Zero**, **Thermal Recovery & Process Power Station**, **Closed-Loop Reclamation Works**, and **Building Ø** complete the heavy-test, rail-logistics, energy-recovery, reclamation, and classified perimeter sequence.
- Production Meridian, the credential route, seawall loop, five crossings, fifteen exact approaches, seven enclosed conveyors, eighteen pipe-rack spans, and Platform Zero's rail fan form the district circulation and process skyline. The previous automatic industrial building is preserved as a relocated **Legacy Automatic Works Annex**, while its coastal railway connection remains in its canonical alignment. The authored package participates in HLOD streaming, revision-16 persistence migration, selection, deterministic process animation, deep text-state inspection, WALK navigation, and GLB export.

## Astronomy / Astrobiology Labs District

The south-western outer-middle ring is a fifteen-building dark-sky campus whose scientific gradient progresses from precision astronomy, time-domain observations, multi-messenger coordination, radio cosmology, space weather, metrology, and planetary defense toward biosignatures, ocean worlds, origins of life, protected samples, extremophiles, alternative biochemistry, and planet-forming disks.

- **The Coronagraph Crown**, **The Chronos Array**, **Concordance Spire**, **Hydrogen Horizon House**, and **The Heliomagnetic Bastion** establish the precision-observation edge with aperture petals, robotic telescope capsules, braided messenger shafts, a calibration antenna field, and structural magnetic-field arches.
- **The Parallax Foundry**, **Asterion Shield**, **The Noctis Signal Vault**, **The Aether Spectrum Gardens**, and **The Cryocean Institute** form the engineering, planetary-defense, anomalous-signal, exoplanet-atmosphere, and ocean-world transition through an isolated metrology spine, impact court, conductive cage, atmospheric shells, and pressure-split ice plates.
- **Genesis Ventworks**, **The Aegis Exomaterial Sanctuary**, **The Extremis Analog Ecologies Campus**, **The Chirality Ark**, and **The Protostellar Loom** complete the astrobiology arc with mineral chimneys, nested contamination shells, five environmental pods, opposed molecular crescents, and asymmetric planet-forming spiral arms.
- The black-basalt **Ecliptic Walk**, five crossings, **Orrery Court**, Dark-Sky Service Route, orbital inlays, and fifteen exact approaches form 21 grounded routes. The 1,433-mesh, approximately 143,000-triangle package has zero facility-envelope overlaps or sector violations, uses shielded red maintenance lighting, and participates in HLOD streaming, revision-14 persistence migration, text-state inspection, WALK navigation, selection, and GLB export. Interiors remain intentionally deferred by the supplied exterior specification.

## Inorganic Chemistry Labs District

The eastern outer-ring Inorganic Chemistry Labs District is a fifteen-building exterior campus whose basalt, ceramic, metal, salt-glass, and selective-emission palette turns mineral lattices and inorganic process systems into architecture.

- The Crystal Genome Foundry, Monatomic Catalyst Spire, Halide Ion Citadel, Breathing Framework Ark, and Solar-Fuels Leafworks establish the discovery, catalysis, solid-electrolyte, porous-framework, and photoelectrochemical research front.
- The Nitrogen Triple-Bond Forge, F-Block Containment Monastery, Lanthanide Cascade Refinery, Polyoxometalate Basilica, and Quantum Oxide Terraces translate mechanochemistry, restricted f-element work, rare-earth recovery, metal-oxide clusters, and epitaxial quantum materials into distinct process forms.
- The Megabar Diamond-Anvil Tower, Molten-Salt Thermal Keep, Biomineral Hybrid Conservatory, Carbon Mineralization Ramparts, and Valence Nexus and Coordination Crown complete the pressure, thermal, bioinorganic, mineral-storage, and coordination-chemistry program.
- Valence Avenue, the Stoichiometric Loop, Crystal Axis, F-Block Passage, four service links, and fifteen exact approaches form 23 grounded WALK routes. The 1,530-mesh package stays inside its outer-ring sector with zero facility-envelope overlaps and participates in HLOD streaming, project persistence, deterministic exterior animation, selection, text-state inspection, and GLB export. Interiors are intentionally deferred by the exterior specification.

## Biochemistry Labs District

The east-southeastern Biochemistry Labs District is a ten-building exterior narrative organized along the curving **Reaction Gradient**. Pale molecular architecture at the inner Genomics/Molecular Biology edge becomes progressively darker, heavier, and more mechanical toward Organic and Inorganic Chemistry.

- **Aminoform Foundry** folds three architectural protein chains around a binding-pocket entrance, residue-contact fins, engineered active sites, a suspended ligand, and high molecular-bond bridge.
- **Cryostratum** layers three vitrified specimen shells inside a black-water vibration moat, beneath a floating canopy and ringed cryogenic capsule tower with visible storage vessels and exhausts.
- **Metabolome Atlas** stacks five displaced tissue-section terraces around the Flux Field, analytical pixels, a reflective skybridge, and three instrument-like service towers.
- **Vesica Genesis** connects seven budding translucent protocells through six molecular-pore bridges above a signalling pool and disc approach.
- **Evozyme Loop** exposes four design-build-test-learn circuits, modular facades, skylight rings, four transfer towers, eight autonomous sample carriers, and a kinetic feedback portal.
- **Coacervum** merges five condensate masses beneath a rain-and-mist canopy beside a droplet basin, phase-separated satellites, drifting metallic condensates, and dissolving-ring observation mast.
- **Glycan Cipher** rises as a smoke-glass trunk wrapped by ten sugar-ring exoskeleton tiers, with five hierarchical branches, terminal glycan modules, and branching crown.
- **Proteostasis Citadel** holds an ordering cylindrical chamber inside two monumental chaperone rings, radial bridges, regulated louvers, and three folding/sorting/recycling wings.
- **Chronocatalysis Spire** separates two prismatic reaction-coordinate halves with a mirrored slit, logarithmic time bands and optical fins, state bridges, and a suspended transition crystal.
- **Ferrum Vita Forge** forms the dark industrial edge with a ribbed cathedral hall, four cell-free cascade stages, exposed cofactor pipes, three polyhedral metallocluster towers, catalytic entrance, and energy-recovery skyline.
- Three molecular flux traces, four district-interface links, one outer utility spine, eight reaction plazas, ten exact approaches, 30 sequence fields, six microfluidic channels, and 14 environmental samplers complete the district. The 1,287-mesh package has zero facility-envelope overlaps or sector violations and supports grounded WALK traversal, deterministic night systems, HLOD streaming, revision-8 persistence migration, text-state inspection, selection, and GLB export. Interiors remain intentionally deferred by the exterior specification.

## Molecular Biology Labs District

The Molecular Biology Labs District is a ten-facility exterior campus organized around the **Molecular Meridian**, with a skyline that progresses from low molecular landscapes through integrated mid-rise complexes to three vertical research landmarks.

- **Low molecular landscapes:** the seven translucent protocells of the Protosphere Complex, the braided Molecular Automata Loom, and the glacier-covered Cryptobiosis Vault.
- **Integrated complexes:** Genesis Forge's paired transcription wings, Asterion's three extraterrestrial-environment wings and tilted analysis disc, the host-and-organelle Symbiogenesis Arc, and the five-wing Morphogen Exchange.
- **Vertical landmarks:** Xenocodon Bastion's chiral containment monoliths, the chromatin-wrapped Palimpsest Tower, and the Darwin Engine's twelve evolving strata.
- The Molecular Meridian, paired interaction arcs, triplet branches, five plazas, and ten exact approaches form one grounded WALK network. Seventeen embedded information-light lines and 24 sensor landscapes communicate the district's scientific systems without conventional signage.
- The complete campus remains inside its middle-ring sector and supports normal selection, HLOD streaming, project persistence, deterministic animation, text-state inspection, and GLB export. Interiors are intentionally deferred by the exterior masterplan.

## Academic District instructions

Select **Academic District — Libraries & Theoretical Labs** in the Atlas, then use Explore or Walk to follow the leaf-strewn processional path through the Blackwood gate. Academic paths are rough earth/gravel dressings only 6 cm above terrain, with consistent 4.2 m secondary walks and a 5.8 m ceremonial avenue; the former raised steel-grey slabs and 3.4 m Great Hall plinth are gone. One connected network links the live thresholds of all fourteen facilities through six named routes: Processional Avenue, West Service Walk, Library Walk, Science Walk, South Transverse Walk, and East Canal Walk. Disconnected entrance stubs, the central five-spoke starburst, decorative lawn crosses, and the long diagonal chapel strip have been removed. The Processional Avenue now makes a broad symmetrical crescent around the monumental fountain before returning to the Great Hall axis. The gate is laid out to frame the central clock tower; Old Science Court, Chapel Close, Marlowe Courts, and the Blackwater Canal branch from the central quadrangles.

- In **Edit**, all fourteen named facilities appear as individual **Academic building** entries in the Atlas. Select a façade or its Atlas entry to identify the building and attach its own gizmo; name, scene label, description, position, rotation, scale, visibility, collision, colors, patterns, reset, Undo, save/reload, interior design, and GLB export operate on that facility without selecting the whole district. Nearby facility labels appear only in Edit to keep Explore and Walk uncluttered.

- Academic entrance cards, bells, reading-room light toggles, campus-map actions, gate controls, and other special object interactions are temporarily disabled in Walk. Ordinary movement, collision, exterior exploration, and automatic inside-building interior visibility remain active.
- The main gate still follows its time-of-day presentation, but its manual interaction is disabled with the other special object actions.
- The processional avenue connects the gate to four broad worn-stone Great Hall steps, an open Gothic arch, and a continuous walkable interior. Its fountain-safe crescent, tree rows, and deliberate canopy gaps retain the clock-tower sightline while keeping the gate, steps, entrances, and monument clear. Thirty-two human-scale vintage benches with aged-oak slats and cast-iron scroll ends are distributed through parks, courts, the canal edge, and the open avenue.
- The former **Gaslight Reading Courts** plaza now contains **The Well of Infinite Knowledge**: a 14 × 11.6 m asymmetrical polygonal basin and 10.8 m vertical composition of black stone, cantilevered planes, radial measurement channels, floating ceremonial platforms, an original standing Seshat, a structural infinity loop with restrained amber inlay, and a broken astrolabe-like ring. Dark mirror water, thin controlled sheets, drainage, scientific engravings, patina, mineral traces, moss, and rain-darkened materials keep its contemporary geometry tied to the historic campus.
- The Well's archival controls and inspection cameras remain authored but are hidden and inactive while special interactions are disabled.
- Save/Refresh preserves the Well's scene, water, light, engraving, material, restoration, cutaway, grid, ring, exact camera projection, and quality choices. Three fountain quality tiers share instanced channels, markers, platforms, engraved details, and water elements with close-detail culling and three statue LODs; generated resources and quality-specific shadow targets are disposed or reallocated before a static scene rebuild.
- A tall, visually permeable Collegiate Gothic boundary follows the complete Academic sector: the inner ring-road arc, both biodome avenues, and the coastal railway edge. Its 708 instanced bays use crested carved-stone piers, blackened iron bars, pointed arches, quatrefoils, and botanical motifs. The existing Blackwood gate remains the main inward entrance; ivy-clad brass-signed garden openings and their earth paths now overlap the Tundra and Desert radial arterial surfaces exactly, and an always-open monumental gate continues the canal bridge path to the rear railway.
- The 79-tree historic arboretum uses all 15 requested species in setting-specific groups: ancient English oaks and horse chestnuts occupy quadrangles; lindens and London planes line the ceremonial avenue; copper beeches frame libraries and administration; English yews, Irish yews, holly, and hawthorn shelter the chapel and graveyard; cedars of Lebanon stand inside the professors' garden; Scots pines surround Halley Observatory; willows and alders follow the canal and damp ground; European beeches form boundary groves and secluded walks; and rowans soften the Marlowe residential courts.
- Every logical tree retains editable procedural controls for structural variant, age, canopy density, leaf retention, moss, restrained ivy, deadwood, lean, and wind exposure. Veteran specimens can combine thick irregular trunks, exposed roots, pruning scars, hollow sections, dead secondary limbs, asymmetric crowns, and layered bark without forcing younger or historically introduced species into implausibly ancient forms.
- Campus audio is muted by default. Use **Audio muted** in the bottom layer bar to opt into low-volume synthesized wind, rain, controlled fountain flow, mechanical pump hum, restrained ring resonance, and bell audio; no loud audio autoplays.
- The Weather selector includes four district presets: **Late-autumn after rain**, **Overcast afternoon**, **Rainy dusk**, and **Foggy night**. Each coordinates sky, fog, precipitation, time of day, and restrained warm windows. Autumn trees use a dedicated seven-tone dark-green, olive, copper, russet, ochre, grey-brown, and muted-gold palette with full, thinning, and nearly bare crowns. Wet leaf collections accumulate around walls, drains, benches, exposed roots, cloisters, and residence bicycle racks instead of appearing as one uniform carpet.
- Canopies and secondary branches move subtly with deterministic, asynchronous phases. Wind response is species-specific and exposure-aware: flexible willows and rowans move more than veteran oaks, while yews, holly, cedar, and Scots pine remain comparatively restrained.
- Choose **Low**, **Medium**, or **High** in Graphics. Low limits pixel ratio and disables shadows, Medium keeps a balanced presentation, and High restores the maximum pixel ratio plus the single sun shadow. Expensive live updates pause while the tab is hidden.
- Arboretum trunks, branches, crown lobes, roots, defects, moss, ivy, and leaf deposits share instanced procedural kits and switch between near, mid, and far LOD tiers. WALK collision uses compact per-trunk barrier segments rather than district-spanning instanced-mesh bounds, so paths and entrances remain usable. GLB export temporarily selects the near-detail tree representation so Blender receives the authored trunks, branches, roots, and defects rather than the camera's last runtime LOD.
- Use **Debug** in the layer bar to show Academic District collision volumes in green, scene light positions in cyan, and live mesh/geometry/triangle/draw-call/texture statistics. Debug helpers are presentation-only and excluded from GLB export.

The building/history configuration is [src/data/academicCampus.ts](src/data/academicCampus.ts). `location` values use campus axes rather than world compass coordinates: the first value runs tangentially across the district wedge and the second runs radially from the island centre toward the canal. Editing a record updates the model, campus map, entrance card, and text snapshot together.

### Academic component hierarchy

```text
Academic District
├─ Main Entrance — gatehouses, porter lodge, notice board, iron leaves, open avenue
├─ Gothic Boundary — crested stone piers, permeable iron tracery, biodome gardens, railway gate
├─ Central Quadrangles — old lawn, entrance-linked walks, cloisters, scholar statue, reading courts
├─ Scholarship — Cerebrum Externum, Wren, Humanities, Theoretical Sciences, lecture hall, archive
├─ Ceremonial — clock-towered Great Hall, chapel/graveyard, dining hall/kitchen chimneys
├─ Old Science Court — Halley Observatory, Faraday building, instruments and inscriptions
├─ Residential — Marlowe ranges, small courts, bicycles and secluded laundry
├─ Well of Infinite Knowledge — Seshat, infinity loop, astrolabe ring, channels, platforms, cutaway and LOD
├─ Arboretum — 15 historic species, editable veteran defects, species wind, near/mid/far LOD
├─ Landscape — lawns, clipped hedges, ivy, wet fallen leaves, canal, bridge, reeds, boathouse
├─ Service — boiler court, delivery alley, coal/service doors, crates, pipes and sheds
└─ Hidden Discoveries — archive door, Rook Alley, lit basement/map room, blocked tunnel, raven
```

The principal optimization choices are shared unit geometries and cached procedural materials; cullable instanced Gothic fence bays, tree kits, leaf litter, windows, columns, ivy, vintage benches, and fountain repeats; spatial near/mid/far arboretum and monument LOD; emissive windows instead of one real-time light per room; tightly limited shadow-casting lights; precise authored fence, wall, trunk, basin, and plinth segments instead of aggregate decorative-mesh collision; and presentation-only debug/audio systems. Seeded albedo/height patterns give limestone staggered ashlar courses, damp streaks, pits, and lichen; brick gets mortar, soot, and efflorescence; slate gets overlapping chipped rows; oak and arboretum bark families get layered grain and relief; and the earth paths tile at a stable physical scale without downloaded textures.

## Import meshes

Choose **Import**, select the island location where the building should stand, and then choose the GLB, GLTF, OBJ, or STL file. A cyan/magenta marker previews and confirms the placement; press `Escape` or cancel the file picker to abort. Dragged exterior files use the same click-to-place step. Multiple files can be imported in one pass and are arranged around the selected point. Imports made while an Interior Design room is active retain the room-scale placement workflow.

| Format | Behavior |
| --- | --- |
| `.glb` | Preferred self-contained format; hierarchy and PBR materials are retained where supported. |
| `.gltf` | Supported. Drag the `.gltf` and any referenced `.bin`/texture sidecar files together so relative references can be resolved in the browser. |
| `.obj` | Geometry is imported; a separate MTL workflow is not currently provided. |
| `.stl` | Geometry receives a neutral physical material and generated vertex normals. |

An imported asset is centered on X/Z and grounded from the bottom of its bounding box. In Landscape it is fitted to roughly 8 world units and added near the current selection; inside Interior Design it is fitted to furniture scale and parented to the active building. Imported assets can be selected, transformed, hidden, reset, deleted, included in the next GLB export, and treated as obstacles in Walk mode. Importing is local to the browser; files are not uploaded.

## Export GLB and open it in Blender

### Production export (complete island, separate GLBs)

Click **Production** for the Blender handoff. Choose a parent folder when the
browser asks; SynthViewTopy creates a timestamped `YouTopy_Production_*` folder.
On browsers without folder-write support, the same folder tree is delivered as
one ZIP download.

Production export temporarily forces all 35 district and six biome detail
packages resident, mounts the complete Cerebrum Externum interior, selects the
highest authored export detail, and writes separate GLBs for:

- island terrain and the Blender PBR ocean;
- transit/coastal railway, Alpine logistics port, cyber-city bridge, and city;
- every district (one GLB per district) and every climate dome (one GLB per dome);
- imported/Design Studio assets, editable interiors, and global lighting when present.

The package also contains `00_PRODUCTION_MANIFEST.json`, the matching editable
project state, `README_BLENDER.txt`, and `import_youtopy_production.py`. Run the
Python script with `blender --python import_youtopy_production.py`, or import all
GLBs through **File > Import > glTF 2.0**. Component roots are already baked to
metres and world-positioned, so do not recenter or apply an additional scale in
Blender. Runtime streaming visibility is restored when export finishes or fails.

### Quick single-file export

1. Click **Export scene**. The browser downloads `YouTopy_Lab_Island.glb`.
2. In Blender, choose **File > Import > glTF 2.0** and select that file.
3. Use the Outliner to work with the named `LAB_ISLAND__BLENDER_EXPORT` hierarchy and its district architecture, terrain/biomes, transit/bridge, cyberpunk city, and imported-asset collections.
4. The design scale is **1 world unit = 10 metres**. glTF/Blender will initially interpret one exported unit as one metre; for real-world dimensions, scale the imported root hierarchy uniformly by `10`, then use **Object > Apply > Scale**.
5. Save as `.blend`, or use Blender's exporters to continue into other DCC and engine formats.

Only visible objects under the export root are written to GLB. Hidden districts/assets are intentionally omitted. The export adds a Blender-compatible PBR ocean fallback and directional sun; editor labels, selection bounds, transform gizmos, and the live shader sky/water presentation layers are not included.

### Editable project JSON

Hold **Shift** while clicking **Export scene** to download `YouTopy_Lab_Island.project.json` instead of GLB. This JSON records all definitions and current object transforms, visibility, accent colors, editor mode, weather/time/season state, camera position, the Well's interactive state, scale metadata, and source-sketch metadata. It is useful for versioning or a future round-trip editor workflow; the current UI exports this JSON but does not yet import it.

## Architecture

| Location | Responsibility |
| --- | --- |
| `index.html` | Application shell, Atlas, Inspector, mode switch, layer controls, and import/export actions |
| `src/main.ts` | UI bindings, keyboard controls, Inspector synchronization, import/export workflow, and app startup |
| `src/config/island.ts` | Shared island radius, plan projection, regular-hex/biome coordinates, ring-road radii, surface height, and Walk dimensions/speeds |
| `src/data/districts.ts` | Declarative masterplan: IDs, labels, rings, positions, footprints, heights, archetypes, palettes, and descriptions for all 35 districts and 6 domes |
| `src/data/districtCampusPlans.ts` | Description-specific facility, object, and biome-ecology programs used by the procedural population layer |
| `src/data/academicCampus.ts` | Editable Academic District building names, dates, histories, locations, interior flags, hidden details, and weather preset catalog |
| `src/data/academicFountain.ts` | Editable Well title, dedication, exact dimensions, scientific symbols, materials, scenes, cameras, restoration modes, quality tiers, water behavior, and interactions |
| `src/world/IslandWorld.ts` | Three.js scene lifecycle, camera/selection/edit/walk mode coordination, layers, day/night, mesh loaders, GLB exporter, and project JSON exporter |
| `src/world/WalkController.ts` | Pointer-lock mouse-look, keyboard movement, grounding, semantic surface sampling, collision checks, and inspect interaction |
| `src/world/editorAssets.ts` | Exterior/interior Design Studio catalog, GLB-safe procedural asset meshes, and reusable cutaway room shells |
| `src/world/procedural.ts` | Seeded procedural district and biome geometry/material generation |
| `src/world/securityDistrict.ts` | Fifteen-facility Aegis Arc exterior, curved security roads, embedded lighting, plazas, transparent landscaping, and district metadata |
| `src/world/molecularBiologyDistrict.ts` | Ten-facility molecular-biology exterior, Molecular Meridian circulation, interaction plazas, information-light network, sensor landscapes, and deterministic scientific animation |
| `src/world/inorganicChemistryLabsDistrict.ts` | Fifteen-facility mineral-and-lattice Inorganic Chemistry exterior, Valence Avenue circulation, selective node lighting, process machinery, and deterministic scientific animation |
| `src/world/industrialLabsDistrict.ts` | Fifteen-facility Industrial production landscape, Production Meridian, rail fan, pipe and conveyor skyline, deterministic process animation, and relocated legacy annex |
| `src/world/particlePhysicsLabsDistrict.ts` | Fifteen-facility Particle Physics exterior, central convention ring, event-track circulation, low-signal garden, northern theory ridge, fortified Data Coast, and deterministic data pulses |
| `src/world/computationalBiologyLabsDistrict.ts` | Ten-facility Computational Biology exterior, Inference Spine circulation, validation landscapes, scale transitions, and deterministic scientific signals |
| `src/world/academicDistrict.ts` | Reusable Gothic building shells, furnished interiors, gate, quadrangles, garden, canal, service areas, hidden discoveries, semantic access, and optimization metadata |
| `src/world/academicFountain.ts` | Modular Well of Infinite Knowledge geometry, Seshat/infinity/ring sculpture, procedural materials, water animation, camera/scene modes, LOD, collision, restoration, debug, state, and resource disposal |
| `src/world/academicSurfaceTextures.ts` | Cached deterministic limestone, brick, slate, oak, and leaf-strewn path albedo/height patterns |
| `src/world/academicAudio.ts` | Opt-in synthesized campus wind, rain, fountain flow, pump hum, ring resonance, and chapel-bell audio graph |
| `src/world/environment.ts` | Island shell, landscape, ocean/sky presentation, transit rings, bridge, and cyberpunk skyline |
| `src/style.css` | Responsive editor interface and scene-label styling |

For masterplan changes, start in `src/data/districts.ts`. Definitions are stable, named records rather than baked geometry, so positions, footprints, heights, labels, colors, and archetypes remain easy to revise. The five annular bands align to six shared road-bounded wedges; rings with seven named programs let two asymmetric campuses share one cell without introducing another visible delimiter. `src/data/districtCampusPlans.ts` assigns every program its own facilities and objects, while `src/world/procedural.ts` distributes them asymmetrically across each district cell. `src/world/districtRoadNetwork.ts` then normalizes authored streets, closes generic collector loops, and plans obstacle-aware graded handoffs to the ring arterials. The Academic District remains a reusable multi-mesh collegiate-Gothic kit with precise WALK collision segments and semantic access routes.

## Coordinates and scale

- Origin: the central megabuilding/core
- `+X`: east; `-X`: west
- `+Y`: up
- `+Z`: south; `-Z`: north
- Scale: 1 world unit = 10 metres
- Island: exact pointy-top regular hex with circumradius 552 world units
- North-to-south height: 1,104 world units = 11,040 metres
- East-to-west width: `sqrt(3) x 552` world units, approximately 956 units = 9,560 metres
- District source projection: the original sketch coordinates are unwarped with `X x 1.2` and `Z x 1.8`
- Biome dome centers: exact pointy-hex directions at radius 456 world units
- District ring-road radii: 84, 126, 177, 240, and 309 world units
- Original sketch boundary radii: 14, 21, 29.5, 40, and 51.5 world units before the 6x masterplan expansion
- Three continuous radial roads connect opposite biome domes through the origin, producing the six visible spoke boundaries used with the concentric roads
